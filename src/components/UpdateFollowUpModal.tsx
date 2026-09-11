'use client';

import React, { useState } from 'react';
import { Client } from '@/types';
import { updateClientFollowUpDate } from '@/app/actions';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface UpdateFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

export const UpdateFollowUpModal: React.FC<UpdateFollowUpModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  if (!isOpen || !client) return null;

  const handleQuickSet = async (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = d.toISOString().split('T')[0];
    await saveDate(dateStr);
  };

  const saveDate = async (dateStr: string) => {
    if (!dateStr) return;
    setLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, nextFollowUpDate: dateStr }),
      });
      if (!res.ok) {
        await updateClientFollowUpDate(client.id, dateStr);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Takip tarihi güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-slate-900">TAKİP TARİHİ</h3>
              <p className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">{client.firma_adi}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-xs font-mono text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex justify-between items-center">
            <span className="text-amber-800 font-semibold">MEVCUT TARİH:</span>
            <span className="font-bold text-amber-700">{formatDate(client.sonraki_takip_tarihi)}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Hızlı Seçim (1 Tık):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickSet(0)}
                className="px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 hover:text-sky-600 text-slate-700 shadow-xs transition cursor-pointer"
              >
                Bugün
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickSet(1)}
                className="px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 hover:text-sky-600 text-slate-700 shadow-xs transition cursor-pointer"
              >
                Yarın (+1 Gün)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickSet(3)}
                className="px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 hover:text-sky-600 text-slate-700 shadow-xs transition cursor-pointer"
              >
                3 Gün Sonra
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickSet(7)}
                className="px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 hover:text-sky-600 text-slate-700 shadow-xs transition cursor-pointer"
              >
                1 Hafta Sonra
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              Veya Özel Tarih:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              disabled={!selectedDate || loading}
              onClick={() => saveDate(selectedDate)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-40 transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
