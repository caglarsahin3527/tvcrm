'use client';

import React from 'react';
import { User } from '@/types';
import { BiKanalLogo } from '@/components/BiKanalLogo';
import { 
  Kanban, 
  Users, 
  BarChart3, 
  Plus, 
  ShieldCheck, 
  LogOut,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'pipeline' | 'clients' | 'dashboard';
  setActiveTab: (tab: 'pipeline' | 'clients' | 'dashboard') => void;
  onOpenAddClient: () => void;
  onOpenAdminUsers?: () => void;
  onOpenWorkReport?: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAddClient,
  onOpenAdminUsers,
  onOpenWorkReport,
  onOpenProfile,
  onLogout,
}) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return { label: 'Marka Merkezi', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'SALES_MANAGER':
        return { label: 'Satış Yöneticisi', color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'VIEWER':
        return { label: 'Yönetim Katı / Misafir', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { label: 'Satış Temsilcisi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
  };

  const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isViewer = currentUser?.role === 'VIEWER';
  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : getRoleBadge('ADMIN');

  return (
    <header className="bg-white/95 border-b border-slate-200/90 sticky top-0 z-40 text-slate-900 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* DESKTOP & TABLET VIEW (sm+) */}
        <div className="hidden sm:flex items-center justify-between h-16 gap-2 lg:gap-4">
          
          {/* Brand, Department & Quick Report Button */}
          <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
            {/* 3D B! KANAL Logo */}
            <div className="flex items-center">
              <BiKanalLogo size="sm" />
            </div>
            
            {/* Department Frame */}
            <div className="border border-slate-300/90 bg-white/80 rounded-lg px-2.5 py-1 flex flex-col justify-center shadow-2xs">
              <span className="text-[10.5px] font-bold text-slate-800 tracking-wider uppercase font-mono leading-tight">
                MARKA VE BÜYÜME MERKEZİ
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium tracking-tight leading-tight">
                Reklam Satış Grup Direktörlüğü
              </span>
            </div>

            {/* Çalışma Raporu Action Button */}
            <button
              type="button"
              onClick={onOpenWorkReport}
              className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold px-3 py-1.5 rounded-lg text-xs border border-sky-200/90 shadow-2xs transition active:scale-98 cursor-pointer"
              title="Günlük ve Dönemsel Çalışma Raporu"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
              <span>Çalışma Raporu</span>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-2xs select-none">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
          <div className="flex items-center gap-2.5">
            
            {/* Super Admin Special Group Members Management Button */}
            {(isSuperAdmin || !currentUser) && onOpenAdminUsers && (
              <button
                type="button"
                onClick={onOpenAdminUsers}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition shadow-xs cursor-pointer"
                title="Grup Üyeleri ve Yetki Masası"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>Grup Üyeleri</span>
              </button>
            )}

            {/* Quick Add Client Button */}
            {!isViewer && (
              <button
                type="button"
                onClick={onOpenAddClient}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs tracking-tight transition-all active:scale-95 shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Yeni Müşteri Ekle</span>
              </button>
            )}

            {/* Authenticated User Badge & Logout */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 hover:bg-slate-100 p-1 rounded-xl transition cursor-pointer group text-left"
                title="Profil ve Şifre Ayarları"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-2xs group-hover:scale-105 transition-transform ${
                  isSuperAdmin || !currentUser
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : currentUser?.role === 'SALES_MANAGER'
                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {currentUser?.name 
                    ? currentUser.name.substring(0, 2).toUpperCase() 
                    : 'AY'}
                </div>

                <div className="text-left leading-tight hidden xl:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-slate-950">
                    {currentUser?.name || 'Ayşe Yıldız (Marka Merkezi)'}
                  </div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    isSuperAdmin || !currentUser ? 'text-rose-600' : currentUser?.role === 'SALES_MANAGER' ? 'text-sky-600' : 'text-emerald-600'
                  }`}>
                    {roleInfo?.label || 'Marka Merkezi'}
                  </div>
                </div>
              </button>

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
          
          {/* Mobile Row 1: Brand, Department, Admin Button, Add & Logout */}
          <div className="flex items-center justify-between gap-1.5">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2 shrink-0">
              <BiKanalLogo size="sm" showText={false} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-900 tracking-tight font-mono leading-none">
                  MARKA & BÜYÜME
                </span>
                <span className="text-[8px] text-slate-500 leading-tight">
                  Satış Direktörlüğü
                </span>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenWorkReport}
                className="px-2 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[10px] font-bold"
                title="Çalışma Raporu"
              >
                Rapor
              </button>

              {(isSuperAdmin || !currentUser) && onOpenAdminUsers && (
                <button
                  type="button"
                  onClick={onOpenAdminUsers}
                  className="p-1.5 bg-slate-900 text-rose-400 rounded-lg border border-slate-800 text-xs"
                  title="Grup Üyeleri"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {!isViewer && (
                <button
                  type="button"
                  onClick={onOpenAddClient}
                  className="flex items-center gap-1 bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg text-[11px] shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ekle</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenProfile}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 font-bold text-xs"
                title="Profil"
              >
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'PR'}
              </button>

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

