import React, { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { downloadTXT, copyToClipboard } from '../lib/utils';
import { CheckCircle, Download, FileText, ArrowRight, Copy, Check, Mail } from 'lucide-react';

const Success: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const { tailoredResume, improvements, coverLetter, coverLetterKeyPoints, reference } = location.state || {};

  if (!tailoredResume) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDownloadTXT = () => {
    downloadTXT(tailoredResume, 'tailored-resume.txt');
  };

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(tailoredResume);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-6 sm:mb-8">
        <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">Payment Successful!</h1>
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
            <button
              onClick={handleCopyToClipboard}
              className="bg-white text-gray-700 border border-gray-200 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2 text-xs sm:text-sm"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>COPY TXT</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadTXT}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>DOWNLOAD</span>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 max-h-80 sm:max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-800 font-mono leading-relaxed">
            {tailoredResume}
          </pre>
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

      {/* Cover Letter Ready Section */}
      {coverLetter && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center uppercase">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
            Cover Letter is Ready!
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            A letterhead is the heading at the top of a sheet of letter paper (stationery). That heading usually
          </p>
          <Link
            to="/cover-letter"
            state={{ 
              coverLetter, 
              coverLetterKeyPoints, 
              reference,
              tailoredResume,
              improvements
            }}
            className="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <span>View Your Cover Letter</span>
          </Link>
        </div>
      )}

      {/* Bottom CTA Section */}
      <div className="text-center">
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
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
              className="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
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