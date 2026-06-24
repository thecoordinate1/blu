'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Zap, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({ type: 'success', text: 'Welcome back! Redirecting...' });
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      } else {
        // Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Registration successful! Please check your email for confirmation or sign in.',
        });
        setIsLogin(true);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080F] text-[#E2E8F0] relative overflow-hidden font-['DM_Sans'] px-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#4F6EF7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#A78BFA]/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0E1020]/80 border border-[#1E2340] backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header/Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#4F6EF7] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,110,247,0.4)]">
            <Zap className="text-white w-6 h-6 fill-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight">
            Blu_bot
          </h1>
          <p className="text-[#64748B] text-xs uppercase tracking-widest font-mono">
            {isLogin ? 'Sign In to Workspace' : 'Create New Account'}
          </p>
        </div>

        {/* Dynamic Notification Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium mb-6 ${
              message.type === 'error'
                ? 'bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 text-[#FF4D6D]'
                : 'bg-[#22D3A0]/15 border border-[#22D3A0]/30 text-[#22D3A0]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-headline font-bold text-[#64748B] uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6EF7] text-white transition-colors placeholder:text-[#3A4060]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-headline font-bold text-[#64748B] uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F6EF7] text-white transition-colors placeholder:text-[#3A4060]"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[11px] font-headline font-bold text-[#64748B] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#4F6EF7] text-white transition-colors placeholder:text-[#3A4060]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4F6EF7] hover:bg-[#4F6EF7]/80 text-white rounded-lg py-3 text-xs font-headline font-bold uppercase transition-all shadow-[0_0_15px_-5px_#4F6EF7] flex items-center justify-center gap-2 group mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Access Dashboard' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 pt-6 border-t border-[#1E2340]/60 text-center text-xs">
          <span className="text-[#64748B]">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage(null);
            }}
            className="text-[#4F6EF7] hover:underline font-bold"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
