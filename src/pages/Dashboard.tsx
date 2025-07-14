import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeResume, AnalysisResult } from '../lib/openai';
import { extractTextFromFile, generateSHA256Hash, toSentenceCase } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { trackResumeAnalysis, trackFileUpload } from '../lib/analytics';
import { Upload, FileText, Brain, AlertCircle, CheckCircle, ArrowRight, TrendingUp, Loader2, X, Lock, Info } from 'lucide-react';

const STORAGE_KEY = 'zolla_dashboard_state';

interface DashboardState {
  currentStep: number;
  resumeText: string;
  jobDescription: string;
  selectedAnalysisTypes: string[];
  fileName: string | null;
  analysisResult: AnalysisResult | null;
  usedCachedResult: boolean;
}

const Dashboard: React.FC = () => {
  // Initialize state with default values
  const getInitialState = (): DashboardState => ({
    currentStep: 1,
    resumeText: '',
    jobDescription: '',
    selectedAnalysisTypes: ['job_match_analysis'],
    fileName: null,
    analysisResult: null,
    usedCachedResult: false,
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load state from sessionStorage
  const loadState = (): DashboardState => {
    // Check if we have initial analysis result from history
    if (location.state?.initialAnalysisResult) {
      const initialState = getInitialState();
      return {
        ...initialState,
        currentStep: 4,
        analysisResult: location.state.initialAnalysisResult,
        resumeText: location.state.originalResumeText || '',
        jobDescription: location.state.originalJobDescription || '',
        usedCachedResult: true
      };
    }
    
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Validate that the parsed state has the expected structure
        if (parsedState && typeof parsedState === 'object') {
          return {
            ...getInitialState(),
            ...parsedState,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load dashboard state from sessionStorage:', error);
    }
    return getInitialState();
  };

  const [dashboardState, setDashboardState] = useState<DashboardState>(loadState);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear location state after loading to prevent re-initialization
  useEffect(() => {
    if (location.state?.initialAnalysisResult) {
      // Clear the state to prevent re-initialization on subsequent visits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardState));
    } catch (error) {
      console.warn('Failed to save dashboard state to sessionStorage:', error);
    }
  }, [dashboardState]);

  // Helper function to update dashboard state
  const updateState = (updates: Partial<DashboardState>) => {
    setDashboardState(prev => ({ ...prev, ...updates }));
  };

  // Reset analysis and clear stored state
  const handleResetAnalysis = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear dashboard state from sessionStorage:', error);
    }
    setDashboardState(getInitialState());
    setError(null);
    // Reset the file input
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const analysisOptions = [
    {
      id: 'job_match_analysis',
      label: 'Job Match Analysis',
      description: 'Core compatibility scoring and keyword matching',
      isPremium: false,
      isCore: true
    },
    {
      id: 'ats_compatibility',
      label: 'ATS Compatibility Check',
      description: 'Check if your resume passes automated screening',
      isPremium: false,
      isCore: false
    },
    {
      id: 'impact_statement_review',
      label: 'Impact Statement Review',
      description: 'Identify weak accomplishments and achievements',
      isPremium: false,
      isCore: false
    },
    {
      id: 'skills_gap_assessment',
      label: 'Skills Gap Assessment',
      description: 'Compare your skills to job requirements',
      isPremium: false,
      isCore: false
    },
    {
      id: 'format_optimization',
      label: 'Format Optimization',
      description: 'Review resume formatting and structure',
      isPremium: false,
      isCore: false
    },
    {
      id: 'career_story_flow',
      label: 'Career Story Flow Analysis',
      description: 'Analyze career progression narrative',
      isPremium: false,
      isCore: false
    }
  ];

  const handleAnalysisTypeChange = (analysisType: string) => {
    updateState({
      selectedAnalysisTypes: dashboardState.selectedAnalysisTypes.includes(analysisType)
        ? dashboardState.selectedAnalysisTypes.filter(type => type !== analysisType)
        : [...dashboardState.selectedAnalysisTypes, analysisType]
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    updateState({ fileName: file.name });

    try {
      const extractedText = await extractTextFromFile(file);
      updateState({ resumeText: extractedText });
      
      // Track file upload
      trackFileUpload(file.type, file.size);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      updateState({ fileName: null });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    updateState({ fileName: null, resumeText: '' });
    setError(null);
    // Reset the file input
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!dashboardState.resumeText.trim()) {
      setError('Please provide your resume text.');
      return;
    }

    // Check if job description is required
    const needsJobDescription = dashboardState.selectedAnalysisTypes.includes('job_match_analysis');
    if (needsJobDescription && !dashboardState.jobDescription.trim()) {
      setError('Please provide the job description for job match analysis.');
      return;
    }

    if (!user) {
      setError('Please sign in to analyze your resume.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    updateState({ usedCachedResult: false });

    try {
      // Generate hashes for deduplication (only if job description is provided)
      let resumeHash = '';
      let jobDescriptionHash = '';
      
      if (needsJobDescription) {
        resumeHash = await generateSHA256Hash(dashboardState.resumeText);
        jobDescriptionHash = await generateSHA256Hash(dashboardState.jobDescription);

        // Check for existing analysis with same content hashes
        const { data: existingAnalysis, error: queryError } = await supabase
          .from('resume_analyses')
          .select('compatibility_score, keyword_matches, experience_gaps, skill_gaps, analysis_details')
          .eq('user_id', user.id)
          .eq('resume_hash', resumeHash)
          .eq('job_description_hash', jobDescriptionHash)
          .limit(1)
          .maybeSingle();

        if (!queryError && existingAnalysis !== null) {
          // Use cached result
          const cachedResult: AnalysisResult = existingAnalysis.analysis_details || {
            match_summary: "This analysis was retrieved from your previous submission with the same resume and job description.",
            match_score: `${existingAnalysis.compatibility_score}/100`,
            job_keywords_detected: existingAnalysis.keyword_matches.map(keyword => ({
              keyword,
              status: 'Present' as const
            })),
            gaps_and_suggestions: existingAnalysis.experience_gaps
          };

          updateState({ 
            analysisResult: cachedResult, 
            usedCachedResult: true, 
            currentStep: 4 
          });
          setIsAnalyzing(false);
          return;
        }
      }

      // Filter analysis types to only include non-premium ones for the API call
      const allowedAnalysisTypes = dashboardState.selectedAnalysisTypes.filter(type => 
        !analysisOptions.find(option => option.id === type)?.isPremium
      );

      // No existing analysis found, proceed with new AI analysis
      const result = await analyzeResume(
        dashboardState.resumeText, 
        needsJobDescription ? dashboardState.jobDescription : '', 
        allowedAnalysisTypes.filter(type => type !== 'job_match_analysis') // Remove job_match_analysis as it's always included
      );
      updateState({ analysisResult: result });

      // Track analysis completion
      const score = getNumericScore(result.match_score);
      trackResumeAnalysis(allowedAnalysisTypes.join(','), score);

      // Save the new analysis with hashes for future deduplication
      if (needsJobDescription) {
        const numericScore = getNumericScore(result.match_score);
        const presentKeywords = result.job_keywords_detected
          .filter(item => item.status === 'Present')
          .map(item => item.keyword);

        await supabase.from('resume_analyses').insert({
          user_id: user.id,
          compatibility_score: numericScore,
          keyword_matches: presentKeywords,
          experience_gaps: result.gaps_and_suggestions,
          skill_gaps: [], // Empty array as new format combines all gaps
          resume_hash: resumeHash,
          job_description_hash: jobDescriptionHash,
          analysis_details: result,
          original_resume_text: dashboardState.resumeText,
          original_job_description: needsJobDescription ? dashboardState.jobDescription : null,
        });
      }

      updateState({ currentStep: 4 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetTailoredResume = () => {
    navigate('/premium', { 
      state: { 
        resumeText: dashboardState.resumeText, 
        jobDescription: dashboardState.jobDescription, 
        analysisResult: dashboardState.analysisResult 
      } 
    });
  };

  // Helper function to extract numeric score from match_score string
  const getNumericScore = (matchScore: string): number => {
    const match = matchScore.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Helper function to count issues found in analysis
  const getIssuesCount = () => {
    if (!dashboardState.analysisResult) return { total: 0, details: [] };
    
    const issues = [];
    let total = 0;

    // ATS compatibility issues
    if (dashboardState.analysisResult.ats_compatibility?.issues?.length) {
      const count = dashboardState.analysisResult.ats_compatibility.issues.length;
      issues.push(`${count} ATS compatibility problem${count > 1 ? 's' : ''}`);
      total += count;
    }

    // Missing keywords
    if (dashboardState.analysisResult.job_keywords_detected) {
      const missingCount = dashboardState.analysisResult.job_keywords_detected.filter(
        item => item.status === 'Missing'
      ).length;
      if (missingCount > 0) {
        issues.push(`${missingCount} missing keyword${missingCount > 1 ? 's' : ''}`);
        total += missingCount;
      }
    }

    // Weak impact statements
    if (dashboardState.analysisResult.impact_statement_review?.weak_statements?.length) {
      const count = dashboardState.analysisResult.impact_statement_review.weak_statements.length;
      issues.push(`${count} weak impact statement${count > 1 ? 's' : ''}`);
      total += count;
    }

    // Skills gaps
    if (dashboardState.analysisResult.skills_gap_assessment?.missing_skills?.length) {
      const count = dashboardState.analysisResult.skills_gap_assessment.missing_skills.length;
      issues.push(`${count} skill gap${count > 1 ? 's' : ''}`);
      total += count;
    }

    // Format issues
    if (dashboardState.analysisResult.format_optimization?.issues?.length) {
      const count = dashboardState.analysisResult.format_optimization.issues.length;
      issues.push(`${count} format issue${count > 1 ? 's' : ''}`);
      total += count;
    }

    // Career story issues
    if (dashboardState.analysisResult.career_story_flow?.issues?.length) {
      const count = dashboardState.analysisResult.career_story_flow.issues.length;
      issues.push(`${count} career story issue${count > 1 ? 's' : ''}`);
      total += count;
    }

    // General gaps and suggestions
    if (dashboardState.analysisResult.gaps_and_suggestions?.length) {
      const count = dashboardState.analysisResult.gaps_and_suggestions.length;
      if (total === 0) { // Only count these if no specific issues were found
        issues.push(`${count} improvement area${count > 1 ? 's' : ''}`);
        total += count;
      }
    }

    return { total, details: issues };
  };

  const isJobMatchSelected = dashboardState.selectedAnalysisTypes.includes('job_match_analysis');

  const renderStep = () => {
    switch (dashboardState.currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
              <p className="text-sm sm:text-base text-gray-600">Upload your resume file or paste your resume text</p>
            </div>

            <div className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
              isUploading 
                ? 'border-blue-400 bg-blue-50' 
                : dashboardState.fileName 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400'
            }`}>
              {isUploading ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
                  <span className="text-blue-600 font-medium text-sm sm:text-base">Processing file...</span>
                  <span className="text-xs sm:text-sm text-gray-500">Extracting text from {dashboardState.fileName}</span>
                </div>
              ) : dashboardState.fileName ? (
                <div className="flex flex-col items-center space-y-3">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <span className="text-green-600 font-medium text-sm sm:text-base">File uploaded successfully!</span>
                  <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border max-w-full">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700 truncate">{dashboardState.fileName}</span>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    <span className="text-sm sm:text-base text-gray-600">Click to upload or drag and drop</span>
                    <span className="text-xs sm:text-sm text-gray-500">DOCX or TXT files only</span>
                  </label>
                </>
              )}
            </div>

            <div className="text-center text-gray-500">
              <span className="text-sm sm:text-base">or</span>
            </div>

            <div>
              <label htmlFor="resume-text" className="block text-sm font-medium text-gray-700 mb-2">
                Paste your resume text here
              </label>
              <textarea
                id="resume-text"
                value={dashboardState.resumeText}
                onChange={(e) => updateState({ resumeText: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                placeholder="Paste your resume text here..."
              />
            </div>

            <button
              onClick={() => updateState({ currentStep: 2 })}
              disabled={!dashboardState.resumeText.trim() || isUploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {isUploading ? 'Processing...' : 'Next: Select Analysis Types'}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">What would you like to analyze?</h3>
              <p className="text-sm sm:text-base text-gray-600">Select analysis types for comprehensive insights</p>
            </div>

            {/* Analysis Types Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
                Analysis Options
              </h4>
              <div className="space-y-3 sm:space-y-4">
                {analysisOptions.map((option) => (
                  <div key={option.id} className="relative">
                    <label className={`flex items-start space-x-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                      dashboardState.selectedAnalysisTypes.includes(option.id)
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                    } ${option.isPremium ? 'opacity-75' : ''}`}>
                      <input
                        type="checkbox"
                        checked={dashboardState.selectedAnalysisTypes.includes(option.id)}
                        onChange={() => handleAnalysisTypeChange(option.id)}
                        disabled={option.isPremium}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base">
                            {option.label}
                          </h5>
                          {option.isPremium && (
                            <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                          )}
                          {option.isCore && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Core
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </label>
                    {option.isPremium && (
                      <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded border">
                          Premium Feature
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> Select multiple options for comprehensive analysis. Premium features will be available after upgrading.
                  </span>
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Analysis Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Resume: {dashboardState.fileName ? dashboardState.fileName : `${dashboardState.resumeText.length} characters`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Analysis Types: {dashboardState.selectedAnalysisTypes.length} selected
                  </span>
                </div>
                {isJobMatchSelected && (
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Job description required for job match analysis
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => updateState({ currentStep: 1 })}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (isJobMatchSelected) {
                    updateState({ currentStep: 3 });
                  } else {
                    handleAnalyze();
                  }
                }}
                disabled={dashboardState.selectedAnalysisTypes.length === 0}
                className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {isJobMatchSelected ? (
                  <>
                    <span>Next: Add Job Description</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Job Description</h3>
              <p className="text-sm sm:text-base text-gray-600">Paste the job description you want to apply for</p>
            </div>

            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                id="job-description"
                value={dashboardState.jobDescription}
                onChange={(e) => updateState({ jobDescription: e.target.value })}
                maxLength={6000}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                placeholder="Paste the job description here..."
              />
              
              {/* Character count display */}
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  Paste the complete job description including requirements, responsibilities, and qualifications
                </div>
                <div className={`text-xs font-medium ${
                  dashboardState.jobDescription.length > 5500 
                    ? 'text-red-600' 
                    : dashboardState.jobDescription.length > 5000 
                      ? 'text-orange-600' 
                      : 'text-gray-500'
                }`}>
                  {dashboardState.jobDescription.length}/6000 characters
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => updateState({ currentStep: 2 })}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!dashboardState.jobDescription.trim() || isAnalyzing}
                className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        const issuesCount = getIssuesCount();
        
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Analysis Complete!</h3>
              <p className="text-sm sm:text-base text-gray-600">Here's your resume analysis results</p>
              {dashboardState.usedCachedResult && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Retrieved from previous analysis
                </div>
              )}
            </div>

            {dashboardState.analysisResult && (
              <div className="space-y-4 sm:space-y-6">
                {/* Overall Analysis Score - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.match_score && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                      Overall Analysis Score
                    </h4>
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 sm:h-4 rounded-full transition-all duration-500"
                            style={{ width: `${getNumericScore(dashboardState.analysisResult.match_score)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {dashboardState.analysisResult.match_score}
                      </div>
                    </div>
                  </div>
                )}

                {/* Match Summary - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.match_summary && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                      Job Match Analysis
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{dashboardState.analysisResult.match_summary}</p>
                  </div>
                )}

{/* Job Keywords Detected - only show if job match analysis was performed */}
{isJobMatchSelected && dashboardState.analysisResult.job_keywords_detected && (
  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Keywords Detected</h4>
    <div className="grid grid-cols-1 gap-2 sm:gap-3">
      {dashboardState.analysisResult.job_keywords_detected.map((item, index) => (
        <div 
          key={index} 
          className={`p-2 sm:p-3 rounded-lg flex items-center justify-center sm:justify-between ${
            item.status === 'Present' 
              ? 'bg-green-100 border border-green-200'  // Darkened from green-50 to green-100
              : 'bg-red-100 border border-red-200'     // Darkened from red-50 to red-100
          }`}
        >
          <span className="text-sm sm:text-base text-gray-700 font-medium text-center sm:text-left">
            {toSentenceCase(item.keyword)}
          </span>
          <span className={`hidden sm:block px-2 py-1 rounded-full text-xs font-medium ${
            item.status === 'Present' 
              ? 'bg-green-400 text-green-800'  // Darkened from green-100 to green-400
              : 'bg-red-400 text-red-800'      // Darkened from red-100 to red-400
          }`}>
            {item.status === 'Present' ? '✅ Present' : '❌ Missing'}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

                {/* Gaps and Suggestions - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.gaps_and_suggestions && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Gaps and Suggestions</h4>
                    <ul className="space-y-2 sm:space-y-3">
                      {dashboardState.analysisResult.gaps_and_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Analysis Results */}
                {dashboardState.analysisResult.ats_compatibility && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                      ATS Compatibility ({dashboardState.analysisResult.ats_compatibility.score}/10)
                      {dashboardState.analysisResult.ats_compatibility.score < 7 && (
                        <span className="ml-2 text-orange-600">⚠️ Issues Found</span>
                      )}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 mb-3">{dashboardState.analysisResult.ats_compatibility.summary}</p>
                    {dashboardState.analysisResult.ats_compatibility.issues.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 text-sm">Issues Found:</h5>
                        <ul className="space-y-1">
                          {dashboardState.analysisResult.ats_compatibility.issues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {dashboardState.analysisResult.impact_statement_review && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
                      Impact Statement Review ({dashboardState.analysisResult.impact_statement_review.score}/10)
                      {dashboardState.analysisResult.impact_statement_review.score < 7 && (
                        <span className="ml-2 text-orange-600">🎯 Needs improvement</span>
                      )}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 mb-3">{dashboardState.analysisResult.impact_statement_review.summary}</p>
                    {dashboardState.analysisResult.impact_statement_review.weak_statements.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 text-sm">Weak Statements:</h5>
                        <ul className="space-y-1">
                          {dashboardState.analysisResult.impact_statement_review.weak_statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{statement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Premium Value Proposition - Show for ALL analyses */}
                {dashboardState.analysisResult && issuesCount.total > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center">
                      🎯 Ready to Fix These Issues?
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 mb-4">
                      Your analysis revealed {issuesCount.details.join(', ')}. Get an enhanced resume that addresses ALL these issues:
                    </p>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>✨ Rewritten impact statements with quantified results</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>✨ ATS-optimized formatting</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>✨ Strategic keyword integration</span>
                      </li>
                      <li className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>✨ Skills section optimization</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* CTA - Show for ALL analyses */}
                {dashboardState.analysisResult && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
                    <h4 className="text-lg sm:text-xl font-semibold mb-2">
                      {isJobMatchSelected ? 'Want a Tailored Resume & Cover Letter?' : 'Ready to Enhance Your Resume?'}
                    </h4>
                    <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                      {isJobMatchSelected 
                        ? 'Get a professionally optimized resume and compelling cover letter that matches this job description perfectly.'
                        : 'Get a professionally optimized resume and compelling cover letter that addresses all identified issues and enhances your job prospects.'
                      }
                    </p>
                    <button
                      onClick={handleGetTailoredResume}
                      className="bg-white text-blue-600 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                    >
                      <span>Get Enhanced Resume & Cover Letter</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                )}

                {/* Analysis Complete Message */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 sm:p-6 text-center">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Analysis Complete!</h4>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Your resume analysis is complete. Ready to analyze another resume or enhance this one?
                  </p>
                  <button
                    onClick={handleResetAnalysis}
                    className="bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Analyze Another Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Resume Analysis Dashboard</h3>
        <p className="text-sm sm:text-base text-gray-600">Analyze your resume with AI-powered insights</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm ${
                step <= dashboardState.currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                  step < dashboardState.currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3 sm:mt-4 space-x-4 sm:space-x-8">
          <span className="text-xs sm:text-sm text-gray-600">Upload</span>
          <span className="text-xs sm:text-sm text-gray-600">Analysis Types</span>
          <span className="text-xs sm:text-sm text-gray-600">Job Description</span>
          <span className="text-xs sm:text-sm text-gray-600">Results</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
          <div className="flex">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        {renderStep()}
      </div>
    </div>
  );
};

export default Dashboard;