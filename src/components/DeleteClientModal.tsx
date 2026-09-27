'use client';

import React, { useState } from 'react';
import { Client, User } from '@/types';
import { deleteClient } from '@/app/actions';
import { formatCurrency } from '@/lib/formatters';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  Building2, 
  Layers, 
  DollarSign 
} from 'lucide-react';

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  currentUser: User | null;
  onSuccess: () => void;
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  isOpen,
  onClose,
  client,
  currentUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !client) return null;

  const deals = client.deals || [];
  const totalAmount = deals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);
  const isMarkaMerkezi = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const handleDelete = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Direct call to deleteClient action or fallback to API
      await deleteClient(client.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Müşteri silme hatası:', err);
      // Try fallback to API if action fails
      try {
        const res = await fetch(`/api/clients?id=${client.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          onSuccess();
          onClose();
          return;
        } else {
          setErrorMessage(data.error || 'Müşteri silinirken bir hata oluştu.');
        }
      } catch {
        setErrorMessage(err.message || 'Müşteri silinirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 px-5 py-4 flex items-center justify-between text-white border-b border-rose-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-sm text-white">MÜŞTERİYİ TEMELLİ SİL</h3>
                <span className="text-[10px] font-mono uppercase bg-rose-500/30 text-rose-200 border border-rose-400/40 px-1.5 py-0.5 rounded font-semibold">
                  Marka Merkezi
                </span>
              </div>
              <p className="text-[10px] font-mono text-rose-200/80">Kalıcı müşteri ve teklif silme işlemi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-rose-800/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unauthorized State */}
        {!isMarkaMerkezi ? (
          <div className="p-6 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h4 className="font-bold text-slate-800">Yetkisiz Erişim</h4>
            <p className="text-xs text-slate-500">
              Müşteri kaydını kalıcı olarak silme yetkisi sadece "Marka Merkezi" rolüne aittir.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Kapat
            </button>
          </div>
        ) : (
          /* Content Body */
          <div className="p-5 space-y-4">
            
            {/* Warning Box */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-800">DİKKAT: Kalıcı Silme İşlemi</p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Bu müşteriyi sildiğinizde, müşteriye ait tüm bilgiler ve bağlı olan <strong>{deals.length} adet teklif/fırsat</strong> sistemden geri dönülemez şekilde silinecektir.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Client Summary Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-mono text-[11px]">FİRMA:</span>
                <span className="font-bold text-slate-900 text-sm">{client.firma_adi}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[11px]">YETKİLİ:</span>
                <span className="font-semibold text-slate-800">{client.yetkili_kisi || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[11px]">TEMSİLCİ:</span>
                <span className="font-semibold text-slate-800">{client.satis_temsilcisi?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[11px]">BAĞLI FIRSATLAR:</span>
                <span className="font-mono font-bold text-slate-900">
                  {deals.length} adet ({formatCurrency(totalAmount)})
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-rose-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Evet, Kalıcı Olarak Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
