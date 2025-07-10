import React from 'react';
import { X } from 'lucide-react';

interface AnalysisInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalysisInfoModal: React.FC<AnalysisInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              How Zolla Analyzes Your Resume
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed">
            <p>
              The percentage score you see in the analysis, such as "60/100" even with only a few keyword matches, is a deliberate design choice and not a malfunction.
            </p>
            
            <p>
              I generate the algorithm as part of my comprehensive analysis. I consider several factors when determining the compatibility score, not just the number of keyword matches. These factors include:
            </p>
            
            <ul className="space-y-3 ml-4">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <div>
                  <strong>Overall Match Summary:</strong> I provide a short paragraph summarizing the overall compatibility, which influences the score.
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <div>
                  <strong>Keyword Presence:</strong> While important, it's one of several factors. I assess the relevance and context of the keywords.
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <div>
                  <strong>Identified Gaps and Suggestions:</strong> I also consider the experience and skill gaps identified, which can lower the score even if many keywords are present, or conversely, a strong overall resume might get a decent score even with some missing keywords if I deem the gaps minor or easily addressable.
                </div>
              </li>
            </ul>
            
            <p>
              Essentially, I provide a qualitative assessment of the resume's fit for the job description, and the score reflects this holistic evaluation rather than a simple quantitative count of keywords. The application then displays this score directly from my response.
            </p>
          </div>
          
          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisInfoModal;