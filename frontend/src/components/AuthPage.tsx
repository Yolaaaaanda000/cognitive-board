
import React, { useState } from 'react';
import { Brain, Mail, Lock, User, ArrowRight, Sparkles } from './Icons';
import { User as UserType } from '../types';

interface AuthPageProps {
  onLogin: (user: UserType) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (!email || !password || (!isLogin && !name)) {
        throw new Error('Please fill in all fields.');
      }

      // Mock Database Logic using LocalStorage
      const usersStr = localStorage.getItem('tf_users');
      const users = usersStr ? JSON.parse(usersStr) : [];

      if (isLogin) {
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (user) {
          const userData: UserType = { id: user.id, name: user.name, email: user.email };
          localStorage.setItem('tf_current_user', JSON.stringify(userData));
          onLogin(userData);
        } else {
          throw new Error('Invalid email or password.');
        }
      } else {
        // Signup
        if (users.find((u: any) => u.email === email)) {
          throw new Error('User already exists.');
        }
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password // In a real app, never store plain text passwords!
        };
        users.push(newUser);
        localStorage.setItem('tf_users', JSON.stringify(users));
        
        const userData: UserType = { id: newUser.id, name: newUser.name, email: newUser.email };
        localStorage.setItem('tf_current_user', JSON.stringify(userData));
        onLogin(userData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex overflow-hidden min-h-[600px]">
        
        {/* Left Side - Brand & Visuals */}
        <div className="hidden md:flex w-1/2 bg-indigo-900 text-white flex-col justify-between p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
               <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                 <Brain className="w-6 h-6 text-indigo-300" />
               </div>
               <span className="text-2xl font-bold tracking-tight">ThinkFlow</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Unlock your <br/>
              <span className="text-indigo-300">Cognitive Potential</span>
            </h2>
            <p className="text-indigo-200/80 text-lg">
              Your personal board of directors, powered by Gemini 2.5. Think deeper, write better.
            </p>
          </div>
          
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2 animate-blob animation-delay-2000"></div>

          <div className="relative z-10 flex items-center space-x-2 text-sm text-indigo-300">
            <Sparkles className="w-4 h-4" />
            <span>Trusted by thoughtful minds everywhere</span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-gray-500 text-sm">
                {isLogin ? 'Enter your details to access your workspace' : 'Start your journey to better thinking today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {error && (
                <div className="text-red-500 text-xs text-center bg-red-50 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white rounded-xl py-3.5 font-medium hover:bg-black transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin); 
                    setError('');
                    setName('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
            
            {/* Quick Demo Login for Reviewers */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
               <button 
                 onClick={() => {
                   setName('Demo User');
                   setEmail('demo@example.com');
                   setPassword('password');
                   setIsLogin(true);
                 }}
                 className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
               >
                 Auto-fill Demo Account
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
