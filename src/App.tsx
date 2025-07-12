import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { usePageTracking } from './hooks/useAnalytics';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Premium from './pages/Premium';
import Success from './pages/Success';
import CoverLetterPage from './pages/CoverLetterPage';
import Account from './pages/Account';

// Component to handle page tracking
const PageTracker: React.FC = () => {
  usePageTracking();
  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <PageTracker />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/premium" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Premium />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/success" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Success />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cover-letter" 
            element={
              <ProtectedRoute>
                <Layout>
                  <CoverLetterPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Account />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;