'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tv, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
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

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    handleLogin(undefined, quickEmail, quickPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-sky-50/60 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-slate-900 border border-slate-800 shadow-md mb-3">
            <Tv className="w-6 h-6 text-sky-400" />
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2 font-mono">
            TV<span className="text-sky-600">CRM</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
              v2.0
            </span>
          </h1>

          <p className="text-xs text-slate-500 font-medium mt-1">
            Reklam Satış, Kampanya & Yayın Masası
          </p>

          {/* Broadcast Channels Badge */}
          <div className="flex items-center justify-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Bi Kanal
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Sıfır TV
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Kullanıcı Girişi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Panele erişmek için kurumsal e-posta ve şifrenizi girin.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  placeholder="ornek@tvcrm.com"
                  required
                  autoComplete="email"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
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

          {/* Quick Demo Login Switcher Box */}
          <div className="mt-6 pt-5 border-t border-slate-200/90">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hızlı Demo Giriş Kısayolları</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@tvcrm.com', 'admin123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-[10px] font-black text-rose-700">
                    ADM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-rose-700 transition">
                      Ayşe Yıldız (Genel Müdür / Süper Admin)
                    </div>
                    <div className="text-[10px] text-slate-500">admin@tvcrm.com • Tüm Yetkiler & Personel Masası</div>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 group-hover:text-rose-600">Giriş →</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('mehmet@tvcrm.com', 'manager123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-[10px] font-black text-sky-700">
                    MGR
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-sky-700 transition">
                      Mehmet Kaya (Satış Yöneticisi)
                    </div>
                    <div className="text-[10px] text-slate-500">mehmet@tvcrm.com • Ekip Satış & Pipeline İzleme</div>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 group-hover:text-sky-600">Giriş →</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ahmet@tvcrm.com', 'rep123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[10px] font-black text-emerald-700">
                    REP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition">
                      Ahmet Yılmaz (Satış Temsilcisi)
                    </div>
                    <div className="text-[10px] text-slate-500">ahmet@tvcrm.com • Yalnızca Kendi Portföyü</div>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600">Giriş →</div>
              </button>
            </div>
          </div>

        </div>

        {/* Security & System Info Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Bi Kanal & Sıfır TV Güvenli Kurumsal CRM Ağı</span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
          <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
