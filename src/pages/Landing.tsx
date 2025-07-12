import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Brain, CreditCard, MessageCircle, Heart, Info } from 'lucide-react';
import AnalysisInfoModal from '../components/AnalysisInfoModal';
import { trackWhatsAppSupport, trackExternalLink } from '../lib/analytics';

const Landing: React.FC = () => {
  const [showAnalysisInfoModal, setShowAnalysisInfoModal] = useState(false);

  const handleWhatsAppSupport = () => {
    const phoneNumber = '2348135381616'; // Replace with your actual WhatsApp number
    const message = encodeURIComponent('Hi! I want to learn more about Zolla AI resume analysis.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Track WhatsApp support click
    trackWhatsAppSupport();
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/60 to-black/50" />

        {/* Navigation - Transparent over hero */}
        <nav className="absolute inset-x-0 top-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/am_fav.png" alt="Zolla Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="text-lg sm:text-xl font-bold text-white">Zolla</span>
              </Link>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Hi, I'm
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300"> Zolla!</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                Use my Free AI Resume Analysis Tool and instantly improve your ATS score to land more interviews.</p>
                <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">Upload your resume and job description to get a detailed AI-powered review—keyword matching, ATS optimization, action-driven impact tips—all for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base shadow-lg"
                >
                  <span>Start Free Analysis</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link
                  to="/login"
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-6 sm:px-8 py-3 sm:py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base shadow-lg"
                >
                  <span>Sign In</span>
                </Link>
              </div>
              
              {/* Analysis Info Link */}
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => setShowAnalysisInfoModal(true)}
                  className="text-white/80 hover:text-white text-sm sm:text-base underline underline-offset-4 transition-colors flex items-center justify-center space-x-1 mx-auto"
                >
                  <Info className="h-4 w-4" />
                  <span>How Zolla Analyzes Your Resume</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Three simple steps to optimize your resume
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Upload Resume</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Upload your resume in DOCX format or paste your resume text directly
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">AI Analysis</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Zolla analyzes your resume against the job description for compatibility
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Tailored Resume</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Optionally, get a professionally tailored resume optimized for the job
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 sm:py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Why Choose Zolla?
              </h2>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-gray-700">
                    <strong>Instant Analysis:</strong> Get your compatibility score in seconds
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-gray-700">
                    <strong>Keyword Matching:</strong> See which keywords you're missing
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-gray-700">
                    <strong>Gap Analysis:</strong> Identify experience and skill gaps
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-gray-700">
                    <strong>Tailored Resume & Cover Letter:</strong> Get a professionally optimized resume
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-gray-700">
                    <strong>Instant Download:</strong> Download your tailored resume immediately
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="order-1 lg:order-2 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Ready to get started?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Join thousands of job seekers who have improved their resumes with Zolla
              </p>
              <div className="space-y-3">
                <Link
                  to="/signup"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>Start Your Free Analysis</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] flex items-center justify-center space-x-2">
            <span>Made with love</span>
            <Heart className="h-3 w-3 text-red-500 fill-current" />
            <span>by</span>
            <a 
              href="https://elxis.com.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              onClick={() => trackExternalLink('https://elxis.com.ng', 'eLxis')}
            >
              eLxis
            </a>
          </p>
        </div>
      </footer>

      {/* WhatsApp Support Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={handleWhatsAppSupport}
          className="group bg-green-500 hover:bg-green-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
          aria-label="Contact WhatsApp Support"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Need help? Chat with us!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
        </button>
      </div>

      {/* Analysis Info Modal */}
      <AnalysisInfoModal 
        isOpen={showAnalysisInfoModal} 
        onClose={() => setShowAnalysisInfoModal(false)} 
      />
    </div>
  );
};

export default Landing;