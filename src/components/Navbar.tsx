'use client';

import React from 'react';
import { User } from '@/types';
import { 
  Tv, 
  Kanban, 
  Users, 
  BarChart3, 
  Plus, 
  ShieldCheck, 
  LogOut,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'pipeline' | 'clients' | 'dashboard';
  setActiveTab: (tab: 'pipeline' | 'clients' | 'dashboard') => void;
  onOpenAddClient: () => void;
  onOpenAdminUsers?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAddClient,
  onOpenAdminUsers,
  onLogout,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return { label: 'Süper Admin (Genel Müdür)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'SALES_MANAGER':
        return { label: 'Satış Yöneticisi', color: 'text-sky-700 bg-sky-50 border-sky-200' };
      default:
        return { label: 'Satış Temsilcisi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
  };

  const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <header className="bg-white/95 border-b border-slate-200/90 sticky top-0 z-40 text-slate-900 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* DESKTOP & TABLET VIEW (sm+) */}
        <div className="hidden sm:flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Brand & Broadcast Channels */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-sm">
              <Tv className="w-5 h-5 text-sky-400" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 font-mono">
                  TV<span className="text-sky-600">CRM</span>
                </span>
                
                {/* Broadcast Channels Live Indicators */}
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    Bi Kanal
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Sıfır TV
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Reklam Satış & Yayın Masası
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-2xs select-none">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Müşteriler</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-sky-600" />
              <span>Pipeline</span>
            </button>
          </nav>

          {/* Right Area: Admin Actions, Quick Add & Logged-In User Profile */}
          <div className="flex items-center gap-3">
            
            {/* Super Admin Special Personnel Management Button */}
            {isSuperAdmin && onOpenAdminUsers && (
              <button
                type="button"
                onClick={onOpenAdminUsers}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition shadow-xs cursor-pointer"
                title="Personel ve Rol Yönetim Masası"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>Personel Masası</span>
              </button>
            )}

            {/* Quick Add Client Button */}
            <button
              type="button"
              onClick={onOpenAddClient}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs tracking-tight transition-all active:scale-95 shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Hızlı Müşteri Ekle</span>
            </button>

            {/* Authenticated User Badge & Logout */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-2xs ${
                  isSuperAdmin 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : currentUser?.role === 'SALES_MANAGER'
                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U'}
                </div>

                <div className="text-left leading-tight hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {currentUser?.name || 'Kullanıcı'}
                  </div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    isSuperAdmin ? 'text-rose-600' : currentUser?.role === 'SALES_MANAGER' ? 'text-sky-600' : 'text-emerald-600'
                  }`}>
                    {roleInfo?.label || 'Giriş Yapıldı'}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                title="Güvenli Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* MOBILE VIEW (< sm) */}
        <div className="sm:hidden py-2 space-y-2 select-none">
          
          {/* Mobile Row 1: Brand, User Info, Admin Button, Add & Logout */}
          <div className="flex items-center justify-between gap-1.5">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Tv className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 font-mono">
                TV<span className="text-sky-600">CRM</span>
              </span>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5">
              {isSuperAdmin && onOpenAdminUsers && (
                <button
                  type="button"
                  onClick={onOpenAdminUsers}
                  className="p-1.5 bg-slate-900 text-rose-400 rounded-lg border border-slate-800 text-xs"
                  title="Personel Masası"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={onOpenAddClient}
                className="flex items-center gap-1 bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg text-[11px] shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Ekle</span>
              </button>

              <div className="text-[11px] font-bold text-slate-700 max-w-[80px] truncate">
                {currentUser?.name?.split(' ')[0]}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200"
                title="Çıkış"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Row 2: Segmented Tab Navigation */}
          <nav className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clients'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Müşteriler</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-sky-600" />
              <span>Pipeline</span>
            </button>
          </nav>

        </div>

      </div>
    </header>
  );
};
