import React, { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { downloadTXT, copyToClipboard, markdownToPlainText } from '../lib/utils';
import { CheckCircle, Download, FileText, ArrowRight, Copy, Check, Mail, Eye, FileCode } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackDownload } from '../lib/analytics';

const Success: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const location = useLocation();
  const { tailoredResume, improvements, coverLetter, coverLetterKeyPoints, reference } = location.state || {};

  if (!tailoredResume) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDownloadTXT = () => {
    const plainText = markdownToPlainText(tailoredResume);
    downloadTXT(plainText, 'tailored-resume.txt');
    trackDownload('tailored_resume');
  };

  const handleCopyToClipboard = async () => {
    const plainText = markdownToPlainText(tailoredResume);
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
        <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-2">Payment Successful!</h1>
        <p className="text-sm sm:text-base text-gray-600">Your tailored resume is ready for download</p>
        {reference && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Transaction Reference: {reference}
          </p>
        )}
      </div>

      {/* Congratulations Banner */}
      <div className="bg-green-600 text-white rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-center">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">
          🎉 Congratulations!
        </h3>
        <p className="text-sm sm:text-base">
          Your resume has been professionally optimized for the job you're applying for. 
          {coverLetter && " Don't forget to check out your cover letter too!"} Good luck with your application!
        </p>
      </div>

      {/* Your Tailored Resume Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center uppercase">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
            Your Tailored Resume
          </h3>
          <div className="flex space-x-2">
            <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-2">
              <button
                onClick={() => setViewMode('rendered')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === 'rendered'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Formatted</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === 'raw'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Raw</span>
              </button>
            </div>
            <button
              onClick={handleCopyToClipboard}
              className="bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-1.5 text-xs shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadTXT}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1.5 text-xs shadow-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Content Display */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 max-h-80 sm:max-h-96 overflow-y-auto">
            {viewMode === 'rendered' ? (
              <MarkdownRenderer 
                content={tailoredResume} 
                className="text-gray-800"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-800 font-mono leading-relaxed">
                {tailoredResume}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Improvements Made Section */}
      {improvements && improvements.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center uppercase">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
            Improvements Made
          </h3>
          <ul className="space-y-2 sm:space-y-3">
            {improvements.map((improvement: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom CTA Section */}
      <div className="text-center">
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base shadow-sm"
          >
            Analyze Another Resume
          </button>
          {coverLetter && (
            <Link
              to="/cover-letter"
              state={{ 
                coverLetter, 
                coverLetterKeyPoints, 
                reference,
                tailoredResume,
                improvements
              }}
              className="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base shadow-sm"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>View Cover Letter</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;