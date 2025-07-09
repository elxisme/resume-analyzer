import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
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
                to="/"
                className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                sign in to your existing account
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-xs sm:text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm sm:text-base"
                      placeholder="Enter your password"
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
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="block w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm sm:text-base"
                      placeholder="Confirm your password"
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
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;