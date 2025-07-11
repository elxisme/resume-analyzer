import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, MapPin, Camera, Clock, FileText, Eye, Loader2, AlertCircle, CheckCircle, TrendingUp, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumeAnalysis {
  id: string;
  user_id: string;
  compatibility_score: number;
  keyword_matches: string[];
  experience_gaps: string[];
  tailored_resume?: string;
  cover_letter?: string;
  analysis_details?: any;
  original_resume_text?: string;
  original_job_description?: string;
  created_at: string;
}

const Account: React.FC = () => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdownId]);

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
        .select('*')
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
    setOpenDropdownId(null);
    if (analysis.tailored_resume && analysis.tailored_resume.trim()) {
      navigate('/success', {
        state: {
          tailoredResume: analysis.tailored_resume,
          improvements: ['Previously generated resume from your history'],
          coverLetter: analysis.cover_letter,
          coverLetterKeyPoints: analysis.cover_letter ? ['Previously generated cover letter from your history'] : null,
          reference: `history-${analysis.id}`
        }
      });
    } else if (analysis.analysis_details) {
      navigate('/dashboard', {
        state: {
          initialAnalysisResult: analysis.analysis_details,
          originalResumeText: analysis.original_resume_text,
          originalJobDescription: analysis.original_job_description,
          fromHistory: true
        }
      });
    } else {
      navigate('/dashboard', {
        state: {
          initialAnalysisResult: {
            match_summary: "This is a historical analysis from your account.",
            match_score: `${analysis.compatibility_score}/100`,
            job_keywords_detected: analysis.keyword_matches.map(keyword => ({
              keyword,
              status: 'Present' as const
            })),
            gaps_and_suggestions: analysis.experience_gaps || []
          },
          originalResumeText: analysis.original_resume_text,
          originalJobDescription: analysis.original_job_description,
          fromHistory: true
        }
      });
    }
  };

  const handleUpgradeAnalysis = (analysis: ResumeAnalysis) => {
    setOpenDropdownId(null);
    if (analysis.original_resume_text && analysis.original_job_description) {
      navigate('/premium', {
        state: {
          resumeText: analysis.original_resume_text,
          jobDescription: analysis.original_job_description,
          analysisResult: analysis.analysis_details || {
            match_summary: "Historical analysis from your account.",
            match_score: `${analysis.compatibility_score}/100`,
            job_keywords_detected: analysis.keyword_matches.map(keyword => ({
              keyword,
              status: 'Present' as const
            })),
            gaps_and_suggestions: analysis.experience_gaps || []
          }
        }
      });
    }
  };

  const toggleDropdown = (analysisId: string) => {
    setOpenDropdownId(openDropdownId === analysisId ? null : analysisId);
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
    const expiryDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-500">Manage your profile and view your resume history</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-6 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Resume History
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={profileData.email}
                    disabled
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile_picture_url" className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Camera className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="profile_picture_url"
                  value={profileData.profile_picture_url}
                  onChange={(e) => setProfileData({ ...profileData, profile_picture_url: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Resume History</h2>
            <div className="text-sm text-gray-500">
              Resumes are saved for 30 days
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading your resume history...</p>
            </div>
          ) : resumeHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume History</h3>
              <p className="text-gray-600 mb-6">
                You haven't generated any tailored resumes yet.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Analyze Your First Resume
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {resumeHistory.map((analysis) => {
                const daysRemaining = getDaysRemaining(analysis.created_at);
                const isExpired = daysRemaining === 0;
                const hasContent = analysis.tailored_resume || analysis.analysis_details;
                const canUpgrade = analysis.original_resume_text && analysis.original_job_description && !analysis.tailored_resume && !isExpired;
                
                return (
                  <div
                    key={analysis.id}
                    className={`border rounded-xl p-5 transition-all duration-200 ${
                      isExpired 
                        ? 'border-red-100 bg-red-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isExpired ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            <FileText className={`h-5 w-5 ${
                              isExpired ? 'text-red-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Resume Analysis</h3>
                            <p className="text-sm text-gray-500 flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(analysis.created_at)}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="relative" ref={openDropdownId === analysis.id ? dropdownRef : null}>
                          <button
                            onClick={() => toggleDropdown(analysis.id)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                          </button>
                          
                          {openDropdownId === analysis.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                              <div className="py-1">
                                {hasContent && !isExpired ? (
                                  <button
                                    onClick={() => handleViewResume(analysis)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                    <span>
                                      {analysis.tailored_resume ? 'View Tailored Resume' : 'View Analysis'}
                                    </span>
                                  </button>
                                ) : null}
                                
                                {canUpgrade ? (
                                  <button
                                    onClick={() => handleUpgradeAnalysis(analysis)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <TrendingUp className="h-4 w-4 text-orange-600" />
                                    <span>Get Tailored Resume</span>
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Score</p>
                          <p className="font-medium text-gray-900">
                            {analysis.compatibility_score}/100
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Keywords</p>
                          <p className="font-medium text-gray-900">
                            {analysis.keyword_matches.length} matched
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Expires in</p>
                          <p className={`font-medium ${
                            isExpired ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {isExpired ? 'Expired' : `${daysRemaining} days`}
                          </p>
                        </div>
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