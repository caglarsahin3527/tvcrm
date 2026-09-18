'use client';

import React from 'react';
import { User } from '@/types';
import { SlidersHorizontal, RotateCcw, Tv, Calendar, User as UserIcon, Building2 } from 'lucide-react';

interface FilterBarProps {
  users: User[];
  currentUser: User | null;
  selectedChannel: string;
  setSelectedChannel: (channel: string) => void;
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;
  selectedRep: string;
  setSelectedRep: (rep: string) => void;
  selectedCustomerType: string;
  setSelectedCustomerType: (type: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  users,
  currentUser,
  selectedChannel,
  setSelectedChannel,
  selectedTimeRange,
  setSelectedTimeRange,
  selectedRep,
  setSelectedRep,
  selectedCustomerType,
  setSelectedCustomerType,
  onReset,
}) => {
  const isRep = currentUser?.role === 'SALES_REP';

  return (
    <div className="bg-white border border-slate-200/90 p-2.5 sm:p-3 rounded-xl shadow-xs mb-5 flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        
        {/* Label */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
          <span>Filtre:</span>
        </div>

        {/* 1. Kanal Filtresi */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <Tv className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-white text-slate-800">Tüm Kanallar</option>
            <option value="Bi Kanal" className="bg-white text-sky-700 font-bold">Bi Kanal</option>
            <option value="Sıfır TV" className="bg-white text-amber-700 font-bold">Sıfır TV</option>
          </select>
        </div>

        {/* 2. Tarih Filtresi */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-white text-slate-800">Tüm Dönem</option>
            <option value="today" className="bg-white text-slate-800">Bugün</option>
            <option value="this_week" className="bg-white text-slate-800">Bu Hafta</option>
            <option value="this_month" className="bg-white text-slate-800">Bu Ay</option>
            <option value="this_quarter" className="bg-white text-slate-800">Bu Çeyrek (Q)</option>
          </select>
        </div>

        {/* 3. Satış Temsilcisi Filtresi */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <UserIcon className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-white text-slate-800">Tüm Satışçılar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-white text-slate-800">
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Müşteri Tipi Filtresi */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={selectedCustomerType}
            onChange={(e) => setSelectedCustomerType(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-white text-slate-800">Tüm Tipler</option>
            <option value="Kurumsal" className="bg-white text-slate-800">Kurumsal</option>
            <option value="KOBİ" className="bg-white text-slate-800">KOBİ</option>
            <option value="Kamu" className="bg-white text-slate-800">Kamu</option>
            <option value="Ajans" className="bg-white text-slate-800">Ajans</option>
            <option value="Diğer" className="bg-white text-slate-800">Diğer</option>
          </select>
        </div>

      </div>

      {/* Reset Filter Button */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer shadow-2xs"
        title="Filtreleri Sıfırla"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Temizle</span>
      </button>
    </div>
  );
};

