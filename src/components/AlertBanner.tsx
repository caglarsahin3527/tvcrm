'use client';

import React, { useState } from 'react';
import { User, Deal } from '@/types';
import { getFollowUpStatus, formatCurrency } from '@/lib/formatters';
import { Bell, AlertOctagon, ChevronDown, Phone, MessageSquare, Clock, X, ArrowUpRight } from 'lucide-react';

interface AlertBannerProps {
  currentUser: User | null;
  deals: Deal[];
  onOpenFollowUpModal: (client: any) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  currentUser,
  deals,
  onOpenFollowUpModal,
}) => {
  const [showOverdueDrawer, setShowOverdueDrawer] = useState(false);

  if (!currentUser) return null;

  const isRep = currentUser.role === 'SALES_REP';

  // Calculate today's followups & overdue followups
  const todayDeals: Deal[] = [];
  const overdueDeals: Deal[] = [];

  deals.forEach((d) => {
    if (!d.musteri) return;
    const { status } = getFollowUpStatus(d.musteri.sonraki_takip_tarihi);
    if (status === 'today') {
      if (!todayDeals.some((x) => x.musteri?.id === d.musteri?.id)) {
        todayDeals.push(d);
      }
    } else if (status === 'overdue') {
      if (!overdueDeals.some((x) => x.musteri?.id === d.musteri?.id)) {
        overdueDeals.push(d);
      }
    }
  });

  const totalOverdueAmount = overdueDeals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

  return (
    <div className="space-y-3 mb-5">
      {/* 1. Sales Rep "Today" Follow-up Banner */}
      {todayDeals.length > 0 && (
        <div className="bg-amber-50/90 border-l-4 border-amber-500 border border-amber-200 p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.5 rounded">
                  GÜNÜN TAKİBİ
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                  Bugün takip edilmesi gereken <span className="underline decoration-amber-500 decoration-2 font-black text-amber-950">{todayDeals.length}</span> müşteri var
                </h4>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                {isRep
                  ? 'Görüşmelerinizi tamamlayıp takip durumunu güncelleyin.'
                  : 'Ekipte bugün takibi olan müşteriler listelenmektedir.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {todayDeals.slice(0, 3).map((d) => (
              <button
                key={d.id}
                onClick={() => onOpenFollowUpModal(d.musteri)}
                className="shrink-0 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>{d.musteri?.firma_adi}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Manager / Admin "Takibi Gecikenler Uyarısı" Banner */}
      {overdueDeals.length > 0 && (
        <div className="bg-rose-50/90 border-l-4 border-rose-500 border border-rose-200 p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded">
                  GECİKEN TAKİP
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-rose-950">
                  {overdueDeals.length} Fırsatın Takibi Gecikti &bull; Toplam <span className="font-mono font-black text-rose-900">{formatCurrency(totalOverdueAmount)}</span>
                </h4>
              </div>
              <p className="text-[11px] text-rose-800/80 mt-0.5">
                Takip tarihi geçmiş fakat statüsü güncellenmemiş anlaşmalar bulunuyor.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowOverdueDrawer(!showOverdueDrawer)}
            className="self-start sm:self-center shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span>{showOverdueDrawer ? 'Gizle' : 'Gecikenleri İncele'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOverdueDrawer ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Overdue Items Quick Inspection List */}
      {showOverdueDrawer && overdueDeals.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h5 className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Takibi Geciken Fırsatlar ({overdueDeals.length})
            </h5>
            <button
              onClick={() => setShowOverdueDrawer(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueDeals.map((d) => {
              const followUp = getFollowUpStatus(d.musteri!.sonraki_takip_tarihi);
              return (
                <div
                  key={d.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h6 className="font-bold text-sm text-slate-900 leading-tight">
                        {d.musteri?.firma_adi}
                      </h6>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {d.musteri?.yetkili_kisi} &bull; <span className="text-slate-700 font-medium">{d.musteri?.satis_temsilcisi?.name}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {followUp.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs font-mono font-extrabold text-slate-900">
                      {formatCurrency(d.teklif_tutari)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${d.musteri?.telefon}`}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 transition shadow-2xs"
                        title="Hemen Ara"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                      </a>
                      <a
                        href={`https://wa.me/${d.musteri?.telefon.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 transition shadow-2xs"
                        title="WhatsApp Mesajı"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                      </a>
                      <button
                        onClick={() => onOpenFollowUpModal(d.musteri)}
                        className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Takip Güncelle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

