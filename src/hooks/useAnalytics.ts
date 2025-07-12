import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

// Hook to track page views automatically
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Get page title from document or generate from pathname
    const pageTitle = document.title || getPageTitleFromPath(location.pathname);
    trackPageView(pageTitle);
  }, [location]);
};

// Helper function to generate page titles from pathname
const getPageTitleFromPath = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    '/': 'Home',
    '/login': 'Login',
    '/signup': 'Sign Up',
    '/dashboard': 'Dashboard',
    '/premium': 'Premium',
    '/success': 'Success',
    '/account': 'Account',
    '/cover-letter': 'Cover Letter',
    '/forgot-password': 'Forgot Password',
    '/reset-password': 'Reset Password',
  };

  return pathMap[pathname] || 'Zolla - AI Resume Analysis';
};