import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, AlertCircle, CheckCircle, Key, Loader2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const validateSession = async () => {
      try {
        // Check if we have a valid session from the password reset link
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsValidSession(false);
        } else if (session && session.user) {
          // Check if this is a recovery session (from password reset email)
          if (session.user.aud === 'authenticated') {
            setIsValidSession(true);
          } else {
            setError('Invalid session type. Please use the link from your password reset email.');
            setIsValidSession(false);
          }
        } else {
          setError('No active session found. Please use the link from your password reset email.');
          setIsValidSession(false);
        }
      } catch (err) {
        setError('Failed to validate session. Please try again.');
        setIsValidSession(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!isValidSession) {
      setError('Invalid session. Please use the link from your password reset email.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred while updating your password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/am_fav.png" alt="Zolla Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Zolla</span>
            </Link>
            
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Reset Password Form */}
      <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            {success ? (
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-4" />
            ) : (
              <Key className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-4" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {success ? 'Password Updated!' : 'Reset Your Password'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {success 
                ? "Your password has been successfully updated. You'll be redirected to the login page shortly."
                : "Enter your new password below."
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {success ? (
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                  <Link
                    to="/login"
                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                  >
                    Continue to Sign In
                  </Link>
                </div>
              </div>
            ) : !isValidSession ? (
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Reset Link</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {error || 'This password reset link is invalid or has expired. Please request a new one.'}
                  </p>
                  <div className="space-y-3">
                    <Link
                      to="/forgot-password"
                      className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                    >
                      Request New Reset Link
                    </Link>
                    <Link
                      to="/login"
                      className="w-full bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-md font-medium hover:bg-gray-300 transition-colors flex items-center justify-center text-sm sm:text-base"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-md p-3 sm:p-4 shadow-sm">
                    <div className="flex">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-xs sm:text-sm text-red-800 font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm sm:text-base"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm sm:text-base"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;