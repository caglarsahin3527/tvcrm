'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, Client, CustomerType } from '@/types';
import { updateClient } from '@/app/actions';
import { toTurkishUpper, toCleanEmail, formatDate, formatPhoneInput, isValidPhone } from '@/lib/formatters';
import { 
  X, 
  Building2, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Calendar, 
  Check, 
  Loader2, 
  AlertCircle, 
  ShieldAlert,
  Sparkles,
  Save
} from 'lucide-react';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  users: User[];
  clients?: Client[];
  currentUser: User | null;
  onSuccess: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  users,
  clients = [],
  currentUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [firmaAdi, setFirmaAdi] = useState('');
  const [yetkiliKisi, setYetkiliKisi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [eposta, setEposta] = useState('');
  const [musteriTipi, setMusteriTipi] = useState<CustomerType>('Kurumsal');
  const [satisTemsilcisiId, setSatisTemsilcisiId] = useState('');
  const [sonrakiTakipTarihi, setSonrakiTakipTarihi] = useState('');

  // Populate data when modal opens or client changes
  useEffect(() => {
    if (client) {
      setFirmaAdi(client.firma_adi || '');
      setYetkiliKisi(client.yetkili_kisi || '');
      setTelefon(formatPhoneInput(client.telefon || ''));
      setEposta(client.eposta || '');
      setMusteriTipi((client.musteri_tipi as CustomerType) || 'Kurumsal');
      setSatisTemsilcisiId(client.satis_temsilcisi_id || '');
      
      if (client.sonraki_takip_tarihi) {
        try {
          const d = new Date(client.sonraki_takip_tarihi);
          if (!isNaN(d.getTime())) {
            setSonrakiTakipTarihi(d.toISOString().split('T')[0]);
          } else {
            setSonrakiTakipTarihi('');
          }
        } catch {
          setSonrakiTakipTarihi('');
        }
      } else {
        setSonrakiTakipTarihi('');
      }
      setErrorMessage('');
    }
  }, [client, isOpen]);

  // Only sales reps and managers can be assigned as portfolio owners
  const salesUsers = useMemo(() => {
    return users.filter((u) => u.role !== 'VIEWER');
  }, [users]);

  // Check duplicate company name if changed (excluding current client)
  const duplicateClient = useMemo(() => {
    if (!client || !firmaAdi.trim()) return null;
    const query = firmaAdi.trim().toLocaleUpperCase('tr-TR');
    return (
      clients.find(
        (c) => c.id !== client.id && c.firma_adi?.toLocaleUpperCase('tr-TR') === query
      ) || null
    );
  }, [firmaAdi, client, clients]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firmaAdi.trim() || !yetkiliKisi.trim() || !telefon.trim()) {
      setErrorMessage('Lütfen zorunlu alanları (Firma Adı, Yetkili Kişi, Telefon) eksiksiz doldurun.');
      return;
    }

    if (!isValidPhone(telefon)) {
      setErrorMessage('Lütfen geçerli bir telefon numarası giriniz (Örn: 05XX XXX XX XX).');
      return;
    }

    if (duplicateClient) {
      setErrorMessage(
        `"${duplicateClient.firma_adi}" firması zaten ${duplicateClient.satis_temsilcisi?.name || 'başka bir temsilci'} portföyünde kayıtlıdır.`
      );
      return;
    }

    setLoading(true);
    try {
      await updateClient(client.id, {
        firma_adi: firmaAdi,
        yetkili_kisi: yetkiliKisi,
        telefon,
        eposta,
        musteri_tipi: musteriTipi,
        satis_temsilcisi_id: satisTemsilcisiId || client.satis_temsilcisi_id,
        sonraki_takip_tarihi: sonrakiTakipTarihi || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Müşteri güncelleme hatası:', err);
      setErrorMessage(err.message || 'Müşteri güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const isMarkaMerkezi = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-sm text-white">MÜŞTERİ BİLGİLERİNİ DÜZENLE</h3>
                <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-400/30 px-1.5 py-0.5 rounded font-semibold">
                  Marka Merkezi
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Kayıt No: #{client.id.slice(0, 8)} • Kayıt: {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if not Marka Merkezi */}
        {!isMarkaMerkezi ? (
          <div className="p-6 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h4 className="font-bold text-slate-800">Yetkisiz Erişim</h4>
            <p className="text-xs text-slate-500">
              Müşteri bilgilerini düzenleme yetkisi sadece "Marka Merkezi" rolüne tanımlıdır.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Kapat
            </button>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
            
            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-semibold">{errorMessage}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Firma Adı */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    Firma / Kurum Adı <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                    Otomatik BÜYÜK HARF
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Örn: ZİRAAT BANKASI, VESTEL A.Ş."
                  value={firmaAdi}
                  onChange={(e) => setFirmaAdi(toTurkishUpper(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />

                {/* Duplicate Conflict Banner */}
                {duplicateClient && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Müşteri Portföy Koruması Uyarısı</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Bu unvan zaten <strong>{duplicateClient.satis_temsilcisi?.name || 'başka bir temsilci'}</strong> adına kayıtlıdır. Aynı isimle kayıt yapılamaz.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Yetkili Kişi */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-sky-600" />
                  Yetkili Kişi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ad Soyad"
                  value={yetkiliKisi}
                  onChange={(e) => setYetkiliKisi(toTurkishUpper(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-sky-500 focus:bg-white transition font-semibold"
                />
              </div>

              {/* Müşteri Tipi */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                  Müşteri Tipi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={musteriTipi}
                  onChange={(e) => setMusteriTipi(e.target.value as CustomerType)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition font-medium"
                >
                  <option value="Kurumsal">Kurumsal</option>
                  <option value="KOBİ">KOBİ</option>
                  <option value="Ajans">Ajans</option>
                  <option value="Kamu">Kamu</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              {/* Telefon */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  Telefon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={14}
                  placeholder="05XX XXX XX XX"
                  value={telefon}
                  onChange={(e) => setTelefon(formatPhoneInput(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono tracking-wider focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              {/* E-posta */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  E-Posta
                </label>
                <input
                  type="email"
                  placeholder="ornek@firma.com"
                  value={eposta}
                  onChange={(e) => setEposta(e.target.value.toLowerCase())}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              {/* Satış Temsilcisi (Portföy Sahibi / Transfer) */}
              <div className="space-y-1 sm:col-span-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-indigo-950 font-bold flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Atanan Satış Temsilcisi (Portföy Transferi)
                  </label>
                  <span className="text-[10px] font-mono text-indigo-600 font-semibold">
                    Marka Merkezi Yetkisi
                  </span>
                </div>
                <select
                  value={satisTemsilcisiId}
                  onChange={(e) => setSatisTemsilcisiId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-indigo-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
                >
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'ADMIN' ? 'Marka Merkezi' : u.role === 'SALES_MANAGER' ? 'Satış Yöneticisi' : 'Satış Temsilcisi'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-700 mt-1">
                  Müşterinin temsilcisi değiştirildiğinde, bağlı tüm açık teklifler ve takip kayıtları seçilen personele devredilir.
                </p>
              </div>

              {/* Sonraki Takip Tarihi */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  Sonraki Takip Tarihi
                </label>
                <input
                  type="date"
                  value={sonrakiTakipTarihi}
                  onChange={(e) => setSonrakiTakipTarihi(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading || Boolean(duplicateClient)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
