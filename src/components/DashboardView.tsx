'use client';

import React, { useState } from 'react';
import { Deal, User, Client } from '@/types';
import { formatCurrency, exportToExcel, exportToCsv } from '@/lib/formatters';
import { 
  Target, 
  Layers, 
  Clock, 
  DollarSign, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  Activity,
  CheckCircle2,
  Users,
  Tv,
  TrendingDown,
  TrendingUp,
  Calculator,
  BarChart3,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
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
  const [stageViewMetric, setStageViewMetric] = useState<'amount' | 'count'>('amount');

  // Hover states for Donut Charts to prevent center label & tooltip collision
  const [hoveredQuotaSlice, setHoveredQuotaSlice] = useState<number | null>(null);
  const [hoveredForecastSlice, setHoveredForecastSlice] = useState<number | null>(null);

  // Filter deals based on active channel scope for the reactive charts
  const scopedDeals = activeChannelScope === 'all' 
    ? deals 
    : deals.filter((d) => d.kanal === activeChannelScope);

  // 1. Calculations for KPIs (Scoped & Global)
  const realizedDeals = scopedDeals.filter((d) => ['SATIŞ', 'YAYIN', 'TAHSİLAT'].includes(d.asama));
  const realizedTotal = realizedDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const pipelineTotal = scopedDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const pendingDeals = scopedDeals.filter((d) => ['TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'].includes(d.asama));
  const pendingTotal = pendingDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const collectionDeals = scopedDeals.filter((d) => d.asama === 'TAHSİLAT');
  const collectionTotal = collectionDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const isRep = currentUser?.role === 'SALES_REP';
  const totalTarget = isRep
    ? currentUser?.target || 500000
    : users.reduce((sum, u) => sum + (u.target || 0), 0);

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

  // 2. KANAL BAZINDA (Bİ KANAL vs. SIFIR TV) AYRIMI
  const biKanalDeals = deals.filter((d) => d.kanal === 'Bi Kanal');
  const biKanalRealized = biKanalDeals
    .filter((d) => ['SATIŞ', 'YAYIN', 'TAHSİLAT'].includes(d.asama))
    .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
  const biKanalPipeline = biKanalDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
  const biKanalPending = biKanalDeals
    .filter((d) => ['TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'].includes(d.asama))
    .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const sifirTvDeals = deals.filter((d) => d.kanal === 'Sıfır TV');
  const sifirTvRealized = sifirTvDeals
    .filter((d) => ['SATIŞ', 'YAYIN', 'TAHSİLAT'].includes(d.asama))
    .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
  const sifirTvPipeline = sifirTvDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
  const sifirTvPending = sifirTvDeals
    .filter((d) => ['TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'].includes(d.asama))
    .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  // 3. SATIŞ TAHMİNİ (FORECASTING) KIRILIMLARI
  const exactDeals = scopedDeals.filter((d) => d.ihtimal_derecesi === 'Kesin');
  const exactTotal = exactDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const highDeals = scopedDeals.filter((d) => d.ihtimal_derecesi === 'Yüksek');
  const highTotal = highDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const mediumDeals = scopedDeals.filter((d) => d.ihtimal_derecesi === 'Orta');
  const mediumTotal = mediumDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const lowDeals = scopedDeals.filter((d) => d.ihtimal_derecesi === 'Düşük');
  const lowTotal = lowDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  const weightedForecast =
    exactTotal * 1.0 + highTotal * 0.75 + mediumTotal * 0.5 + lowTotal * 0.25;

  // 4. CHART VERİLERİ (Recharts Data Preparation)

  // A) Hedef & Gerçekleşme Verisi (Donut)
  const targetVsRealizedData = (realizedTotal === 0 && remainingToTarget === 0)
    ? [{ name: 'Hedef Tanımlanmadı', value: 1, color: '#e2e8f0' }]
    : [
        { name: 'Gerçekleşen Ciro', value: Math.max(realizedTotal, 0), color: '#059669' }, // emerald-600
        { name: 'Kalan Hedef Tutarı', value: Math.max(remainingToTarget, 0), color: '#e2e8f0' }, // slate-200
      ];

  // B) Kanal Karşılaştırma Grafiği Verisi (Bar Chart)
  const channelComparisonData = [
    {
      kategori: 'Gerçekleşen Satış',
      'Bi Kanal': biKanalRealized,
      'Sıfır TV': sifirTvRealized,
    },
    {
      kategori: 'Aktif Pipeline',
      'Bi Kanal': biKanalPipeline,
      'Sıfır TV': sifirTvPipeline,
    },
    {
      kategori: 'Bekleyen Teklif',
      'Bi Kanal': biKanalPending,
      'Sıfır TV': sifirTvPending,
    },
  ];

  // C) Aşama / Satış Hunisi Verisi (Pipeline Funnel Stages)
  const stageDefinitions = [
    { key: 'TEKLİF', label: 'Teklif Hazırlandı', color: '#0284c7' }, // sky-600
    { key: 'TAKİP', label: 'Takip Aşamasında', color: '#6366f1' }, // indigo-500
    { key: 'PAZARLIK', label: 'Pazarlık / Revize', color: '#d97706' }, // amber-600
    { key: 'ONAY', label: 'Yönetim Onayında', color: '#9333ea' }, // purple-600
    { key: 'SATIŞ', label: 'Satış / Sözleşme', color: '#059669' }, // emerald-600
    { key: 'YAYIN', label: 'Yayında', color: '#0d9488' }, // teal-600
    { key: 'TAHSİLAT', label: 'Tahsilat', color: '#2563eb' }, // blue-600
  ];

  const stageDistributionData = stageDefinitions.map((st) => {
    const stageDeals = scopedDeals.filter((d) => d.asama === st.key);
    const stageAmount = stageDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
    return {
      asama: st.label,
      shortLabel: st.key,
      tutar: stageAmount,
      adet: stageDeals.length,
      metricValue: stageViewMetric === 'amount' ? stageAmount : stageDeals.length,
      fill: st.color,
    };
  });

  // D) Satış Tahmini (Forecasting) Donut Data
  const totalForecastValue = exactTotal + highTotal + mediumTotal + lowTotal;
  const forecastProbabilityData = totalForecastValue > 0
    ? [
        { name: 'Kesin (%100)', value: exactTotal, weighted: exactTotal * 1.0, count: exactDeals.length, color: '#059669' },
        { name: 'Yüksek (%75)', value: highTotal, weighted: highTotal * 0.75, count: highDeals.length, color: '#0284c7' },
        { name: 'Orta (%50)', value: mediumTotal, weighted: mediumTotal * 0.5, count: mediumDeals.length, color: '#d97706' },
        { name: 'Düşük (%25)', value: lowTotal, weighted: lowTotal * 0.25, count: lowDeals.length, color: '#64748b' },
      ]
    : [{ name: 'Henüz Teklif Yok', value: 1, weighted: 0, count: 0, color: '#e2e8f0' }];

  // E) Satış Temsilcisi Performans Verisi
  const repPerformance = users
    .filter((u) => u.role === 'SALES_REP')
    .map((rep) => {
      const repDeals = scopedDeals.filter((d) => d.musteri?.satis_temsilcisi_id === rep.id);
      const repPipeline = repDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
      const repOffer = repDeals
        .filter((d) => ['TEKLİF', 'TAKİP', 'PAZARLIK', 'ONAY'].includes(d.asama))
        .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
      const repRealized = repDeals
        .filter((d) => ['SATIŞ', 'YAYIN', 'TAHSİLAT'].includes(d.asama))
        .reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
      const repTarget = rep.target ?? 500000;
      const repRate = repTarget > 0 ? (repRealized / repTarget) * 100 : 0;

      return {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        pipeline: repPipeline,
        offer: repOffer,
        realized: repRealized,
        target: repTarget,
        rate: repRate,
        dealCount: repDeals.length,
      };
    });

  // Export handlers
  const handleExportExcel = () => {
    const exportData = deals.map((d) => ({
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
      'Yayın Dönemi': d.yayin_donemi,
      'Sonraki Takip': d.musteri?.sonraki_takip_tarihi
        ? new Date(d.musteri.sonraki_takip_tarihi).toLocaleDateString('tr-TR')
        : '',
      'Not': d.not,
    }));
    exportToExcel(exportData, `TV_CRM_Rapor_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCsv = () => {
    const exportData = deals.map((d) => ({
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
        
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
              {isRep ? 'Bireysel Kota' : 'Konsolide Kota'}
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

        {/* KPI 4: Toplam Pipeline */}
        <div className="bg-sky-50/40 border border-sky-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-sky-800">{formatCurrency(pipelineTotal)}</div>
            <div className="text-[10px] font-mono text-sky-700 mt-1">
              {scopedDeals.length} Fırsat
            </div>
          </div>
        </div>

        {/* KPI 5: Bekleyen Teklif */}
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

        {/* KPI 6: Tahsilat */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Tahsilat</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-black text-slate-800">{formatCurrency(collectionTotal)}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Yayın Sonrası ({collectionDeals.length})
            </div>
          </div>
        </div>

        {/* KPI 7: Bugünün Özeti */}
        <div className="bg-slate-900 text-white border border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-sky-400 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">BUGÜN</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Yeni Müşteri:</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.2 rounded">{todayClientsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Yeni Teklif:</span>
              <span className="font-bold text-emerald-400 bg-slate-800 px-1.5 py-0.2 rounded">{todayNewDealsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Takip:</span>
              <span className="font-bold text-amber-400 bg-slate-800 px-1.5 py-0.2 rounded">{todayFollowUpsCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. GÖRSEL GRAFİKLER BÖLÜMÜ 1: HEDEF İLERLEMESİ & KANAL KARŞILAŞTIRMASI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* SOL GRAFİK: AYLIK HEDEF VE GERÇEKLEŞME İLERLEMESİ (5/12) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
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

        {/* SAĞ GRAFİK: Bİ KANAL vs. SIFIR TV KARŞILAŞTIRMALI CİRO & PİPELİNE GRAFİĞİ (7/12) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                  KANAL BAZLI GELİR VE PİPELİNE KARŞILAŞTIRMASI
                </h3>
                <p className="text-[10px] text-slate-500">Bi Kanal & Sıfır TV Finansal Dağılımı</p>
              </div>
            </div>

            {/* Live Channel Badges */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                Bi Kanal
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Sıfır TV
              </span>
            </div>
          </div>

          {/* Grouped Bar Chart */}
          <div className="h-60 w-full min-w-0">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={channelComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="kategori" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    fontFamily="monospace"
                    tickFormatter={(val) => `₺${(val / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)', stroke: 'none' }} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }} 
                  />
                  <Bar 
                    dataKey="Bi Kanal" 
                    fill="#0284c7" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={36} 
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                  <Bar 
                    dataKey="Sıfır TV" 
                    fill="#d97706" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={36} 
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse" />
            )}
          </div>

          {/* Channel Summary Footer */}
          <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-slate-100 text-[11px] font-mono">
            <div className="flex items-center justify-between bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/80">
              <span className="text-sky-800 font-bold">Bi Kanal Toplam:</span>
              <span className="text-slate-900 font-black">{formatCurrency(biKanalRealized + biKanalPipeline)}</span>
            </div>
            <div className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
              <span className="text-amber-900 font-bold">Sıfır TV Toplam:</span>
              <span className="text-slate-900 font-black">{formatCurrency(sifirTvRealized + sifirTvPipeline)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. GÖRSEL GRAFİKLER BÖLÜMÜ 2: SATIŞ HUNİSİ (AŞAMA DAĞILIMI) & FORECASTING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* SOL GRAFİK: AŞAMA VE SATIŞ HUNİSİ (PIPELINE STAGES VOLUME) (7/12) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                  SATIŞ AŞAMALARI VE PİPELİNE DAĞILIMI
                </h3>
                <p className="text-[10px] text-slate-500">
                  Fırsatların aşamalara göre finansal hacmi ve adetleri
                </p>
              </div>
            </div>

            {/* Metric Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-mono">
              <button
                onClick={() => setStageViewMetric('amount')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  stageViewMetric === 'amount'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tutar (₺)
              </button>
              <button
                onClick={() => setStageViewMetric('count')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  stageViewMetric === 'count'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Adet
              </button>
            </div>
          </div>

          <div className="h-64 w-full min-w-0">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <BarChart data={stageDistributionData} margin={{ top: 10, right: 10, left: -5, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="shortLabel" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false}
                    fontFamily="monospace"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    fontFamily="monospace"
                    tickFormatter={(val) => stageViewMetric === 'amount' ? `₺${(val / 1000).toFixed(0)}K` : `${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)', stroke: 'none' }} />
                  <Bar 
                    dataKey="metricValue" 
                    name={stageViewMetric === 'amount' ? 'Aşama Tutarı' : 'Anlaşma Adedi'} 
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={900}
                  >
                    {stageDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse" />
            )}
          </div>

          {/* Stages count chips */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-3 border-t border-slate-100 text-[10px] font-mono">
            {stageDistributionData.map((st, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.fill }}></span>
                <span className="text-slate-500">{st.shortLabel}:</span>
                <span className="font-bold text-slate-800">{st.adet} Adet</span>
              </div>
            ))}
          </div>
        </div>

        {/* SAĞ GRAFİK: SATIŞ TAHMİNİ (FORECASTING) & OLASILIK DAĞILIMI (5/12) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                  FORECASTING & OLASILIK
                </h3>
                <p className="text-[10px] text-slate-500">Ağırlıklı Net Ciro Tahmini</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                {formatCurrency(weightedForecast)}
              </span>
            </div>
          </div>

          {/* Forecasting Donut Chart */}
          <div className="h-44 w-full min-w-0 relative flex items-center justify-center">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                <PieChart>
                  <Pie
                    data={forecastProbabilityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
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
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">AĞIRLIKLI</span>
              <span className="text-sm font-mono font-black text-emerald-700">
                ₺{(weightedForecast / 1000).toFixed(0)}K
              </span>
            </div>
          </div>

          {/* Probability Breakdown Cards */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {forecastProbabilityData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-slate-400">{item.count} Adet</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800">
                  {formatCurrency(item.value)}
                </div>
                <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">
                  Katkı: {formatCurrency(item.weighted)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. GÖRSEL GRAFİK: SATIŞ TEMSİLCİSİ KOTA & GERÇEKLEŞME PERFORMANSI */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                SATIŞ TEMSİLCİLERİ HEDEF & GERÇEKLEŞEN PERFORMANS GRAFİĞİ
              </h3>
              <p className="text-[10px] text-slate-500">
                Temsilci bazında bireysel kota, gerçekleşen satış ve aktif portföy karşılaştırması
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-bold">
            {repPerformance.length} Aktif Temsilci
          </span>
        </div>

        {/* Rep Bar Chart */}
        <div className="h-64 w-full min-w-0">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart 
                data={repPerformance} 
                margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="monospace"
                  tickFormatter={(val) => `₺${(val / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)', stroke: 'none' }} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }} 
                />
                <Bar 
                  dataKey="target" 
                  name="Kota Hedefi" 
                  fill="#cbd5e1" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28} 
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Bar 
                  dataKey="realized" 
                  name="Gerçekleşen Satış" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28} 
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Bar 
                  dataKey="pipeline" 
                  name="Aktif Pipeline" 
                  fill="#0284c7" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28} 
                  isAnimationActive={true}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse" />
          )}
        </div>
      </div>

      {/* 5. SATIŞÇI PERFORMANS TABLOSU (DETAYLI LİSTE) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
              SATIŞ TEMSİLCİSİ PERFORMANS TABLOSU
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-medium">CANLI KONSOL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Satışçı</th>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3">Bekleyen Teklif</th>
                <th className="px-4 py-3">Gerçekleşen Satış</th>
                <th className="px-4 py-3">Hedef</th>
                <th className="px-4 py-3">Kota Gerçekleşme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repPerformance.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{rep.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{rep.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sky-700 font-bold">
                    {formatCurrency(rep.pipeline)}
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-700 font-medium">
                    {formatCurrency(rep.offer)}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                    {formatCurrency(rep.realized)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {formatCurrency(rep.target)}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              ))}
              {repPerformance.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 font-mono text-xs">
                    KAYITLI SATIŞ TEMSİLCİSİ BULUNAMADI
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


