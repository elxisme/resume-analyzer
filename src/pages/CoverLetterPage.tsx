import React, { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { downloadTXT, copyToClipboard, markdownToPlainText } from '../lib/utils';
import { Mail, Download, Copy, Check, ArrowLeft, ArrowRight, Eye, FileCode } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackDownload } from '../lib/analytics';

const CoverLetterPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const location = useLocation();
  const { coverLetter, coverLetterKeyPoints, reference } = location.state || {};

  if (!coverLetter) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDownloadTXT = () => {
    const plainText = markdownToPlainText(coverLetter);
    downloadTXT(plainText, 'cover-letter.txt');
    trackDownload('cover_letter');
  };

  const handleCopyToClipboard = async () => {
    const plainText = markdownToPlainText(coverLetter);
    const success = await copyToClipboard(plainText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-6 sm:mb-8">
        <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 mb-2">Your Professional Cover Letter</h1>
        <p className="text-sm sm:text-base text-gray-600">Tailored specifically for your job application</p>
        {reference && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Transaction Reference: {reference}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column - Key Points */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center uppercase">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
              Cover Letter Highlights
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {coverLetterKeyPoints?.map((point: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="mt-4 sm:mt-6">
            <Link
              to="/success"
              state={{ 
                tailoredResume: location.state?.tailoredResume,
                improvements: location.state?.improvements,
                coverLetter,
                coverLetterKeyPoints,
                reference 
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Back to Resume</span>
            </Link>
          </div>
        </div>

        {/* Right Column - Cover Letter Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg mb-6 sm:mb-8 border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center uppercase">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
                  Your Cover Letter
                </h3>
                <div className="flex space-x-2">
                  <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-2">
                    <button
                      onClick={() => setViewMode('rendered')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
                        viewMode === 'rendered'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Formatted</span>
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
                        viewMode === 'raw'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <FileCode className="h-4 w-4" />
                      <span className="hidden sm:inline">Raw</span>
                    </button>
                  </div>
                  <button
                    onClick={handleCopyToClipboard}
                    className="bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-1 text-xs shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadTXT}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-1 text-xs shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              {/* Content Display */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 max-h-80 sm:max-h-96 overflow-y-auto">
                {viewMode === 'rendered' ? (
                  <MarkdownRenderer 
                    content={coverLetter} 
                    className="text-gray-800"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-800 font-mono leading-relaxed">
                    {coverLetter}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section - Now properly aligned with grid */}
        <div className="lg:col-start-2 lg:col-span-2">
          <div className="bg-green-600 text-white rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
              📝 Professional Cover Letter Ready!
            </h3>
            <p className="text-sm sm:text-base text-white/90 mb-3 sm:mb-4">
              Your cover letter has been crafted to highlight your strengths and align with the job requirements. 
              Use it alongside your tailored resume for the best results!
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                to="/dashboard"
                className="bg-white text-purple-600 px-4 sm:px-6 py-2 rounded-lg font-medium border border-purple-600 hover:bg-purple-50 transition-colors text-sm sm:text-base"
              >
                Analyze Another Resume
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPage;