'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Deal, DealStage, STAGES, Client, User } from '@/types';
import { updateDealStage } from '@/app/actions';
import { formatCurrency, formatDate, getFollowUpStatus } from '@/lib/formatters';
import {
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowDownUp,
  Building2,
  ChevronRight,
  Maximize2,
  Minimize2,
  Check,
  Tv,
  FileText,
  BadgeCheck,
  CreditCard,
  Radio,
  Handshake,
} from 'lucide-react';

interface KanbanBoardProps {
  deals: Deal[];
  currentUser?: User | null;
  onRefresh: () => void;
  onOpenFollowUpModal: (client: Client) => void;
  onOpenAddDealModal: (client: Client) => void;
}

// Visual configuration for each pipeline stage (Y-Axis Sections)
const STAGE_CONFIG: Record<
  DealStage,
  {
    step: string;
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
    headerBg: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  'YENİ LEAD': {
    step: '01',
    label: 'YENİ LEAD',
    description: 'Yeni gelen talep ve müşteri adayları',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    badgeText: 'text-slate-700',
    borderAccent: 'border-l-slate-600',
    headerBg: 'bg-slate-50/80 hover:bg-slate-100/80',
    icon: Sparkles,
  },
  'GÖRÜŞME': {
    step: '02',
    label: 'GÖRÜŞME',
    description: 'İlk temas ve ihtiyaç analizi',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeText: 'text-sky-700',
    borderAccent: 'border-l-sky-500',
    headerBg: 'bg-sky-50/40 hover:bg-sky-50/70',
    icon: MessageSquare,
  },
  'TEKLİF': {
    step: '03',
    label: 'TEKLİF',
    description: 'Hazırlanan ve iletilen reklam teklifleri',
    badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    badgeText: 'text-cyan-800',
    borderAccent: 'border-l-cyan-500',
    headerBg: 'bg-cyan-50/40 hover:bg-cyan-50/70',
    icon: FileText,
  },
  'TAKİP': {
    step: '04',
    label: 'TAKİP',
    description: 'Teklif sonrası periyodik takip ve geri dönüş',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    borderAccent: 'border-l-amber-500',
    headerBg: 'bg-amber-50/40 hover:bg-amber-50/70',
    icon: Clock,
  },
  'PAZARLIK': {
    step: '05',
    label: 'PAZARLIK',
    description: 'Fiyat, süre ve barter müzakereleri',
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    badgeText: 'text-orange-800',
    borderAccent: 'border-l-orange-500',
    headerBg: 'bg-orange-50/40 hover:bg-orange-50/70',
    icon: Handshake,
  },
  'ONAY': {
    step: '06',
    label: 'ONAY',
    description: 'Sözleşme onayı ve yetkili imzası aşaması',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    badgeText: 'text-purple-800',
    borderAccent: 'border-l-purple-500',
    headerBg: 'bg-purple-50/40 hover:bg-purple-50/70',
    icon: BadgeCheck,
  },
  'SATIŞ': {
    step: '07',
    label: 'SATIŞ',
    description: 'Başarıyla kapatılan kesin anlaşmalar',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    borderAccent: 'border-l-emerald-500',
    headerBg: 'bg-emerald-50/40 hover:bg-emerald-50/70',
    icon: CheckCircle2,
  },
  'YAYIN': {
    step: '08',
    label: 'YAYIN',
    description: 'Yayına giren TV reklam kuşakları',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-800',
    borderAccent: 'border-l-indigo-500',
    headerBg: 'bg-indigo-50/40 hover:bg-indigo-50/70',
    icon: Radio,
  },
  'TAHSİLAT': {
    step: '09',
    label: 'TAHSİLAT',
    description: 'Fatura ve ödeme tamamlama süreci',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    badgeText: 'text-teal-800',
    borderAccent: 'border-l-teal-600',
    headerBg: 'bg-teal-50/40 hover:bg-teal-50/70',
    icon: CreditCard,
  },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  deals,
  currentUser,
  onRefresh,
  onOpenFollowUpModal,
  onOpenAddDealModal,
}) => {
  const [mounted, setMounted] = useState(false);
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'company-asc' | 'date-desc'>('amount-desc');
  
  // Collapse state for each stage (default: all expanded)
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  const isReadOnly = currentUser?.role === 'VIEWER';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const toggleStageCollapse = (stage: string) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stage]: !prev[stage],
    }));
  };

  const expandAll = () => setCollapsedStages({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    STAGES.forEach((s) => {
      allCollapsed[s] = true;
    });
    setCollapsedStages(allCollapsed);
  };

  // Drag & Drop Handler along the Y-axis
  const handleDragEnd = async (result: DropResult) => {
    if (isReadOnly) {
      alert('İzleme / Misafir modunda fırsat aşamalarına müdahale edilemez.');
      return;
    }

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const deal = localDeals.find((d) => d.id === draggableId);
    if (!deal) return;

    if (
      currentUser &&
      currentUser.role !== 'ADMIN' &&
      currentUser.role !== 'SUPER_ADMIN' &&
      deal.musteri?.satis_temsilcisi_id !== currentUser.id
    ) {
      alert('Sadece kendi müşterilerinize ait fırsatları güncelleyebilirsiniz.');
      return;
    }

    const newStage = destination.droppableId as DealStage;

    // Optimistic UI state update
    setLocalDeals((prev) =>
      prev.map((d) => (d.id === draggableId ? { ...d, asama: newStage } : d))
    );

    try {
      const res = await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: draggableId, asama: newStage }),
      });
      if (!res.ok) {
        await updateDealStage(draggableId, newStage);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      setLocalDeals(deals);
    }
  };

  // Quick close deal to SATIŞ
  const handleQuickCloseSale = async (deal: Deal) => {
    if (
      currentUser &&
      currentUser.role !== 'ADMIN' &&
      currentUser.role !== 'SUPER_ADMIN' &&
      deal.musteri?.satis_temsilcisi_id !== currentUser.id
    ) {
      alert('Sadece kendi müşterilerinize ait fırsatları güncelleyebilirsiniz.');
      return;
    }
    const confirm = window.confirm(
      `"${deal.musteri?.firma_adi}" için anlaşmayı SATIŞ aşamasına taşımak istiyor musunuz?`
    );
    if (!confirm) return;

    setLocalDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, asama: 'SATIŞ' } : d))
    );
    try {
      const res = await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, asama: 'SATIŞ' }),
      });
      if (!res.ok) {
        await updateDealStage(deal.id, 'SATIŞ');
      }
    } catch {
      await updateDealStage(deal.id, 'SATIŞ');
    }
    onRefresh();
  };

  const getProbabilityBadge = (prob: string) => {
    switch (prob) {
      case 'Kesin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Yüksek':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Orta':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Filtered & Sorted deals
  const filteredDeals = useMemo(() => {
    return localDeals.filter((deal) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const firma = deal.musteri?.firma_adi?.toLowerCase() || '';
      const yetkili = deal.musteri?.yetkili_kisi?.toLowerCase() || '';
      const temsilci = deal.musteri?.satis_temsilcisi?.name?.toLowerCase() || '';
      const kanal = deal.kanal?.toLowerCase() || '';
      const tutar = deal.teklif_tutari?.toString() || '';
      const notText = deal.not?.toLowerCase() || '';
      return (
        firma.includes(term) ||
        yetkili.includes(term) ||
        temsilci.includes(term) ||
        kanal.includes(term) ||
        tutar.includes(term) ||
        notText.includes(term)
      );
    });
  }, [localDeals, searchTerm]);

  // Overall Pipeline Metrics
  const pipelineMetrics = useMemo(() => {
    const totalCount = filteredDeals.length;
    const totalValue = filteredDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
    const wonDeals = filteredDeals.filter((d) => d.asama === 'SATIŞ' || d.asama === 'TAHSİLAT');
    const wonValue = wonDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
    const activePipelineDeals = filteredDeals.filter(
      (d) => d.asama !== 'SATIŞ' && d.asama !== 'TAHSİLAT'
    );
    const activeValue = activePipelineDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

    return { totalCount, totalValue, wonValue, activeValue };
  }, [filteredDeals]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 font-mono text-xs">
        PİPELİNE YÜKLENİYOR...
      </div>
    );
  }

  const visibleStages =
    selectedStageFilter === 'all'
      ? STAGES
      : STAGES.filter((s) => s === selectedStageFilter);

  return (
    <div className="space-y-4 select-none pb-12">
      {/* 1. Pipeline Summary & Metrics Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-900 text-white rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                SATIŞ & TEKLİF PİPELİNE (YATAY TABLO AKIŞI)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Aşamalar Y ekseninde (yukarıdan aşağı) sıralanmıştır. Fırsatları yukarı/aşağı sürükleyerek aşamalar arasında taşıyabilirsiniz.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-left">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Toplam İş
              </span>
              <span className="text-sm font-mono font-black text-slate-900">
                {pipelineMetrics.totalCount} Adet
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-left">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Toplam Hacim
              </span>
              <span className="text-sm font-mono font-black text-slate-900">
                {formatCurrency(pipelineMetrics.totalValue)}
              </span>
            </div>
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl px-3 py-2 text-left">
              <span className="text-[10px] font-mono uppercase text-sky-700 font-bold block">
                Açık Potansiyel
              </span>
              <span className="text-sm font-mono font-black text-sky-900">
                {formatCurrency(pipelineMetrics.activeValue)}
              </span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl px-3 py-2 text-left">
              <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">
                Kapanan Satış
              </span>
              <span className="text-sm font-mono font-black text-emerald-900">
                {formatCurrency(pipelineMetrics.wonValue)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Pipeline Controls: Search, Filter Tabs, Expand/Collapse */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Firma adı, yetkili, temsilci veya tutar ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Tools: Sort & Expand / Collapse */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="amount-desc">Tutar: Yüksekten Düşüğe</option>
                <option value="amount-asc">Tutar: Düşükten Yükseğe</option>
                <option value="company-asc">Firma Adı (A-Z)</option>
                <option value="date-desc">Kayıt Tarihi (Yeni)</option>
              </select>
            </div>

            {/* Expand / Collapse All Buttons */}
            <button
              onClick={expandAll}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Tüm Aşamaları Genişlet"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tümünü Aç</span>
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Tüm Aşamaları Daralt"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Daralt</span>
            </button>
          </div>
        </div>

        {/* 3. Stage Quick Jump Filter Strip */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedStageFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedStageFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            Tüm Aşamalar ({filteredDeals.length})
          </button>
          {STAGES.map((s) => {
            const count = filteredDeals.filter((d) => d.asama === s).length;
            const config = STAGE_CONFIG[s];
            const isSelected = selectedStageFilter === s;

            return (
              <button
                key={s}
                onClick={() => setSelectedStageFilter(s)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span className="font-mono text-[10px] opacity-70">{config.step}</span>
                <span>{s}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-sky-800 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DragDropContext for Y-Axis Vertical Pipeline System */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-3.5">
          {visibleStages.map((stage) => {
            const stageConfig = STAGE_CONFIG[stage];
            const StageIcon = stageConfig.icon;
            const isCollapsed = !!collapsedStages[stage];

            let stageDeals = filteredDeals.filter((d) => d.asama === stage);

            // Sorting deals inside the stage
            stageDeals = [...stageDeals].sort((a, b) => {
              if (sortBy === 'amount-desc') {
                return (b.teklif_tutari || 0) - (a.teklif_tutari || 0);
              }
              if (sortBy === 'amount-asc') {
                return (a.teklif_tutari || 0) - (b.teklif_tutari || 0);
              }
              if (sortBy === 'company-asc') {
                return (a.musteri?.firma_adi || '').localeCompare(b.musteri?.firma_adi || '');
              }
              if (sortBy === 'date-desc') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              return 0;
            });

            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

            return (
              <div
                key={stage}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200 border-l-[6px] ${stageConfig.borderAccent}`}
              >
                {/* Stage Header (Büyük Başlık & Özet) */}
                <div
                  onClick={() => toggleStageCollapse(stage)}
                  className={`p-3.5 sm:p-4 ${stageConfig.headerBg} border-b border-slate-200/80 cursor-pointer flex items-center justify-between gap-3 transition-colors`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {/* Step Number Badge */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-black text-xs sm:text-sm text-slate-800 shadow-2xs">
                      {stageConfig.step}
                    </div>

                    {/* Stage Title & Icon */}
                    <div>
                      <div className="flex items-center gap-2">
                        <StageIcon className={`w-4 h-4 ${stageConfig.badgeText}`} />
                        <h3 className="font-mono font-black text-xs sm:text-sm tracking-wide text-slate-900 uppercase">
                          {stage}
                        </h3>
                        <span
                          className={`font-mono font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border ${stageConfig.badgeBg}`}
                        >
                          {stageDeals.length} Fırsat
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                        {stageConfig.description}
                      </p>
                    </div>
                  </div>

                  {/* Stage Total & Expand/Collapse Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Aşama Toplamı
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                        {formatCurrency(stageTotal)}
                      </span>
                    </div>

                    <div className="p-1 rounded-lg bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-800">
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Droppable Stage Area (Excel Tablosu & Dikey Sürükle Bırak) */}
                {!isCollapsed && (
                  <Droppable droppableId={stage} direction="vertical">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2.5 sm:p-3 transition-colors duration-150 min-h-[90px] ${
                          snapshot.isDraggingOver
                            ? 'bg-sky-50/70 border-2 border-dashed border-sky-400'
                            : 'bg-slate-50/40'
                        }`}
                      >
                        {/* Excel Column Headers Bar (Desktop) */}
                        {stageDeals.length > 0 && (
                          <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-1.5 mb-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-100/80 rounded-lg border border-slate-200/80">
                            <div className="col-span-1 flex items-center gap-1">
                              <span>TAŞI</span>
                            </div>
                            <div className="col-span-1">KANAL</div>
                            <div className="col-span-3">MÜŞTERİ / FİRMA & YETKİLİ</div>
                            <div className="col-span-2 text-right">TEKLİF TUTARI</div>
                            <div className="col-span-1 text-center">İHTİMAL</div>
                            <div className="col-span-1">DÖNEM / TARİH</div>
                            <div className="col-span-1">TAKİP DURUMU</div>
                            <div className="col-span-2 text-right">HIZLI AKSİYONLAR</div>
                          </div>
                        )}

                        {/* List of Draggable Deal Rows */}
                        <div className="space-y-2">
                          {stageDeals.map((deal, index) => {
                            const client = deal.musteri;
                            const followUp = client?.sonraki_takip_tarihi
                              ? getFollowUpStatus(client.sonraki_takip_tarihi)
                              : null;

                            const isBiKanal = deal.kanal === 'Bi Kanal';
                            const isDealOwner = currentUser?.id === client?.satis_temsilcisi_id;
                            const isAdmin =
                              currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
                            const canManageDeal = (isAdmin || isDealOwner) && !isReadOnly;

                            return (
                              <Draggable
                                key={deal.id}
                                draggableId={deal.id}
                                index={index}
                                isDragDisabled={!canManageDeal}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    className={`bg-white rounded-xl border transition-all duration-150 ${
                                      isBiKanal
                                        ? 'border-l-4 border-l-sky-500 border-slate-200'
                                        : 'border-l-4 border-l-amber-500 border-slate-200'
                                    } ${
                                      dragSnapshot.isDragging
                                        ? 'shadow-2xl ring-2 ring-sky-500 border-sky-500 z-50 bg-white scale-[1.01]'
                                        : 'hover:border-slate-300 hover:shadow-xs'
                                    }`}
                                  >
                                    {/* Desktop Excel Row View (lg and above) */}
                                    <div className="hidden lg:grid grid-cols-12 gap-2 items-center px-3 py-2.5">
                                      {/* 1. Drag Grip Handle & Row Index */}
                                      <div className="col-span-1 flex items-center gap-1.5">
                                        <div
                                          {...dragProvided.dragHandleProps}
                                          className={`p-1 rounded-md transition ${
                                            canManageDeal
                                              ? 'cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                                              : 'cursor-not-allowed text-slate-300'
                                          }`}
                                          title={
                                            canManageDeal
                                              ? 'Aşamalar arasında taşımak için yukarı/aşağı sürükleyin'
                                              : 'Bu fırsatı taşıma yetkiniz yok'
                                          }
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                                          #{index + 1}
                                        </span>
                                      </div>

                                      {/* 2. Kanal Badge */}
                                      <div className="col-span-1">
                                        <span
                                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block ${
                                            isBiKanal
                                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                                              : 'bg-amber-50 text-amber-800 border-amber-200'
                                          }`}
                                        >
                                          {deal.kanal}
                                        </span>
                                      </div>

                                      {/* 3. Firma & Yetkili Bilgisi */}
                                      <div className="col-span-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h4 className="font-bold text-xs text-slate-900 leading-tight">
                                            {client?.firma_adi || 'Bilinmeyen Müşteri'}
                                          </h4>
                                          {client?.musteri_tipi && (
                                            <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                              {client.musteri_tipi}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                                          <span className="flex items-center gap-1 text-slate-600">
                                            <UserIcon className="w-3 h-3 text-slate-400" />
                                            {client?.yetkili_kisi || '-'}
                                          </span>
                                          {client?.satis_temsilcisi?.name && (
                                            <span className="text-[10px] font-mono text-slate-400">
                                              (Temsilci: {client.satis_temsilcisi.name})
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* 4. Teklif Tutarı */}
                                      <div className="col-span-2 text-right">
                                        <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-200/80 inline-block">
                                          {formatCurrency(deal.teklif_tutari)}
                                        </span>
                                      </div>

                                      {/* 5. İhtimal Derecesi */}
                                      <div className="col-span-1 text-center">
                                        <span
                                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block ${getProbabilityBadge(
                                            deal.ihtimal_derecesi
                                          )}`}
                                        >
                                          %{deal.ihtimal_derecesi === 'Kesin'
                                            ? '100'
                                            : deal.ihtimal_derecesi === 'Yüksek'
                                            ? '75'
                                            : deal.ihtimal_derecesi === 'Orta'
                                            ? '50'
                                            : '25'} {deal.ihtimal_derecesi}
                                        </span>
                                      </div>

                                      {/* 6. Dönem / Tarih */}
                                      <div className="col-span-1 text-[11px]">
                                        <span className="font-mono text-slate-700 font-semibold text-[10px] block truncate">
                                          {deal.baslangic_tarihi && deal.bitis_tarihi
                                            ? `${formatDate(deal.baslangic_tarihi)} - ${formatDate(deal.bitis_tarihi)}`
                                            : deal.yayin_donemi || formatDate(deal.baslangic_tarihi) || '-'}
                                        </span>
                                        {deal.tahmini_kapanis_tarihi && (
                                          <span className="text-[9px] font-mono text-slate-400 block">
                                            Kapanış: {formatDate(deal.tahmini_kapanis_tarihi)}
                                          </span>
                                        )}
                                      </div>

                                      {/* 7. Takip Durumu */}
                                      <div className="col-span-1">
                                        {client && followUp ? (
                                          <span
                                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase border inline-block ${
                                              followUp.status === 'overdue'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : followUp.status === 'today'
                                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}
                                          >
                                            {followUp.label}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-mono text-slate-400">-</span>
                                        )}
                                      </div>

                                      {/* 8. Hızlı Aksiyonlar */}
                                      <div className="col-span-2 flex items-center justify-end gap-1">
                                        {client?.telefon && (
                                          <a
                                            href={`tel:${client.telefon}`}
                                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                                            title="Telefonla Ara"
                                          >
                                            <Phone className="w-3 h-3 text-emerald-600" />
                                          </a>
                                        )}

                                        {client?.telefon && (
                                          <a
                                            href={`https://wa.me/${client.telefon.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                                            title="WhatsApp Mesajı"
                                          >
                                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                                          </a>
                                        )}

                                        <a
                                          href={
                                            client?.eposta
                                              ? `mailto:${client.eposta}?subject=${encodeURIComponent(
                                                  `${deal.kanal} Reklam Teklifi - ${client.firma_adi}`
                                                )}`
                                              : `mailto:?subject=${encodeURIComponent(
                                                  `${deal.kanal} Reklam Teklifi - ${client?.firma_adi}`
                                                )}`
                                          }
                                          className="p-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                                          title="E-posta Gönder"
                                        >
                                          <Mail className="w-3 h-3 text-sky-600" />
                                        </a>

                                        {client && canManageDeal && (
                                          <button
                                            onClick={() => onOpenFollowUpModal(client)}
                                            className="p-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-md text-slate-600 hover:text-amber-700 transition cursor-pointer shadow-2xs"
                                            title="Takip Tarihini Güncelle"
                                          >
                                            <Clock className="w-3 h-3 text-amber-600" />
                                          </button>
                                        )}

                                        {client && canManageDeal && (
                                          <button
                                            onClick={() => onOpenAddDealModal(client)}
                                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                                            title="Yeni Teklif Ekle"
                                          >
                                            <Plus className="w-3 h-3 text-slate-700" />
                                          </button>
                                        )}

                                        {deal.asama !== 'SATIŞ' &&
                                          deal.asama !== 'TAHSİLAT' &&
                                          canManageDeal && (
                                            <button
                                              onClick={() => handleQuickCloseSale(deal)}
                                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-mono font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-2xs ml-1"
                                              title="Doğrudan Satışa Dönüştür"
                                            >
                                              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                                              <span>KAPAT</span>
                                            </button>
                                          )}
                                      </div>
                                    </div>

                                    {/* Mobile/Tablet Card View (< lg) */}
                                    <div className="lg:hidden p-3.5 space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div
                                            {...dragProvided.dragHandleProps}
                                            className="p-1 text-slate-400 hover:text-slate-800 cursor-grab"
                                          >
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                          <span
                                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                              isBiKanal
                                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}
                                          >
                                            {deal.kanal}
                                          </span>
                                        </div>

                                        <span
                                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getProbabilityBadge(
                                            deal.ihtimal_derecesi
                                          )}`}
                                        >
                                          {deal.ihtimal_derecesi}
                                        </span>
                                      </div>

                                      <div>
                                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                          {client?.firma_adi || 'Bilinmeyen Müşteri'}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                          <UserIcon className="w-3 h-3 text-slate-400" />
                                          <span>{client?.yetkili_kisi}</span>
                                          {client?.musteri_tipi && (
                                            <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                              {client.musteri_tipi}
                                            </span>
                                          )}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between py-1 px-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                                        <span className="text-[10px] font-mono uppercase text-slate-500 font-medium">
                                          TUTAR:
                                        </span>
                                        <span className="text-xs font-mono font-black text-emerald-700">
                                          {formatCurrency(deal.teklif_tutari)}
                                        </span>
                                      </div>

                                      {/* Mobile Quick Actions */}
                                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1">
                                          {client?.telefon && (
                                            <a
                                              href={`tel:${client.telefon}`}
                                              className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
                                            >
                                              <Phone className="w-3 h-3 text-emerald-600" />
                                            </a>
                                          )}
                                          {client?.telefon && (
                                            <a
                                              href={`https://wa.me/${client.telefon.replace(/\D/g, '')}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
                                            >
                                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                                            </a>
                                          )}
                                          {client && canManageDeal && (
                                            <button
                                              onClick={() => onOpenFollowUpModal(client)}
                                              className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
                                            >
                                              <Clock className="w-3 h-3 text-amber-600" />
                                            </button>
                                          )}
                                        </div>

                                        {deal.asama !== 'SATIŞ' &&
                                          deal.asama !== 'TAHSİLAT' &&
                                          canManageDeal && (
                                            <button
                                              onClick={() => handleQuickCloseSale(deal)}
                                              className="px-2 py-1 bg-emerald-600 text-white rounded-md font-mono font-bold text-[10px] flex items-center gap-1"
                                            >
                                              <CheckCircle2 className="w-3 h-3" />
                                              <span>SATIŞA ÇEVİR</span>
                                            </button>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}

                          {provided.placeholder}

                          {/* Empty Stage State */}
                          {stageDeals.length === 0 && (
                            <div className="py-4 px-4 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs font-mono text-slate-400 bg-white/50">
                              <span className="flex items-center gap-2">
                                <ArrowDownUp className="w-3.5 h-3.5 text-slate-300" />
                                Bu aşamada henüz fırsat yok. İşleri buraya sürükleyip bırakabilirsiniz.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
