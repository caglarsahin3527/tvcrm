'use client';

import React, { useState } from 'react';
import { Deal, User, Client } from '@/types';
import { formatCurrency, formatDate, exportToExcel, exportToCsv } from '@/lib/formatters';
import { 
  Target, 
  Clock, 
  DollarSign,
  Sparkles,
  FileSpreadsheet, 
  FileText, 
  Activity,
  CheckCircle2,
  Users,
  TrendingDown,
  TrendingUp,
  Calculator,
  PieChart as PieChartIcon,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Percent,
  SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  deals: Deal[];
  users: User[];
  clients: Client[];
  currentUser: User | null;
}

// Custom Premium Light Mode Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200/90 p-3 rounded-xl shadow-xl text-xs font-mono ring-1 ring-black/5 z-50 pointer-events-none select-none">
        <p className="text-slate-800 font-bold mb-2 pb-1 border-b border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          {label || payload[0]?.name}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span 
                  className="w-2 h-2 rounded-sm" 
                  style={{ backgroundColor: entry.color || entry.fill }} 
                />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900">
                {typeof entry.value === 'number' 
                  ? entry.name?.toLowerCase().includes('adet') || entry.name?.toLowerCase().includes('sayı')
                    ? `${entry.value} Adet`
                    : formatCurrency(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Role badge styling helper
const getRoleBadge = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return { label: 'Marka Merkezi', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'SALES_MANAGER':
      return { label: 'Satış Yöneticisi', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    case 'VIEWER':
      return { label: 'Misafir', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'SALES_REP':
    default:
      return { label: 'Satış Temsilcisi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  deals,
  users,
  clients,
  currentUser,
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Interactive Local View Filters for Charts
  const [activeChannelScope, setActiveChannelScope] = useState<'all' | 'Bi Kanal' | 'Sıfır TV'>('all');

  // Performance Table Filters & Sorting
  const [tableRoleFilter, setTableRoleFilter] = useState<'ALL' | 'SALES_REP' | 'SALES_MANAGER' | 'ADMIN'>('ALL');
  const [tableSortBy, setTableSortBy] = useState<'realized' | 'offer' | 'rate' | 'role' | 'name'>('realized');

  // Hover states for Donut Charts to prevent center label & tooltip collision
  const [hoveredQuotaSlice, setHoveredQuotaSlice] = useState<number | null>(null);
  const [hoveredForecastSlice, setHoveredForecastSlice] = useState<number | null>(null);

  // Filter deals based on active channel scope for the reactive charts
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const monthFilteredDeals = deals.filter(d => {
    const dateToUse = d.tahmini_kapanis_tarihi ? new Date(d.tahmini_kapanis_tarihi) : new Date(d.createdAt);
    return dateToUse.getMonth() === selectedMonth && dateToUse.getFullYear() === selectedYear;
  });

  const scopedDeals = activeChannelScope === 'all' 
    ? monthFilteredDeals 
    : monthFilteredDeals.filter((d) => d.kanal === activeChannelScope);

  // Define Won and Open Stage Groups
  const WON_STAGES = ['SATIŞ', 'YAYIN', 'TAHSİLAT'];
  const OPEN_STAGES = ['YENİ LEAD', 'GÖRÜŞME', 'TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'];

  // 1. Calculations for KPIs (Scoped & Global)
  // Gerçekleşen Satışlar (Arşivlenmemiş tüm kazanılan işler)
  const realizedDeals = scopedDeals.filter((d) => !d.is_archived && WON_STAGES.includes(d.asama));
  const realizedTotal = realizedDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  // Aktif Açık Fırsatlar
  const activeScopedDeals = scopedDeals.filter((d) => !d.is_archived && OPEN_STAGES.includes(d.asama));

  // Bekleyen Açık Teklifler
  const pendingDeals = activeScopedDeals.filter((d) => ['TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'].includes(d.asama));
  const pendingTotal = pendingDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const collectionDeals = scopedDeals.filter((d) => !d.is_archived && d.asama === 'TAHSİLAT');
  const collectionTotal = collectionDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const totalTarget = users
    .filter((u) => u.role !== 'VIEWER' && u.role !== 'GUEST')
    .reduce((sum, u) => sum + (u.target || 0), 0);

  const remainingToTarget = Math.max(0, totalTarget - realizedTotal);
  const achievementRate = totalTarget > 0 ? (realizedTotal / totalTarget) * 100 : 0;

  // Bugünün Özeti
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];

  const todayClientsCount = clients.filter((c) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt).toISOString().split('T')[0];
    return d === todayDateString;
  }).length;

  const todayFollowUpsCount = clients.filter((c) => {
    const d = new Date(c.sonraki_takip_tarihi).toISOString().split('T')[0];
    return d === todayDateString;
  }).length;

  const todayNewDealsCount = deals.filter((d) => {
    if (!d.createdAt) return false;
    const dStr = new Date(d.createdAt).toISOString().split('T')[0];
    return dStr === todayDateString;
  }).length;

  // 2. KESİN SATIŞ VE İHTİMALLER KIRILIMLARI
  const exactDeals = activeScopedDeals.filter((d) => d.ihtimal_derecesi === 'Kesin');
  const exactTotal = exactDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const highDeals = activeScopedDeals.filter((d) => d.ihtimal_derecesi === 'Yüksek');
  const highTotal = highDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const mediumDeals = activeScopedDeals.filter((d) => d.ihtimal_derecesi === 'Orta');
  const mediumTotal = mediumDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const lowDeals = activeScopedDeals.filter((d) => d.ihtimal_derecesi === 'Düşük');
  const lowTotal = lowDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  // 3. CHART VERİLERİ (Recharts Data Preparation)

  // A) Hedef & Gerçekleşme Verisi (Donut)
  const targetVsRealizedData = (realizedTotal === 0 && remainingToTarget === 0)
    ? [{ name: 'Hedef Tanımlanmadı', value: 1, color: '#e2e8f0' }]
    : [
        { name: 'Gerçekleşen Ciro', value: Math.max(realizedTotal, 0), color: '#059669' }, // emerald-600
        { name: 'Kalan Hedef Tutarı', value: Math.max(remainingToTarget, 0), color: '#e2e8f0' }, // slate-200
      ];

  // B) Kesin Satış ve İhtimaller Donut Data
  const totalForecastValue = exactTotal + highTotal + mediumTotal + lowTotal;
  const forecastProbabilityData = totalForecastValue > 0
    ? [
        { name: 'Kesin (%100)', value: exactTotal, count: exactDeals.length, color: '#059669' },
        { name: 'Yüksek (%75)', value: highTotal, count: highDeals.length, color: '#0284c7' },
        { name: 'Orta (%50)', value: mediumTotal, count: mediumDeals.length, color: '#d97706' },
        { name: 'Düşük (%25)', value: lowTotal, count: lowDeals.length, color: '#64748b' },
      ]
    : [{ name: 'Henüz Teklif Yok', value: 1, count: 0, color: '#e2e8f0' }];

  // C) Ekip & Satış Temsilcisi Performans Verisi (Misafir rolü haricinde herkes)
  const repPerformance = users
    .filter((u) => u.role !== 'VIEWER' && u.role !== 'GUEST')
    .map((rep) => {
      const repDeals = scopedDeals.filter((d) => d.musteri?.satis_temsilcisi_id === rep.id);
      const repOffer = repDeals
        .filter((d) => !d.is_archived && ['TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'].includes(d.asama))
        .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
      const repRealized = repDeals
        .filter((d) => !d.is_archived && WON_STAGES.includes(d.asama))
        .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
      const repTarget = rep.target !== undefined && rep.target !== null ? Number(rep.target) : (rep.role === 'SALES_REP' ? 500000 : 0);
      const repRate = repTarget > 0 ? (repRealized / repTarget) * 100 : 0;

      return {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        role: rep.role,
        offer: repOffer,
        realized: repRealized,
        target: repTarget,
        rate: repRate,
        dealCount: repDeals.length,
      };
    });

  // Rol Hiyerarşisi ve Tablo Sıralama / Filtreleme
  const roleHierarchy: Record<string, number> = {
    'SUPER_ADMIN': 1,
    'ADMIN': 1,
    'SALES_MANAGER': 2,
    'SALES_REP': 3,
  };

  const filteredRepPerformance = repPerformance.filter((rep) => {
    if (tableRoleFilter === 'ALL') return true;
    if (tableRoleFilter === 'ADMIN') return rep.role === 'ADMIN' || rep.role === 'SUPER_ADMIN';
    return rep.role === tableRoleFilter;
  });

  const sortedRepPerformance = [...filteredRepPerformance].sort((a, b) => {
    if (tableSortBy === 'role') {
      const rankA = roleHierarchy[a.role] || 99;
      const rankB = roleHierarchy[b.role] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return b.realized - a.realized;
    }
    if (tableSortBy === 'realized') {
      return b.realized - a.realized;
    }
    if (tableSortBy === 'offer') {
      return b.offer - a.offer;
    }
    if (tableSortBy === 'rate') {
      return b.rate - a.rate;
    }
    if (tableSortBy === 'name') {
      return a.name.localeCompare(b.name, 'tr');
    }
    return 0;
  });

  // Export handlers
  const handleExportExcel = () => {
    const exportData = scopedDeals.map((d) => ({
      'Firma Adı': d.musteri?.firma_adi || '',
      'Yetkili Kişi': d.musteri?.yetkili_kisi || '',
      'Telefon': d.musteri?.telefon || '',
      'E-posta': d.musteri?.eposta || '',
      'Müşteri Tipi': d.musteri?.musteri_tipi || '',
      'Satış Temsilcisi': d.musteri?.satis_temsilcisi?.name || '',
      'Kanal': d.kanal,
      'Teklif Tutarı (TL)': d.teklif_tutari,
      'Aşama': d.asama,
      'İhtimal': d.ihtimal_derecesi,
      'Teklif Başlangıç': d.baslangic_tarihi ? formatDate(d.baslangic_tarihi) : '',
      'Teklif Bitiş': d.bitis_tarihi ? formatDate(d.bitis_tarihi) : '',
      'Yayın / Teklif Dönemi': d.yayin_donemi || '',
      'Tahmini Kapanış': d.tahmini_kapanis_tarihi ? formatDate(d.tahmini_kapanis_tarihi) : '',
      'Sonraki Takip': d.musteri?.sonraki_takip_tarihi
        ? new Date(d.musteri.sonraki_takip_tarihi).toLocaleDateString('tr-TR')
        : '',
      'Not': d.not,
    }));
    exportToExcel(exportData, `TV_CRM_Rapor_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCsv = () => {
    const exportData = scopedDeals.map((d) => ({
      'Firma': d.musteri?.firma_adi || '',
      'Yetkili': d.musteri?.yetkili_kisi || '',
      'Telefon': d.musteri?.telefon || '',
      'Eposta': d.musteri?.eposta || '',
      'Temsilci': d.musteri?.satis_temsilcisi?.name || '',
      'Kanal': d.kanal,
      'Tutar': d.teklif_tutari,
      'Asama': d.asama,
      'Ihtimal': d.ihtimal_derecesi,
    }));
    exportToCsv(exportData, `TV_CRM_Rapor_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Top Bar: Title, Interactive Channel Selector & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-mono">
                YÖNETİCİ SATIŞ KONSOLU & DASHBOARD
              </h2>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Canlı Analitik
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bi Kanal & Sıfır TV Konsolide Raporlama, Finansal Grafikler ve Ciro Analitiği
            </p>
          </div>
        </div>

        {/* Interactive Scope Toggle & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Period Scope Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value={0}>Ocak</option>
              <option value={1}>Şubat</option>
              <option value={2}>Mart</option>
              <option value={3}>Nisan</option>
              <option value={4}>Mayıs</option>
              <option value={5}>Haziran</option>
              <option value={6}>Temmuz</option>
              <option value={7}>Ağustos</option>
              <option value={8}>Eylül</option>
              <option value={9}>Ekim</option>
              <option value={10}>Kasım</option>
              <option value={11}>Aralık</option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Channel Scope Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setActiveChannelScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChannelScope === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Konsolide (Tümü)
            </button>
            <button
              onClick={() => setActiveChannelScope('Bi Kanal')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeChannelScope === 'Bi Kanal'
                  ? 'bg-white text-sky-700 font-bold shadow-xs border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              Bi Kanal
            </button>
            <button
              onClick={() => setActiveChannelScope('Sıfır TV')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeChannelScope === 'Sıfır TV'
                  ? 'bg-white text-amber-800 font-bold shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Sıfır TV
            </button>
          </div>

          {/* Export Buttons - Only Super Admin (Feedback #7) */}
          {currentUser?.role === 'ADMIN' && (
            <>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Excel Formatında İndir"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="CSV Formatında İndir"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. ANA KPI KUTULARI (Data-Density Console) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Aylık Hedef */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Aylık Hedef</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-slate-900">{formatCurrency(totalTarget)}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Konsolide Kota
            </div>
          </div>
        </div>

        {/* KPI 2: Gerçekleşen Satış */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Gerçekleşen</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-emerald-700">{formatCurrency(realizedTotal)}</div>
            <div className="text-[10px] font-mono text-emerald-800 font-medium mt-1">
              Kota: <strong className="text-emerald-950 font-bold">%{achievementRate.toFixed(1)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 3: HEDEFE KALAN */}
        <div className="bg-rose-50/40 border border-rose-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Hedefe Kalan</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-rose-700">{formatCurrency(remainingToTarget)}</div>
            <div className="text-[10px] font-mono text-rose-800 font-medium mt-1">
              {remainingToTarget === 0 ? 'Hedef Aşıldı 🎉' : 'Kalan Tutar'}
            </div>
          </div>
        </div>

        {/* KPI 4: Bekleyen Teklif */}
        <div className="bg-amber-50/40 border border-amber-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Bekleyen Teklif</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-amber-800">{formatCurrency(pendingTotal)}</div>
            <div className="text-[10px] font-mono text-amber-700 mt-1">
              Pazarlıkta ({pendingDeals.length})
            </div>
          </div>
        </div>

      </div>

      {/* 2. GÖRSEL GRAFİKLER: KOTA İLERLEMESİ & KESİN SATIŞ / İHTİMALLER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* SOL GRAFİK: AYLIK HEDEF VE GERÇEKLEŞME İLERLEMESİ */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                  KOTA VE HEDEF İLERLEMESİ
                </h3>
                <p className="text-[10px] text-slate-500 font-sans">Aylık kota tamamlama oranı</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              %{achievementRate.toFixed(1)} TAMAMLANDI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto">
            {/* Donut Chart with Recharts Animation */}
            <div className="sm:col-span-6 h-48 w-full min-w-0 relative flex items-center justify-center">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                  <PieChart>
                    <Pie
                      data={targetVsRealizedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={900}
                      animationEasing="ease-out"
                      onMouseEnter={(_, index) => setHoveredQuotaSlice(index)}
                      onMouseLeave={() => setHoveredQuotaSlice(null)}
                    >
                      {targetVsRealizedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse" />
              )}
              {/* Center Stat - Hides smoothly on hover to prevent collision with tooltip */}
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200 ${
                  hoveredQuotaSlice !== null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                }`}
              >
                <span className="text-2xl font-mono font-black text-emerald-700">
                  %{achievementRate.toFixed(0)}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">KOTA</span>
              </div>
            </div>

            {/* Target Details & Metrics */}
            <div className="sm:col-span-6 space-y-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Gerçekleşen Satış
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-emerald-700">
                  {formatCurrency(realizedTotal)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Hedefe Kalan
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-700">
                  {formatCurrency(remainingToTarget)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                  <span className="font-medium">Hedef Kota</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900">
                  {formatCurrency(totalTarget)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar under chart */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1.5">
              <span>Hedefe Ulaşma Seviyesi</span>
              <span className="text-emerald-700 font-bold">{formatCurrency(realizedTotal)} / {formatCurrency(totalTarget)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* SAĞ GRAFİK: KESİN SATIŞ VE İHTİMALLER */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                  KESİN SATIŞ VE İHTİMALLER
                </h3>
                <p className="text-[10px] text-slate-500">Öngörülen Teklif Kabul Oranları &amp; Dağılımı</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                {formatCurrency(totalForecastValue)}
              </span>
            </div>
          </div>

          {/* Forecasting Donut Chart */}
          <div className="h-48 w-full min-w-0 relative flex items-center justify-center my-auto">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                <PieChart>
                  <Pie
                    data={forecastProbabilityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={900}
                    onMouseEnter={(_, index) => setHoveredForecastSlice(index)}
                    onMouseLeave={() => setHoveredForecastSlice(null)}
                  >
                    {forecastProbabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse" />
            )}
            {/* Center Stat - Hides smoothly on hover to prevent collision with tooltip */}
            <div 
              className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200 ${
                hoveredForecastSlice !== null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
              }`}
            >
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">TOPLAM</span>
              <span className="text-sm font-mono font-black text-emerald-700">
                ₺{(totalForecastValue / 1000).toFixed(0)}K
              </span>
            </div>
          </div>

          {/* Probability Breakdown Cards */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
            {forecastProbabilityData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-slate-400">{item.count} Adet</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. SATIŞ & EKİP PERFORMANS TABLOSU (DETAYLI LİSTE) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
              EKİP &amp; SATIŞ PERFORMANS TABLOSU
            </h3>
            <span className="text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md font-medium">
              {sortedRepPerformance.length} / {repPerformance.length} Kişi
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Rol Filtre Butonları */}
            <div className="inline-flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setTableRoleFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  tableRoleFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setTableRoleFilter('SALES_REP')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  tableRoleFilter === 'SALES_REP'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Temsilci
              </button>
              <button
                type="button"
                onClick={() => setTableRoleFilter('SALES_MANAGER')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  tableRoleFilter === 'SALES_MANAGER'
                    ? 'bg-sky-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yönetici
              </button>
              <button
                type="button"
                onClick={() => setTableRoleFilter('ADMIN')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  tableRoleFilter === 'ADMIN'
                    ? 'bg-rose-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Marka Merkezi
              </button>
            </div>

            {/* Sıralama Seçimi */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={tableSortBy}
                onChange={(e) => setTableSortBy(e.target.value as any)}
                className="bg-transparent text-[11px] font-mono text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="realized">Sırala: Gerçekleşen Satış</option>
                <option value="offer">Sırala: Bekleyen Teklif</option>
                <option value="rate">Sırala: Kota Gerçekleşme (%)</option>
                <option value="role">Sırala: Rol Hiyerarşisi</option>
                <option value="name">Sırala: İsim (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Ekip Üyesi</th>
                <th className="px-4 py-3">Bekleyen Teklif</th>
                <th className="px-4 py-3">Gerçekleşen Satış</th>
                <th className="px-4 py-3">Hedef</th>
                <th className="px-4 py-3">Kota Gerçekleşme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRepPerformance.map((rep) => {
                const badge = getRoleBadge(rep.role);
                return (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{rep.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{rep.email}</span>
                        {rep.dealCount > 0 && (
                          <span className="text-slate-400 font-medium">({rep.dealCount} Fırsat)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-700 font-medium">
                      {formatCurrency(rep.offer)}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                      {formatCurrency(rep.realized)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {rep.target > 0 ? formatCurrency(rep.target) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {rep.target > 0 ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(rep.rate, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-900">
                            %{rep.rate.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 font-medium">Hedefsiz</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedRepPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400 font-mono text-xs">
                    KAYITLI EKİP ÜYESİ BULUNAMADI
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};


