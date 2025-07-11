import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { sendPasswordResetEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await sendPasswordResetEmail(data.email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Forgot Password Form */}
      <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {success ? 'Check your email' : 'Forgot your password?'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {success 
                ? "We've sent a password reset link to your email address."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email sent successfully!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please check your email and click the link to reset your password. 
                    If you don't see the email, check your spam folder.
                  </p>
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Back to Sign In</span>
                    </Link>
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setError(null);
                      }}
                      className="w-full bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-md font-medium hover:bg-gray-300 transition-colors text-sm sm:text-base"
                    >
                      Send another email
                    </button>
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

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </button>

                  <Link
                    to="/login"
                    className="w-full bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-md font-medium hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;