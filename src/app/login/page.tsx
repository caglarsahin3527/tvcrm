'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

import { BiKanalLogo } from '@/components/BiKanalLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        setIsLoading(false);
        return;
      }

      // Success, redirect
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setErrorMessage('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      
      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          
          {/* B! KANAL 3D Logo */}
          <BiKanalLogo size="md" />

          {/* Department Header Badge */}
          <div className="mt-4 border border-sky-200/90 bg-sky-50/70 rounded-2xl px-6 py-2.5 text-center shadow-2xs">
            <h2 className="text-xs sm:text-[13px] font-bold text-[#0284c7] tracking-wide uppercase">
              MARKA VE BÜYÜME MERKEZİ
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Reklam Satış Grup Direktörlüğü
            </p>
          </div>

          {/* Channels Pills */}
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
              <span>Bi Kanal TV</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <span>Sıfır TV</span>
            </div>
          </div>

        </div>

        {/* Main Card */}
        <div className="w-full bg-white border border-slate-200/70 rounded-[28px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          
          <div className="mb-5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Kullanıcı Girişi
            </h1>
            <p className="text-xs text-slate-400 font-normal mt-1">
              Panele erişmek için kurumsal e-posta ve şifrenizi girin.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Kurumsal E-Posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@bikanal.com"
                  required
                  autoComplete="email"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#091124] hover:bg-[#121c3b] active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3f7fb] flex items-center justify-center text-slate-600">
          <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
