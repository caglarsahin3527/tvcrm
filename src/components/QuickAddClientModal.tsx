'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Client, CustomerType } from '@/types';
import { createClient } from '@/app/actions';
import { toTurkishUpper, toCleanEmail } from '@/lib/formatters';
import { X, Building2, User as UserIcon, Phone, Mail, Calendar, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  clients?: Client[];
  currentUser: User | null;
  onSuccess: () => void;
}

export const QuickAddClientModal: React.FC<QuickAddClientModalProps> = ({
  isOpen,
  onClose,
  users,
  clients = [],
  currentUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  // Form states
  const [firmaAdi, setFirmaAdi] = useState('');
  const [yetkiliKisi, setYetkiliKisi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [eposta, setEposta] = useState('');
  const [musteriTipi, setMusteriTipi] = useState<CustomerType>('Kurumsal');
  const [satisTemsilcisiId, setSatisTemsilcisiId] = useState(
    currentUser ? currentUser.id : users[0]?.id || ''
  );

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered suggestions based on user input
  const filteredSuggestions = useMemo(() => {
    if (!firmaAdi.trim() || firmaAdi.trim().length < 1) return [];
    const query = firmaAdi.trim().toLocaleUpperCase('tr-TR');
    return clients.filter((c) =>
      c.firma_adi?.toLocaleUpperCase('tr-TR').includes(query)
    );
  }, [firmaAdi, clients]);

  // Handle selecting an autocomplete suggestion
  const handleSelectSuggestion = (client: Client) => {
    setFirmaAdi(toTurkishUpper(client.firma_adi));
    if (client.yetkili_kisi) setYetkiliKisi(toTurkishUpper(client.yetkili_kisi));
    if (client.telefon) setTelefon(client.telefon);
    if (client.eposta) setEposta(toCleanEmail(client.eposta));
    if (client.musteri_tipi) setMusteriTipi(client.musteri_tipi as CustomerType);
    setShowSuggestions(false);
  };

  // Synchronize rep ID when modal opens
  React.useEffect(() => {
    if (isOpen && currentUser) {
      setSatisTemsilcisiId(currentUser.id);
    }
  }, [isOpen, currentUser]);
  
  const today = new Date();
  // Default to today for registration date
  const defaultFollowUp = new Date(today);
  const defaultFollowUpStr = defaultFollowUp.toISOString().split('T')[0];
  const [sonrakiTakipTarihi, setSonrakiTakipTarihi] = useState(defaultFollowUpStr);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmaAdi || !yetkiliKisi || !telefon) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    const effectiveRepId = !isSuperAdmin ? (currentUser?.id || satisTemsilcisiId) : (satisTemsilcisiId || currentUser?.id || users[0]?.id || '');

    setLoading(true);
    try {
      const payload = {
        firma_adi: toTurkishUpper(firmaAdi),
        yetkili_kisi: toTurkishUpper(yetkiliKisi),
        telefon: telefon,
        eposta: toCleanEmail(eposta) || undefined,
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
      if (isSuperAdmin) setSatisTemsilcisiId(currentUser?.id || users[0]?.id || '');
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
            {/* Firma Adı with Autocomplete & Live Uppercase */}
            <div className="space-y-1 sm:col-span-2 relative" ref={autocompleteRef}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  Firma Adı <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  Otomatik BÜYÜK HARF & Öneri
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="Örn: ZİRAAT BANKASI, VESTEL A.Ş."
                value={firmaAdi}
                onChange={(e) => {
                  setFirmaAdi(toTurkishUpper(e.target.value));
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />

              {/* Autocomplete Dropdown List */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between">
                    <span>Mevcut Müşteri Önerileri ({filteredSuggestions.length})</span>
                    <span className="text-[9px] text-sky-600 font-normal">Tıklayarak bilgileri otomatik doldurun</span>
                  </div>
                  {filteredSuggestions.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(client)}
                      className="w-full text-left px-3 py-2 hover:bg-sky-50/80 transition flex items-center justify-between gap-2 group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5">
                          <span>{client.firma_adi}</span>
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Kayıtlı
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span>Yetkili: {client.yetkili_kisi || '-'}</span>
                          <span>•</span>
                          <span>Tel: {client.telefon || '-'}</span>
                          {client.satis_temsilcisi?.name && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-semibold">Temsilci: {client.satis_temsilcisi.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-sky-600 font-semibold opacity-0 group-hover:opacity-100 transition shrink-0">
                        Doldur ↵
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Yetkili Kişi with Live Turkish Uppercase */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-sky-600" />
                Yetkili Kişi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: AHMET YILMAZ"
                value={yetkiliKisi}
                onChange={(e) => setYetkiliKisi(toTurkishUpper(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold uppercase placeholder:normal-case placeholder:font-normal placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
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
              {!isSuperAdmin ? (
                <div className="w-full text-xs px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-800 font-semibold flex items-center justify-between select-none">
                  <span>{currentUser?.name || 'Giriş Yapan Kullanıcı'}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-200/80 px-2 py-0.5 rounded font-bold">Otomatik</span>
                </div>
              ) : (
                <select
                  value={satisTemsilcisiId}
                  onChange={(e) => setSatisTemsilcisiId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
                >
                  {users.length > 0 ? (
                    users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'ADMIN' ? 'Marka Merkezi' : u.role === 'SALES_MANAGER' ? 'Yönetici' : 'Temsilci'})
                      </option>
                    ))
                  ) : currentUser ? (
                    <option value={currentUser.id}>{currentUser.name}</option>
                  ) : null}
                </select>
              )}
            </div>

            {/* Kayıt Tarihi */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-600 font-semibold flex items-center gap-1">
                Kayıt Tarihi <span className="text-rose-500">*</span>
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
