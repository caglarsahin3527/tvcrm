'use client';

import React, { useState } from 'react';
import { Client, TVChannel, DealProbability, DealStage, STAGES } from '@/types';
import { createDeal } from '@/app/actions';
import { X, DollarSign, Plus, Building2 } from 'lucide-react';

interface QuickAddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

export const QuickAddDealModal: React.FC<QuickAddDealModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [kanal, setKanal] = useState<TVChannel>('Bi Kanal');
  const [teklifTutari, setTeklifTutari] = useState('');
  const [yayinDonemi, setYayinDonemi] = useState('Kasım 2026 Kuşak');
  const [ihtimalDerecesi, setIhtimalDerecesi] = useState<DealProbability>('Yüksek');
  const [asama, setAsama] = useState<DealStage>('TEKLİF');
  const [tahminiKapanisTarihi, setTahminiKapanisTarihi] = useState('');
  const [not, setNot] = useState('');

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        musteri_id: client.id,
        kanal,
        teklif_tutari: parseFloat(teklifTutari) || 0,
        yayin_donemi: yayinDonemi,
        tahmini_kapanis_tarihi: tahminiKapanisTarihi || undefined,
        ihtimal_derecesi: ihtimalDerecesi,
        asama,
        not,
      };

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        await createDeal(payload as any);
      }

      setTeklifTutari('');
      setNot('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Teklif eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-slate-900">YENİ TEKLİF EKLE</h3>
              <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {client.firma_adi}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* TV Kanalı */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Kanal</label>
              <select
                value={kanal}
                onChange={(e) => setKanal(e.target.value as TVChannel)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="Bi Kanal">Bi Kanal</option>
                <option value="Sıfır TV">Sıfır TV</option>
              </select>
            </div>

            {/* Teklif Tutarı */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Teklif Tutarı (₺) *</label>
              <input
                type="number"
                required
                placeholder="150000"
                value={teklifTutari}
                onChange={(e) => setTeklifTutari(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-mono font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Aşama */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Aşama</label>
              <select
                value={asama}
                onChange={(e) => setAsama(e.target.value as DealStage)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-sky-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* İhtimal */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">İhtimal</label>
              <select
                value={ihtimalDerecesi}
                onChange={(e) => setIhtimalDerecesi(e.target.value as DealProbability)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="Kesin">Kesin (%100)</option>
                <option value="Yüksek">Yüksek (%75)</option>
                <option value="Orta">Orta (%50)</option>
                <option value="Düşük">Düşük (%25)</option>
              </select>
            </div>

            {/* Yayın Dönemi */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Yayın Dönemi</label>
              <input
                type="text"
                placeholder="Örn: Kasım 2026 Kuşak / Sponsorluk"
                value={yayinDonemi}
                onChange={(e) => setYayinDonemi(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Tahmini Kapanış Tarihi */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Tahmini Kapanış</label>
              <input
                type="date"
                value={tahminiKapanisTarihi}
                onChange={(e) => setTahminiKapanisTarihi(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Not */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Not</label>
              <textarea
                rows={2}
                placeholder="Detaylar..."
                value={not}
                onChange={(e) => setNot(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-sky-600/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{loading ? 'Kaydediliyor...' : 'Teklifi Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

