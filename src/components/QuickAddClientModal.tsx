'use client';

import React, { useState } from 'react';
import { User, CustomerType } from '@/types';
import { createClient } from '@/app/actions';
import { X, Building2, User as UserIcon, Phone, Mail, Calendar, Plus, Loader2 } from 'lucide-react';

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onSuccess: () => void;
}

export const QuickAddClientModal: React.FC<QuickAddClientModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  // Form states
  const [firmaAdi, setFirmaAdi] = useState('');
  const [yetkiliKisi, setYetkiliKisi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [eposta, setEposta] = useState('');
  const [musteriTipi, setMusteriTipi] = useState<CustomerType>('Kurumsal');
  const [satisTemsilcisiId, setSatisTemsilcisiId] = useState(
    currentUser ? currentUser.id : users[0]?.id || ''
  );

  // Synchronize rep ID when currentUser or users list is loaded/updated
  React.useEffect(() => {
    if (currentUser) {
      setSatisTemsilcisiId(currentUser.id);
    } else if (users.length > 0 && !satisTemsilcisiId) {
      setSatisTemsilcisiId(users[0].id);
    }
  }, [currentUser, users, isOpen, satisTemsilcisiId]);
  
  const defaultFollowUp = new Date();
  defaultFollowUp.setDate(defaultFollowUp.getDate() + 1);
  const [sonrakiTakipTarihi, setSonrakiTakipTarihi] = useState(
    defaultFollowUp.toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmaAdi || !yetkiliKisi || !telefon) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    const effectiveRepId = satisTemsilcisiId || currentUser?.id || users[0]?.id || '';

    setLoading(true);
    try {
      const payload = {
        firma_adi: firmaAdi,
        yetkili_kisi: yetkiliKisi,
        telefon: telefon,
        eposta: eposta || undefined,
        musteri_tipi: musteriTipi,
        satis_temsilcisi_id: effectiveRepId,
        sonraki_takip_tarihi: sonrakiTakipTarihi,
      };

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to Server Action if needed
        await createClient(payload as any);
      }

      // Reset form
      setFirmaAdi('');
      setYetkiliKisi('');
      setTelefon('');
      setEposta('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Müşteri ekleme hatası:', err);
      alert('Müşteri eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-white">YENİ MÜŞTERİ EKLE</h3>
              <p className="text-[10px] font-mono text-slate-400">Reklamveren portföy kaydı oluşturun</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Firma Adı */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold flex items-center gap-1">
                Firma Adı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Vestel Elektronik A.Ş."
                value={firmaAdi}
                onChange={(e) => setFirmaAdi(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Yetkili Kişi */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold flex items-center gap-1">
                Yetkili Kişi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ad Soyad"
                value={yetkiliKisi}
                onChange={(e) => setYetkiliKisi(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Telefon */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold flex items-center gap-1">
                Telefon <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="0532XXXXXXX"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* E-posta */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold">
                E-posta (Opsiyonel)
              </label>
              <input
                type="email"
                placeholder="ornek@firma.com"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Müşteri Tipi */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold">Müşteri Tipi</label>
              <select
                value={musteriTipi}
                onChange={(e) => setMusteriTipi(e.target.value as CustomerType)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
              >
                <option value="Kurumsal">Kurumsal</option>
                <option value="KOBİ">KOBİ</option>
                <option value="Kamu">Kamu</option>
                <option value="Ajans">Ajans</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            {/* Satış Temsilcisi */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold">Grup Üyesi / Satışçı</label>
              <select
                disabled={currentUser?.role === 'SALES_REP'}
                value={satisTemsilcisiId}
                onChange={(e) => setSatisTemsilcisiId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer disabled:opacity-60 font-semibold"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sonraki Takip Tarihi */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold flex items-center gap-1">
                Sonraki Takip <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={sonrakiTakipTarihi}
                onChange={(e) => setSonrakiTakipTarihi(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
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
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Müşteriyi Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
