import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, MessageCircle, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { trackWhatsAppSupport, trackExternalLink } from '../lib/analytics';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate to login with success message
      navigate('/login', { state: { message: 'logged_out' } });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if there's an error
      navigate('/login', { state: { message: 'logged_out' } });
    }
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '2348135381616'; // Replace with your actual WhatsApp number
    const message = encodeURIComponent('Hi! I need help with Zolla AI resume analysis.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Track WhatsApp support click
    trackWhatsAppSupport();
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/am_fav.png" alt="Zolla Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Zolla</span>
            </Link>
            
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link 
                  to="/dashboard" 
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/account" 
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    location.pathname === '/account' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Account
                </Link>
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-700 truncate max-w-32 sm:max-w-none">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="flex-1 pb-16 sm:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] text-gray-400">
            Zolla Ver. 1.0.2 by{' '}
            <a 
              href="https://elxis.com.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => trackExternalLink('https://elxis.com.ng', 'eLxis')}
            >
              eLxis
            </a>
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Footer Navigation - Only for logged-in users */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200 py-2 sm:hidden">
          <nav className="flex justify-around items-center h-14 max-w-md mx-auto w-full">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                location.pathname === '/dashboard'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <Home className="h-5 w-5 mb-1" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/account"
              className={`flex flex-col items-center text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                location.pathname === '/account'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <User className="h-5 w-5 mb-1" />
              <span>Account</span>
            </Link>
            
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center text-xs font-medium px-2 py-1 rounded-md transition-colors text-gray-700 hover:text-red-600"
            >
              <LogOut className="h-5 w-5 mb-1" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* WhatsApp Support Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50">
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
    </div>
  );
};

export default Layout;