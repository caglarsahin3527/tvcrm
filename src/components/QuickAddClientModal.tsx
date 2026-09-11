'use client';

import React, { useState } from 'react';
import { User, CustomerType, TVChannel, DealProbability, DealStage, STAGES } from '@/types';
import { createClientAndDeal } from '@/app/actions';
import { X, Building2, User as UserIcon, Phone, Mail, Calendar, DollarSign, Tv, Layers, Plus } from 'lucide-react';

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
  const [withDeal, setWithDeal] = useState(true);

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

  // Deal fields
  const [kanal, setKanal] = useState<TVChannel>('Bi Kanal');
  const [teklifTutari, setTeklifTutari] = useState('');
  const [yayinDonemi, setYayinDonemi] = useState('Ekim 2026 Kuşak');
  const [ihtimalDerecesi, setIhtimalDerecesi] = useState<DealProbability>('Yüksek');
  const [asama, setAsama] = useState<DealStage>('YENİ LEAD');
  const [not, setNot] = useState('');

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
        has_deal: withDeal,
        kanal: withDeal ? kanal : undefined,
        teklif_tutari: withDeal ? (parseFloat(teklifTutari) || 0) : undefined,
        yayin_donemi: withDeal ? yayinDonemi : undefined,
        ihtimal_derecesi: withDeal ? ihtimalDerecesi : undefined,
        asama: withDeal ? asama : undefined,
        not: withDeal ? (not || undefined) : undefined,
      };

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to Server Action if needed
        await createClientAndDeal(payload as any);
      }

      // Reset form
      setFirmaAdi('');
      setYetkiliKisi('');
      setTelefon('');
      setEposta('');
      setTeklifTutari('');
      setNot('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-slate-900">HIZLI MÜŞTERİ KAYDI</h3>
              <p className="text-[10px] font-mono text-slate-500">30 saniyede reklamveren ve anlaşma kaydı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition"
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
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
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
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold">Satışçı</label>
              <select
                disabled={currentUser?.role === 'SALES_REP'}
                value={satisTemsilcisiId}
                onChange={(e) => setSatisTemsilcisiId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer disabled:opacity-60"
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

          {/* Deal Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={withDeal}
                onChange={(e) => setWithDeal(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-mono font-medium text-slate-700">
                İlk teklifi şimdi ekle
              </span>
            </label>
          </div>

          {/* Deal Fields */}
          {withDeal && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Kanal */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Kanal</label>
                  <select
                    value={kanal}
                    onChange={(e) => setKanal(e.target.value as TVChannel)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                  >
                    <option value="Bi Kanal">Bi Kanal</option>
                    <option value="Sıfır TV">Sıfır TV</option>
                  </select>
                </div>

                {/* Tutar */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Teklif Tutarı (₺)</label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={teklifTutari}
                    onChange={(e) => setTeklifTutari(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-700 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Aşama */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Başlangıç Aşaması</label>
                  <select
                    value={asama}
                    onChange={(e) => setAsama(e.target.value as DealStage)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
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
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500"
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
                    placeholder="Örn: Ekim 2026 Prime Time"
                    value={yayinDonemi}
                    onChange={(e) => setYayinDonemi(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Not */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-medium">Not</label>
                  <textarea
                    rows={2}
                    placeholder="Önemli detaylar..."
                    value={not}
                    onChange={(e) => setNot(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

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
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
