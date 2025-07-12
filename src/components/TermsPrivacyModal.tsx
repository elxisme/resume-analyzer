import React from 'react';
import { X, FileText } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ isOpen, onClose }) => {
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
              Terms & Privacy Policy
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            <div className="text-center">
              <p className="text-gray-600 font-medium">Effective Date: July 9, 2025</p>
            </div>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">1. Introduction</h3>
              <p>
                Zolla Resume Assistant is an AI-powered tool that helps users improve their resumes, statements of purpose, and professional documents. By using this service, you agree to the terms below.
              </p>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2. User Responsibility</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>You agree to use Zolla Resume Assistant only for lawful purposes.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>You are responsible for the content you upload. Please do not upload confidential, illegal, or copyrighted material.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">3. Privacy & Data Use</h3>
              <p className="mb-3">We respect your privacy. Here's how we handle your data:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>Your documents are used only to generate AI responses and are not stored permanently unless you choose to save them.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>Basic account information (like email and name) is used to manage your account.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>We do not share your personal data or documents with third parties.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>Analytics tools may collect anonymous usage data to improve the service.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">4. Payments</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>Zolla Resume Assistant offers optional pay-as-you-go features.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>Payments are securely processed through Paystack. We do not store your payment details.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span>Unfortunately, we do not offer any refund for digital services</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">5. AI Content Disclaimer</h3>
              <p>
                All suggestions are generated by AI and should be reviewed before use. Zolla does not guarantee job placement or academic admission based on the documents it generates.
              </p>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">6. Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms or misuse the service.
              </p>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">7. Contact</h3>
              <p>
                If you have any questions about this policy, contact us at{' '}
                <a 
                  href="mailto:contact@zolla.top" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  contact@zolla.top
                </a>
                .
              </p>
            </section>
          </div>
          
          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <p className="text-xs sm:text-sm text-gray-600">
                © 2025 Zolla Resume Assistant
              </p>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPrivacyModal;