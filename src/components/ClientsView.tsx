'use client';

import React, { useState } from 'react';
import { Client, Deal, User } from '@/types';
import { formatCurrency, formatDate, getFollowUpStatus } from '@/lib/formatters';
import { 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  Plus, 
  Search, 
  Trash2 
} from 'lucide-react';
import { deleteClient } from '@/app/actions';

interface ClientsViewProps {
  clients: Client[];
  currentUser: User | null;
  onRefresh: () => void;
  onOpenAddClient: () => void;
  onOpenAddDeal: (client: Client) => void;
  onOpenFollowUpModal: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  currentUser,
  onRefresh,
  onOpenAddClient,
  onOpenAddDeal,
  onOpenFollowUpModal,
}) => {
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.firma_adi && c.firma_adi.toLowerCase().includes(q)) ||
      (c.yetkili_kisi && c.yetkili_kisi.toLowerCase().includes(q)) ||
      (c.telefon && c.telefon.includes(q)) ||
      (c.eposta && c.eposta.toLowerCase().includes(q)) ||
      (c.musteri_tipi && c.musteri_tipi.toLowerCase().includes(q)) ||
      (c.satis_temsilcisi?.name && c.satis_temsilcisi.name.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" adlı müşteriyi ve bağlı tüm teklifleri silmek istediğinize emin misiniz?`)) {
      try {
        const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
        if (!res.ok) await deleteClient(id);
      } catch {
        await deleteClient(id);
      }
      onRefresh();
    }
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Top Header & Search */}
      <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-mono flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            MÜŞTERİ PORTFÖYÜ ({filteredClients.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kayıtlı Reklamverenler, İletişim Kanalları ve Aktif Fırsat Durumu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Firma, yetkili veya telefon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-52 sm:w-64 shadow-2xs"
            />
          </div>

          {currentUser?.role !== 'VIEWER' && (
            <button
              onClick={onOpenAddClient}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shrink-0 shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Yeni Müşteri Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Clients Card View (Mobile only: < md) */}
      <div className="md:hidden space-y-3">
        {filteredClients.map((client) => {
          const followUp = getFollowUpStatus(client.sonraki_takip_tarihi);
          const deals = client.deals || [];
          const totalDealsAmount = deals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

          return (
            <div
              key={client.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3"
            >
              {/* Card Header: Firma Adı & Müşteri Tipi */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{client.firma_adi}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{client.yetkili_kisi}</p>
                </div>
                <span className="font-mono text-[10px] uppercase bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                  {client.musteri_tipi}
                </span>
              </div>

              {/* Temsilci & Fırsat Hacmi */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Temsilci:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{client.satis_temsilcisi?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Fırsat Hacmi:</span>
                  <span className="font-mono font-bold text-slate-900 text-[11px]">{formatCurrency(totalDealsAmount)}</span>
                </div>
              </div>

              {/* Takip Durumu & Aksiyonlar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-full text-[9px] uppercase border ${
                      followUp.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : followUp.status === 'today'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {followUp.label}
                  </span>
                  <button
                    onClick={() => onOpenFollowUpModal(client)}
                    className="p-1 hover:bg-slate-100 rounded-md text-amber-600 transition cursor-pointer"
                    title="Tarihi Güncelle"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hızlı Aksiyon Butonları */}
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${client.telefon}`}
                    className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg active:scale-95 transition"
                    title="Ara"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${client.telefon.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg active:scale-95 transition"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onOpenAddDeal(client)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold active:scale-95 transition cursor-pointer"
                    title="Teklif Ekle"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Teklif</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-mono text-xs bg-white rounded-2xl border border-slate-200">
            ARAMA KRİTERİNE UYGUN MÜŞTERİ BULUNAMADI
          </div>
        )}
      </div>

      {/* Clients Table (Desktop: md+) */}
      <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Firma Adı</th>
                <th className="px-4 py-3.5">Yetkili & İletişim</th>
                <th className="px-4 py-3.5">Müşteri Tipi</th>
                <th className="px-4 py-3.5">Satış Temsilcisi</th>
                <th className="px-4 py-3.5">Sonraki Takip</th>
                <th className="px-4 py-3.5">Fırsat Hacmi</th>
                <th className="px-4 py-3.5 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const followUp = getFollowUpStatus(client.sonraki_takip_tarihi);
                const deals = client.deals || [];
                const totalDealsAmount = deals.reduce((sum, d) => sum + (d.teklif_tutari || 0), 0);

                return (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Firma Adı */}
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div className="text-sm font-bold text-slate-900">{client.firma_adi}</div>
                      <div className="text-[10px] font-mono text-slate-400 font-normal mt-0.5">
                        Kayıt: {formatDate(client.createdAt)}
                      </div>
                    </td>

                    {/* Yetkili & İletişim */}
                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="font-semibold text-slate-800">{client.yetkili_kisi}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`tel:${client.telefon}`}
                          className="flex items-center gap-1 font-mono text-[11px] text-sky-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{client.telefon}</span>
                        </a>
                        {client.eposta && (
                          <a
                            href={`mailto:${client.eposta}`}
                            className="text-slate-400 hover:text-sky-600"
                            title={client.eposta}
                          >
                            <Mail className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Müşteri Tipi */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[10px] uppercase bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                        {client.musteri_tipi}
                      </span>
                    </td>

                    {/* Satış Temsilcisi */}
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {client.satis_temsilcisi?.name || '-'}
                    </td>

                    {/* Sonraki Takip */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[9px] uppercase border ${
                            followUp.status === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : followUp.status === 'today'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {followUp.label}
                        </span>
                        <button
                          onClick={() => onOpenFollowUpModal(client)}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title="Tarihi Güncelle"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {formatDate(client.sonraki_takip_tarihi)}
                      </div>
                    </td>

                    {/* Fırsat Hacmi */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900">
                        {formatCurrency(totalDealsAmount)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {deals.length} teklif ({deals.map((d) => d.kanal).join(', ') || 'Yok'})
                      </div>
                    </td>

                    {/* Hızlı Aksiyon Butonları */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${client.telefon}`}
                          className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                          title="Telefonla Ara"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                        </a>
                        <a
                          href={`https://wa.me/${client.telefon.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                          title="WhatsApp Gönder"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                        </a>
                        {client.eposta && (
                          <a
                            href={`mailto:${client.eposta}`}
                            className="p-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-md text-slate-600 transition cursor-pointer shadow-2xs"
                            title="E-posta Gönder"
                          >
                            <Mail className="w-3 h-3 text-sky-600" />
                          </a>
                        )}
                        <button
                          onClick={() => onOpenAddDeal(client)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                          title="Teklif Ekle"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(client.id, client.firma_adi)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-md text-slate-400 transition cursor-pointer shadow-2xs"
                            title="Müşteriyi Sil"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-mono text-xs">
                    ARAMA KRİTERİNE UYGUN MÜŞTERİ BULUNAMADI
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

