'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Deal, DealStage, STAGES, Client } from '@/types';
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
  Layers,
  ChevronRight
} from 'lucide-react';

interface KanbanBoardProps {
  deals: Deal[];
  onRefresh: () => void;
  onOpenFollowUpModal: (client: Client) => void;
  onOpenAddDealModal: (client: Client) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  deals,
  onRefresh,
  onOpenFollowUpModal,
  onOpenAddDealModal,
}) => {
  const [mounted, setMounted] = useState(false);
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [selectedMobileStage, setSelectedMobileStage] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStage = destination.droppableId as DealStage;

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

  const handleQuickCloseSale = async (deal: Deal) => {
    const confirm = window.confirm(`"${deal.musteri?.firma_adi}" için anlaşmayı SATIŞ aşamasına taşımak istiyor musunuz?`);
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 font-mono text-xs">
        PIPELINE YÜKLENİYOR...
      </div>
    );
  }

  const visibleStages = selectedMobileStage === 'all'
    ? STAGES
    : STAGES.filter((s) => s === selectedMobileStage);

  return (
    <div className="space-y-3">
      {/* Mobile Stage Quick Switcher Tabs (< md) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
        <button
          onClick={() => setSelectedMobileStage('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            selectedMobileStage === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 shadow-2xs'
          }`}
        >
          Tüm Aşamalar ({localDeals.length})
        </button>
        {STAGES.map((s) => {
          const count = localDeals.filter((d) => d.asama === s).length;
          return (
            <button
              key={s}
              onClick={() => setSelectedMobileStage(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMobileStage === s
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>{s}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  selectedMobileStage === s
                    ? 'bg-sky-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3.5 overflow-x-auto pb-6 pt-1 px-0.5 min-h-[calc(100vh-220px)] select-none">
          {visibleStages.map((stage) => {
            const stageDeals = localDeals.filter((d) => d.asama === stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

            return (
              <div
                key={stage}
                className={`flex flex-col bg-slate-100/90 rounded-2xl border border-slate-200/90 ${
                  selectedMobileStage !== 'all' ? 'w-full' : 'w-72 sm:w-80'
                } md:w-80 shrink-0 shadow-2xs max-h-full`}
              >
              {/* Column Header */}
              <div className="p-3.5 bg-white/90 rounded-t-2xl border-b border-slate-200/80 sticky top-0 z-10 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                      {stage}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver ? 'bg-sky-50/50' : ''
                    }`}
                  >
                    {stageDeals.map((deal, index) => {
                      const client = deal.musteri;
                      const followUp = client?.sonraki_takip_tarihi
                        ? getFollowUpStatus(client.sonraki_takip_tarihi)
                        : null;

                      const isBiKanal = deal.kanal === 'Bi Kanal';

                      return (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`bg-white rounded-xl p-3.5 border transition-all relative overflow-hidden ${
                                isBiKanal ? 'border-l-4 border-l-sky-500 border-slate-200' : 'border-l-4 border-l-amber-500 border-slate-200'
                              } ${
                                dragSnapshot.isDragging
                                  ? 'shadow-2xl border-sky-500 z-50 ring-2 ring-sky-400 scale-102 rotate-1'
                                  : 'hover:border-slate-300 hover:shadow-md'
                              }`}
                            >
                              {/* Channel & Probability Badges */}
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    isBiKanal
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {deal.kanal}
                                </span>
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getProbabilityBadge(
                                    deal.ihtimal_derecesi
                                  )}`}
                                >
                                  {deal.ihtimal_derecesi} (%
                                  {deal.ihtimal_derecesi === 'Kesin'
                                    ? '100'
                                    : deal.ihtimal_derecesi === 'Yüksek'
                                    ? '75'
                                    : deal.ihtimal_derecesi === 'Orta'
                                    ? '50'
                                    : '25'}
                                  )
                                </span>
                              </div>

                              {/* Firma Adı & Yetkili */}
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                  {client?.firma_adi || 'Bilinmeyen Müşteri'}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                                  <UserIcon className="w-3 h-3 text-slate-400" />
                                  <span>{client?.yetkili_kisi}</span>
                                  {client?.musteri_tipi && (
                                    <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                      {client.musteri_tipi}
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* Teklif Tutarı Box */}
                              <div className="mt-2.5 py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                                <span className="text-[10px] font-mono uppercase text-slate-500 font-medium">
                                  TUTAR:
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-700">
                                  {formatCurrency(deal.teklif_tutari)}
                                </span>
                              </div>

                              {/* Dates Section */}
                              <div className="mt-2 text-[11px] space-y-1">
                                {deal.tahmini_kapanis_tarihi && (
                                  <div className="flex items-center justify-between text-slate-500">
                                    <span className="flex items-center gap-1 text-[10px] font-mono">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      Kapanış:
                                    </span>
                                    <span className="font-mono text-slate-700 text-[10px]">
                                      {formatDate(deal.tahmini_kapanis_tarihi)}
                                    </span>
                                  </div>
                                )}

                                {client && followUp && (
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      Takip:
                                    </span>
                                    <span
                                      className={`font-mono font-bold px-1.5 py-0.2 rounded text-[9px] uppercase border ${
                                        followUp.status === 'overdue'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : followUp.status === 'today'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      {followUp.label}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Satış Temsilcisi */}
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                <span>TEMSİLCİ:</span>
                                <span className="text-slate-800 font-semibold">
                                  {client?.satis_temsilcisi?.name || '-'}
                                </span>
                              </div>

                              {/* HIZLI AKSİYON BUTONLARI (1 TIK İŞLEMLERİ) */}
                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                  {/* 1. Ara */}
                                  {client?.telefon && (
                                    <a
                                      href={`tel:${client.telefon}`}
                                      className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                                      title="Telefonla Ara"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                    </a>
                                  )}

                                  {/* 2. WhatsApp */}
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

                                  {/* 3. E-posta */}
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

                                  {/* 4. Takip Güncelle */}
                                  {client && (
                                    <button
                                      onClick={() => onOpenFollowUpModal(client)}
                                      className="p-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-md text-slate-600 hover:text-amber-700 transition cursor-pointer shadow-2xs"
                                      title="Takip Tarihini Güncelle"
                                    >
                                      <Clock className="w-3 h-3 text-amber-600" />
                                    </button>
                                  )}

                                  {/* 5. Teklif Ekle */}
                                  {client && (
                                    <button
                                      onClick={() => onOpenAddDealModal(client)}
                                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                                      title="Yeni Teklif Ekle"
                                    >
                                      <Plus className="w-3 h-3 text-slate-700" />
                                    </button>
                                  )}
                                </div>

                                {/* 6. Satışı Kapat */}
                                {deal.asama !== 'SATIŞ' && deal.asama !== 'TAHSİLAT' && (
                                  <button
                                    onClick={() => handleQuickCloseSale(deal)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-mono font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                    title="Doğrudan Satışa Dönüştür"
                                  >
                                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                                    <span>KAPAT</span>
                                  </button>
                                )}
                              </div>

                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {stageDeals.length === 0 && (
                      <div className="h-20 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[11px] font-mono text-slate-400">
                        BOŞ
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
        </div>
      </DragDropContext>
    </div>
  );
};

