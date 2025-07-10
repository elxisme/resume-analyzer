import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeResume, AnalysisResult } from '../lib/openai';
import { extractTextFromFile, generateSHA256Hash, toSentenceCase } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Upload, FileText, Brain, AlertCircle, CheckCircle, ArrowRight, TrendingUp, Loader2, X, Lock, Info, Sparkles, Star, Award, Target, Zap, Shield } from 'lucide-react';

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
      isCore: true,
      icon: Target,
      color: 'blue'
    },
    {
      id: 'ats_compatibility',
      label: 'ATS Compatibility Check',
      description: 'Check if your resume passes automated screening',
      isPremium: false,
      isCore: false,
      icon: Shield,
      color: 'green'
    },
    {
      id: 'impact_statement_review',
      label: 'Impact Statement Review',
      description: 'Identify weak accomplishments and achievements',
      isPremium: false,
      isCore: false,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      id: 'skills_gap_assessment',
      label: 'Skills Gap Assessment',
      description: 'Compare your skills to job requirements',
      isPremium: true,
      isCore: false,
      icon: Star,
      color: 'orange'
    },
    {
      id: 'format_optimization',
      label: 'Format Optimization',
      description: 'Review resume formatting and structure',
      isPremium: true,
      isCore: false,
      icon: Award,
      color: 'pink'
    },
    {
      id: 'career_story_flow',
      label: 'Career Story Flow Analysis',
      description: 'Analyze career progression narrative',
      isPremium: true,
      isCore: false,
      icon: Zap,
      color: 'indigo'
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
          .single();

        if (!queryError && existingAnalysis) {
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
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 sm:mb-6 shadow-xl">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur-xl"></div>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Upload Your Resume</h3>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">Upload your resume file or paste your resume text to get started with AI-powered analysis</p>
            </div>

            <div className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${
              isUploading 
                ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                : dashboardState.fileName 
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:shadow-lg'
            }`}>
              {isUploading ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 animate-spin" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-blue-600 font-bold text-lg sm:text-xl">Processing file...</span>
                    <p className="text-sm sm:text-base text-gray-600">Extracting text from {dashboardState.fileName}</p>
                  </div>
                </div>
              ) : dashboardState.fileName ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
                    <div className="absolute inset-0 bg-green-400/20 rounded-full blur-lg"></div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-green-600 font-bold text-lg sm:text-xl">File uploaded successfully!</span>
                    <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border shadow-sm max-w-full">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700 truncate font-medium">{dashboardState.fileName}</span>
                      <button
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 p-1 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
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
                    className="cursor-pointer flex flex-col items-center space-y-4 group"
                  >
                    <div className="relative">
                      <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <div className="absolute inset-0 bg-blue-400/0 group-hover:bg-blue-400/20 rounded-full blur-lg transition-all"></div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-lg sm:text-xl font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Click to upload or drag and drop</span>
                      <p className="text-sm sm:text-base text-gray-500">DOCX or TXT files only • Max 10MB</p>
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="resume-text" className="block text-lg font-bold text-gray-900">
                Paste your resume text here
              </label>
              <textarea
                id="resume-text"
                value={dashboardState.resumeText}
                onChange={(e) => updateState({ resumeText: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-lg transition-all duration-300 resize-none"
                placeholder="Paste your resume text here..."
              />
              <p className="text-sm text-gray-500">
                {dashboardState.resumeText.length} characters • Recommended: 1000+ characters for best analysis
              </p>
            </div>

            <button
              onClick={() => updateState({ currentStep: 2 })}
              disabled={!dashboardState.resumeText.trim() || isUploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 sm:py-5 px-6 rounded-2xl font-bold text-lg sm:text-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform flex items-center justify-center space-x-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Next: Select Analysis Types</span>
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </>
              )}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 sm:mb-6 shadow-xl">
                <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-2xl blur-xl"></div>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">What would you like to analyze?</h3>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Select analysis types for comprehensive insights into your resume's performance</p>
            </div>

            {/* Analysis Types Selection */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 sm:p-8 shadow-xl">
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-gray-900">Analysis Options</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {analysisOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = dashboardState.selectedAnalysisTypes.includes(option.id);
                  
                  return (
                    <div key={option.id} className="relative group">
                      <label className={`flex items-start space-x-4 p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        isSelected
                          ? `border-${option.color}-400 bg-gradient-to-br from-${option.color}-50 to-${option.color}-100 shadow-lg`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 hover:shadow-lg'
                      } ${option.isPremium ? 'opacity-75' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleAnalysisTypeChange(option.id)}
                          disabled={option.isPremium}
                          className={`mt-1 h-5 w-5 text-${option.color}-600 focus:ring-${option.color}-500 border-gray-300 rounded disabled:opacity-50 transition-all`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-8 h-8 bg-gradient-to-br from-${option.color}-500 to-${option.color}-600 rounded-xl flex items-center justify-center shadow-lg`}>
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-bold text-gray-900 text-base sm:text-lg">
                                {option.label}
                              </h5>
                              {option.isPremium && (
                                <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-100 to-yellow-100 px-2 py-1 rounded-full">
                                  <Lock className="h-3 w-3 text-orange-600" />
                                  <span className="text-xs font-bold text-orange-700">PRO</span>
                                </div>
                              )}
                              {option.isCore && (
                                <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">
                                  CORE
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </label>
                      {option.isPremium && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/80 to-gray-200/80 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <div className="bg-white px-4 py-2 rounded-xl border-2 border-orange-200 shadow-lg">
                            <span className="text-sm font-bold text-orange-700 flex items-center space-x-2">
                              <Sparkles className="h-4 w-4" />
                              <span>Premium Feature</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-blue-900 mb-1">Pro Tip</h5>
                    <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                      Select multiple options for comprehensive analysis. Premium features will be available after upgrading to unlock advanced insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-lg">
              <h4 className="font-black text-gray-900 text-lg sm:text-xl mb-4 sm:mb-6 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <span>Analysis Summary</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Resume</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      {dashboardState.fileName ? dashboardState.fileName : `${dashboardState.resumeText.length} chars`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Analysis Types</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      {dashboardState.selectedAnalysisTypes.length} selected
                    </p>
                  </div>
                </div>
                
                {isJobMatchSelected && (
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">Next Step</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        Job description required
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => updateState({ currentStep: 1 })}
                className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-4 sm:py-5 px-6 rounded-2xl font-bold text-lg hover:from-gray-300 hover:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 sm:py-5 px-6 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                {isJobMatchSelected ? (
                  <>
                    <span>Next: Add Job Description</span>
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 sm:mb-6 shadow-xl">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-2xl blur-xl"></div>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Add Job Description</h3>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Paste the job description you want to apply for to get targeted analysis and recommendations</p>
            </div>

            <div className="space-y-4">
              <label htmlFor="job-description" className="block text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <span>Job Description</span>
              </label>
              <textarea
                id="job-description"
                value={dashboardState.jobDescription}
                onChange={(e) => updateState({ jobDescription: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-base sm:text-lg transition-all duration-300 resize-none"
                placeholder="Paste the complete job description here..."
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{dashboardState.jobDescription.length} characters</span>
                <span>Recommended: Include requirements, responsibilities, and qualifications</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-indigo-200">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-bold text-indigo-900 mb-1">Better Job Description = Better Analysis</h5>
                  <p className="text-sm sm:text-base text-indigo-800 leading-relaxed">
                    Include the complete job posting with requirements, responsibilities, and qualifications for the most accurate keyword matching and compatibility scoring.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => updateState({ currentStep: 2 })}
                className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-4 sm:py-5 px-6 rounded-2xl font-bold text-lg hover:from-gray-300 hover:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!dashboardState.jobDescription.trim() || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 sm:py-5 px-6 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
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
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-3xl blur-xl animate-pulse"></div>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Analysis Complete!</h3>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Here's your comprehensive resume analysis results</p>
              {dashboardState.usedCachedResult && (
                <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Retrieved from previous analysis
                </div>
              )}
            </div>

            {dashboardState.analysisResult && (
              <div className="space-y-6 sm:space-y-8">
                {/* Overall Analysis Score - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.match_score && (
                  <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span>Overall Analysis Score</span>
                    </h4>
                    <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4 sm:h-6 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-4 sm:h-6 rounded-full transition-all duration-1000 shadow-lg"
                            style={{ width: `${getNumericScore(dashboardState.analysisResult.match_score)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                        {dashboardState.analysisResult.match_score}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                        <p className="text-xs sm:text-sm text-green-600 font-bold">EXCELLENT</p>
                        <p className="text-lg sm:text-xl font-black text-green-700">80-100</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                        <p className="text-xs sm:text-sm text-yellow-600 font-bold">GOOD</p>
                        <p className="text-lg sm:text-xl font-black text-yellow-700">60-79</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                        <p className="text-xs sm:text-sm text-red-600 font-bold">NEEDS WORK</p>
                        <p className="text-lg sm:text-xl font-black text-red-700">0-59</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Match Summary - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.match_summary && (
                  <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span>Job Match Analysis</span>
                    </h4>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed bg-white p-4 sm:p-6 rounded-xl border border-blue-100">{dashboardState.analysisResult.match_summary}</p>
                  </div>
                )}

                {/* Job Keywords Detected - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.job_keywords_detected && (
                  <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span>Job Keywords Detected</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {dashboardState.analysisResult.job_keywords_detected.map((item, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 ${
                          item.status === 'Present' 
                            ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-100 hover:shadow-lg' 
                            : 'border-red-200 bg-gradient-to-r from-red-50 to-red-100 hover:shadow-lg'
                        }`}>
                          <span className="text-sm sm:text-base text-gray-800 font-bold truncate mr-3">{toSentenceCase(item.keyword)}</span>
                          <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 flex items-center space-x-1 ${
                            item.status === 'Present' 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-red-200 text-red-800'
                          }`}>
                            <span>{item.status === 'Present' ? '✅' : '❌'}</span>
                            <span>{item.status === 'Present' ? 'Present' : 'Missing'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps and Suggestions - only show if job match analysis was performed */}
                {isJobMatchSelected && dashboardState.analysisResult.gaps_and_suggestions && (
                  <div className="bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span>Gaps and Suggestions</span>
                    </h4>
                    <ul className="space-y-3 sm:space-y-4">
                      {dashboardState.analysisResult.gaps_and_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-5 bg-white rounded-xl border border-orange-100 hover:shadow-lg transition-all duration-300">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Analysis Results */}
                {dashboardState.analysisResult.ats_compatibility && (
                  <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span>ATS Compatibility ({dashboardState.analysisResult.ats_compatibility.score}/10)</span>
                      {dashboardState.analysisResult.ats_compatibility.score < 7 && (
                        <span className="text-orange-600 flex items-center space-x-1">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-bold">Issues Found</span>
                        </span>
                      )}
                    </h4>
                    <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl border border-blue-100">{dashboardState.analysisResult.ats_compatibility.summary}</p>
                    {dashboardState.analysisResult.ats_compatibility.issues.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        <h5 className="font-black text-gray-900 text-base sm:text-lg">Issues Found:</h5>
                        <ul className="space-y-2 sm:space-y-3">
                          {dashboardState.analysisResult.ats_compatibility.issues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-3 p-3 sm:p-4 bg-white rounded-xl border border-orange-100">
                              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm sm:text-base text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {dashboardState.analysisResult.impact_statement_review && (
                  <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span>Impact Statement Review ({dashboardState.analysisResult.impact_statement_review.score}/10)</span>
                      {dashboardState.analysisResult.impact_statement_review.score < 7 && (
                        <span className="text-orange-600 flex items-center space-x-1">
                          <Target className="h-5 w-5" />
                          <span className="font-bold">Needs improvement</span>
                        </span>
                      )}
                    </h4>
                    <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl border border-purple-100">{dashboardState.analysisResult.impact_statement_review.summary}</p>
                    {dashboardState.analysisResult.impact_statement_review.weak_statements.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        <h5 className="font-black text-gray-900 text-base sm:text-lg">Weak Statements:</h5>
                        <ul className="space-y-2 sm:space-y-3">
                          {dashboardState.analysisResult.impact_statement_review.weak_statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-3 p-3 sm:p-4 bg-white rounded-xl border border-orange-100">
                              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm sm:text-base text-gray-700">{statement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Premium Value Proposition - Show for ALL analyses */}
                {dashboardState.analysisResult && issuesCount.total > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl"></div>
                    <div className="relative">
                      <h4 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4 flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center">
                          <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <span>Ready to Fix These Issues?</span>
                      </h4>
                      <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                        Your analysis revealed <span className="font-bold text-orange-700">{issuesCount.details.join(', ')}</span>. Get an enhanced resume that addresses ALL these issues:
                      </p>
                      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        <li className="flex items-center space-x-3 text-sm sm:text-base">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">✨ Rewritten impact statements with quantified results</span>
                        </li>
                        <li className="flex items-center space-x-3 text-sm sm:text-base">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">✨ ATS-optimized formatting</span>
                        </li>
                        <li className="flex items-center space-x-3 text-sm sm:text-base">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">✨ Strategic keyword integration</span>
                        </li>
                        <li className="flex items-center space-x-3 text-sm sm:text-base">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">✨ Skills section optimization</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* CTA - Show for ALL analyses */}
                {dashboardState.analysisResult && (
                  <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4">
                        {isJobMatchSelected ? 'Want a Tailored Resume & Cover Letter?' : 'Ready to Enhance Your Resume?'}
                      </h4>
                      <p className="mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl leading-relaxed">
                        {isJobMatchSelected 
                          ? 'Get a professionally optimized resume and compelling cover letter that matches this job description perfectly.'
                          : 'Get a professionally optimized resume and compelling cover letter that addresses all identified issues and enhances your job prospects.'
                        }
                      </p>
                      <button
                        onClick={handleGetTailoredResume}
                        className="bg-white text-blue-600 py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-black text-lg sm:text-xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center space-x-3"
                      >
                        <span>Get Enhanced Resume & Cover Letter</span>
                        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Analysis Complete Message */}
                <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 text-center border-2 border-gray-200 shadow-xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4">Analysis Complete!</h4>
                  <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                    Your resume analysis is complete. Ready to analyze another resume or enhance this one?
                  </p>
                  <button
                    onClick={handleResetAnalysis}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-bold">AI-Powered Analysis</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">Resume Analysis Dashboard</h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Analyze your resume with AI-powered insights and get actionable recommendations</p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-3 sm:space-x-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base transition-all duration-300 ${
                  step <= dashboardState.currentStep 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step <= dashboardState.currentStep && step < dashboardState.currentStep ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    step
                  )}
                  {step <= dashboardState.currentStep && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg"></div>
                  )}
                </div>
                {step < 4 && (
                  <div className={`w-12 sm:w-20 h-2 mx-2 sm:mx-3 rounded-full transition-all duration-500 ${
                    step < dashboardState.currentStep ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 sm:mt-6 space-x-6 sm:space-x-12">
            <span className="text-xs sm:text-sm font-bold text-gray-600">Upload</span>
            <span className="text-xs sm:text-sm font-bold text-gray-600">Analysis Types</span>
            <span className="text-xs sm:text-sm font-bold text-gray-600">Job Description</span>
            <span className="text-xs sm:text-sm font-bold text-gray-600">Results</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 mb-1">Error</h4>
                <p className="text-sm sm:text-base text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-gray-200">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;