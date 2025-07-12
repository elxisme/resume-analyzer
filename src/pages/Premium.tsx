import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { processPayment } from '../lib/paystack';
import { generateTailoredResume, generateCoverLetter, performComprehensiveAnalysis } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { trackPayment } from '../lib/analytics';
import { CreditCard, CheckCircle, AlertCircle, Star, TrendingUp } from 'lucide-react';
import TermsPrivacyModal from '../components/TermsPrivacyModal';

const Premium: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { user, refreshUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { resumeText, jobDescription, analysisResult } = location.state || {};

  if (!resumeText || !jobDescription) {
    navigate('/dashboard');
    return null;
  }

  // Helper function to extract numeric score from match_score string
  const getNumericScore = (matchScore: string): number => {
    const match = matchScore.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Helper function to extract present keywords
  const getPresentKeywords = (): string[] => {
    if (!analysisResult?.job_keywords_detected) return [];
    return analysisResult.job_keywords_detected
      .filter((item: any) => item.status === 'Present')
      .map((item: any) => item.keyword);
  };

  const handlePayment = async () => {
    if (!user) return;

    setIsProcessing(true);
    setError(null);

    try {
      await processPayment(
        user.email!,
        2500,
        async (reference) => {
          try {
            // Perform comprehensive analysis with all premium features
            let comprehensiveAnalysis = analysisResult;
            if (jobDescription && jobDescription.trim()) {
              try {
                comprehensiveAnalysis = await performComprehensiveAnalysis(resumeText, jobDescription);
              } catch (analysisError) {
                console.warn('Failed to perform comprehensive analysis, using existing analysis:', analysisError);
                // Continue with existing analysis if comprehensive analysis fails
              }
            }

            // Generate tailored resume
            const tailoredResult = await generateTailoredResume(resumeText, jobDescription || '', comprehensiveAnalysis);
            
            // Only generate cover letter if job description is available
            let coverLetterResult = null;
            if (jobDescription && jobDescription.trim()) {
              coverLetterResult = await generateCoverLetter(resumeText, jobDescription, comprehensiveAnalysis);
            }
            
            // Save to database with mapped fields (no premium status update)
            await supabase.from('resume_analyses').insert({
              user_id: user.id,
              compatibility_score: getNumericScore(analysisResult?.match_score || '0/100'),
              keyword_matches: getPresentKeywords(),
              experience_gaps: analysisResult?.gaps_and_suggestions || [],
              skill_gaps: [], // Empty array as new format combines all gaps
              tailored_resume: tailoredResult.tailored_resume,
              cover_letter: coverLetterResult?.cover_letter || null,
              original_resume_text: resumeText,
              original_job_description: jobDescription || null,
            });

            // Note: Removed the is_premium update - users pay per resume generation
            
            // Track successful payment
            trackPayment(2500, 'NGN');
            
            navigate('/success', { 
              state: { 
                tailoredResume: tailoredResult.tailored_resume,
                improvements: tailoredResult.improvements,
                coverLetter: coverLetterResult?.cover_letter || null,
                coverLetterKeyPoints: coverLetterResult?.key_points || null,
                reference 
              } 
            });
          } catch (err) {
            setError('Payment successful but failed to generate tailored resume' + (jobDescription ? ' and cover letter' : '') + '. Please contact support.');
          }
        },
        () => {
          setError('Payment was cancelled');
          setIsProcessing(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Get Your Tailored Resume & Cover Letter</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Unlock a professionally optimized resume and cover letter tailored to your job description
        </p>
      </div>

      {/* Analysis Score - Full Width at Top */}
      {analysisResult && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
            Your Current Score
          </h3>
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 sm:h-3 rounded-full"
                  style={{ width: `${getNumericScore(analysisResult.match_score)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {analysisResult.match_score}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            Zolla AI will optimize your resume and create a compelling cover letter to achieve a higher compatibility score
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Column - What You Get */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2" />
              What You'll Get
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">
                  <strong>Tailored Resume:</strong> AI-optimized resume specifically for this job
                </span>
              </li>
              {jobDescription && jobDescription.trim() && (
                <li className="flex items-start space-x-2 sm:space-x-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">
                    <strong>Professional Cover Letter:</strong> Compelling cover letter that highlights your fit
                  </span>
                </li>
              )}
              <li className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">
                  <strong>Keyword Optimization:</strong> Include all relevant keywords from the job description
                </span>
              </li>
              <li className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">
                  <strong>Content Enhancement:</strong> Reorder and enhance sections for maximum impact
                </span>
              </li>
              <li className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">
                  <strong>Premium Analysis:</strong> Comprehensive analysis including ATS compatibility, impact statements, skills gaps, format optimization, and career story flow
                </span>
              </li>
              <li className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">
                  <strong>Instant Download:</strong> Download both documents immediately
                </span>
              </li>
              <li className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">
                  <strong>Improvement Summary:</strong> See all the changes and enhancements made{jobDescription && jobDescription.trim() ? ' to both documents' : ' to your resume'}
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Right Column - Payment */}
        <div className="space-y-4 sm:space-y-6">
          {/* Premium Features Highlight */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              ⭐ Premium Analysis Included
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>ATS Compatibility Check</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>Impact Statement Review</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>Skills Gap Assessment</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>Format Optimization</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>Career Story Flow Analysis</span>
              </li>
            </ul>
            <p className="text-xs text-gray-600 mt-3">
              All premium analysis features are automatically included in your tailored resume generation.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Pricing
            </h3>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {formatCurrency(2500)}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Per tailored resume{jobDescription && jobDescription.trim() ? ' & cover letter' : ''} package
              </p>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>Secure Payment:</strong> Powered by Paystack
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>Instant Access:</strong> Get your {jobDescription && jobDescription.trim() ? 'documents' : 'resume'} immediately after payment
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>Complete Package:</strong> Resume{jobDescription && jobDescription.trim() ? ' + Cover Letter' : ''} + Improvements
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
              <div className="flex">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Get Enhanced Resume{jobDescription && jobDescription.trim() ? ' & Cover Letter' : ''} - {formatCurrency(2500)}</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-3 sm:mt-4 text-center">
              By proceeding, you agree to our{' '}
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                terms of service and privacy policy
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      <TermsPrivacyModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </div>
  );
};

export default Premium;