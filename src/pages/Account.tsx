import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, MapPin, Camera, Clock, FileText, Eye, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumeAnalysis {
  id: string;
  compatibility_score: number;
  keyword_matches: string[];
  experience_gaps: string[];
  tailored_resume?: string;
  cover_letter?: string;
  created_at: string;
}

const Account: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resumeHistory, setResumeHistory] = useState<ResumeAnalysis[]>([]);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    address: '',
    profile_picture_url: ''
  });
  
  const { user, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        address: userProfile.address || '',
        profile_picture_url: userProfile.profile_picture_url || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchResumeHistory();
    }
  }, [activeTab]);

  const fetchResumeHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('id, compatibility_score, keyword_matches, experience_gaps, tailored_resume, cover_letter, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumeHistory(data || []);
    } catch (err) {
      setError('Failed to load resume history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name || null,
          address: profileData.address || null,
          profile_picture_url: profileData.profile_picture_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserProfile();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewResume = (analysis: ResumeAnalysis) => {
    if (analysis.tailored_resume) {
      navigate('/success', {
        state: {
          tailoredResume: analysis.tailored_resume,
          improvements: ['Previously generated resume'],
          coverLetter: analysis.cover_letter,
          coverLetterKeyPoints: ['Previously generated cover letter'],
          reference: `history-${analysis.id}`
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const createdDate = new Date(dateString);
    const expiryDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your profile and view your resume history</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resume History
            </button>
          </nav>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
          <div className="flex">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-md p-3 sm:p-4">
          <div className="flex">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={profileData.email}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 text-sm sm:text-base"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile_picture_url" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture URL
              </label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="url"
                  id="profile_picture_url"
                  value={profileData.profile_picture_url}
                  onChange={(e) => setProfileData({ ...profileData, profile_picture_url: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm sm:text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Resume History</h2>
            <div className="text-xs sm:text-sm text-gray-500">
              Resumes are saved for 30 days
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">Loading your resume history...</p>
            </div>
          ) : resumeHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume History</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                You haven't generated any tailored resumes yet.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Analyze Your First Resume
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {resumeHistory.map((analysis) => {
                const daysRemaining = getDaysRemaining(analysis.created_at);
                const isExpired = daysRemaining === 0;
                
                return (
                  <div
                    key={analysis.id}
                    className={`border rounded-lg p-4 sm:p-6 ${
                      isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-blue-300'
                    } transition-colors`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full"></div>
                            <span className="text-sm sm:text-base font-medium text-gray-900">
                              Resume Analysis
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{formatDate(analysis.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Score:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {analysis.compatibility_score}/100
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Keywords:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {analysis.keyword_matches.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Expires in:</span>
                            <span className={`ml-1 font-medium ${
                              isExpired ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              {isExpired ? 'Expired' : `${daysRemaining} days`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {analysis.tailored_resume && !isExpired ? (
                          <button
                            onClick={() => handleViewResume(analysis)}
                            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 text-xs sm:text-sm"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>View Resume</span>
                          </button>
                        ) : (
                          <div className="text-xs sm:text-sm text-gray-500 px-3 py-2">
                            {isExpired ? 'Expired' : 'Analysis only'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Account;