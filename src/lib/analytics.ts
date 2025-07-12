// Google Analytics utility functions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Check if Google Analytics is enabled
export const isAnalyticsEnabled = (): boolean => {
  return !!(GA_MEASUREMENT_ID && window.gtag);
};

// Track page views
export const trackPageView = (page_title: string, page_location?: string) => {
  if (!isAnalyticsEnabled()) return;
  
  window.gtag!('config', GA_MEASUREMENT_ID, {
    page_title,
    page_location: page_location || window.location.href,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!isAnalyticsEnabled()) return;
  
  window.gtag!('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track resume analysis events
export const trackResumeAnalysis = (analysisType: string, score?: number) => {
  trackEvent('resume_analysis_completed', 'Resume', analysisType, score);
};

// Track payment events
export const trackPayment = (amount: number, currency: string = 'NGN') => {
  trackEvent('purchase', 'Payment', 'Premium_Resume', amount);
  
  // Also track as a conversion
  if (isAnalyticsEnabled()) {
    window.gtag!('event', 'conversion', {
      send_to: GA_MEASUREMENT_ID,
      value: amount,
      currency: currency,
    });
  }
};

// Track user registration
export const trackUserRegistration = (method: string = 'email') => {
  trackEvent('sign_up', 'User', method);
};

// Track user login
export const trackUserLogin = (method: string = 'email') => {
  trackEvent('login', 'User', method);
};

// Track file uploads
export const trackFileUpload = (fileType: string, fileSize?: number) => {
  trackEvent('file_upload', 'Resume', fileType, fileSize);
};

// Track downloads
export const trackDownload = (downloadType: string) => {
  trackEvent('download', 'Resume', downloadType);
};

// Track WhatsApp support clicks
export const trackWhatsAppSupport = () => {
  trackEvent('contact_support', 'Support', 'WhatsApp');
};

// Track external link clicks
export const trackExternalLink = (url: string, linkText?: string) => {
  trackEvent('click', 'External_Link', linkText || url);
};