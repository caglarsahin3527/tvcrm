'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Client } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import {
  X,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  Users,
  Check,
  Loader2,
  Search,
  Building2,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Layers,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface UserDeleteTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToDelete: any | null;
  availableUsers: any[];
  currentUser: User | null;
  onSuccess: () => void;
}

type TransferMode = 'single' | 'distribute' | 'custom';

export const UserDeleteTransferModal: React.FC<UserDeleteTransferModalProps> = ({
  isOpen,
  onClose,
  userToDelete,
  availableUsers,
  currentUser,
  onSuccess,
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Transfer Mode
  const [transferMode, setTransferMode] = useState<TransferMode>('single');

  // Mode 1: Single Target
  const [singleTargetId, setSingleTargetId] = useState<string>('');

  // Mode 2: Round-Robin Distribution Selected Rep IDs
  const [selectedRepIdsForDistribution, setSelectedRepIdsForDistribution] = useState<string[]>([]);

  // Mode 3: Custom Per-Client Assignment (Map: clientId -> targetUserId)
  const [clientAssignments, setClientAssignments] = useState<Record<string, string>>({});
  
  // Custom mode table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Eligible destination reps (excluding the user being deleted)
  const eligibleReps = useMemo(() => {
    return availableUsers.filter((u) => u.id !== userToDelete?.id && u.role !== 'VIEWER');
  }, [availableUsers, userToDelete]);

  // Fetch clients for the user to be deleted
  useEffect(() => {
    if (isOpen && userToDelete?.id) {
      setIsLoadingClients(true);
      setErrorMessage('');
      setSearchQuery('');
      setTypeFilter('all');

      // Default single target: first eligible rep or current admin
      const defaultRep = eligibleReps.find((r) => r.id === currentUser?.id) || eligibleReps[0];
      const defaultRepId = defaultRep ? defaultRep.id : '';
      setSingleTargetId(defaultRepId);

      // Default distribute: all eligible reps
      setSelectedRepIdsForDistribution(eligibleReps.map((r) => r.id));

      // Fetch user's clients
      fetch(`/api/clients?repId=${userToDelete.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.clients)) {
            setClients(data.clients);
            
            // Initialize custom assignments with default rep
            const initialMap: Record<string, string> = {};
            data.clients.forEach((c: any) => {
              initialMap[c.id] = defaultRepId;
            });
            setClientAssignments(initialMap);
          } else {
            setClients([]);
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage('Müşteri listesi yüklenirken hata oluştu.');
        })
        .finally(() => {
          setIsLoadingClients(false);
        });
    }
  }, [isOpen, userToDelete, eligibleReps, currentUser]);

  // Calculate distribution breakdown
  const finalAssignmentMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (transferMode === 'single') {
      if (singleTargetId) {
        clients.forEach((c) => {
          map[c.id] = singleTargetId;
        });
      }
    } else if (transferMode === 'distribute') {
      if (selectedRepIdsForDistribution.length > 0) {
        clients.forEach((c, idx) => {
          const targetId = selectedRepIdsForDistribution[idx % selectedRepIdsForDistribution.length];
          map[c.id] = targetId;
        });
      }
    } else if (transferMode === 'custom') {
      return clientAssignments;
    }

    return map;
  }, [transferMode, singleTargetId, selectedRepIdsForDistribution, clientAssignments, clients]);

  // Count how many clients each rep will receive
  const repClientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(finalAssignmentMap).forEach((repId) => {
      if (repId) {
        counts[repId] = (counts[repId] || 0) + 1;
      }
    });
    return counts;
  }, [finalAssignmentMap]);

  // Total active deal volume of this user's clients
  const totalDealVolume = useMemo(() => {
    return clients.reduce((sum, c) => {
      const dealsSum = (c.deals || []).reduce((dSum: number, d: any) => dSum + (d.teklif_tutari || 0), 0);
      return sum + dealsSum;
    }, 0);
  }, [clients]);

  // Filtered clients for custom mode table
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.firma_adi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.yetkili_kisi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.telefon?.includes(searchQuery);
      const matchesType = typeFilter === 'all' || c.musteri_tipi === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [clients, searchQuery, typeFilter]);

  if (!isOpen || !userToDelete) return null;

  // Toggle rep for equal distribution
  const handleToggleDistributeRep = (repId: string) => {
    setSelectedRepIdsForDistribution((prev) => {
      if (prev.includes(repId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== repId);
      } else {
        return [...prev, repId];
      }
    });
  };

  // Handle single row assignment change
  const handleRowAssignChange = (clientId: string, targetId: string) => {
    setClientAssignments((prev) => ({
      ...prev,
      [clientId]: targetId,
    }));
  };

  // Submit transfer & delete
  const handleConfirmDeleteAndTransfer = async () => {
    if (clients.length > 0) {
      // Validate that all clients have a valid target
      const unassigned = clients.some((c) => !finalAssignmentMap[c.id]);
      if (unassigned) {
        setErrorMessage('Lütfen tüm müşteriler için geçerli bir temsilci ataması yapıldığından emin olun.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Build transfers array
      const customAssignmentsArray = Object.entries(finalAssignmentMap).map(([clientId, targetUserId]) => ({
        clientId,
        targetUserId,
      }));

      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToDelete.id,
          transferMode,
          singleTargetId: transferMode === 'single' ? singleTargetId : undefined,
          customAssignments: customAssignmentsArray,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Portföy devri ve kullanıcı silme işlemi başarısız oldu.');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('İşlem sırasında bağlantı hatası oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Portföy Devri & Üye Silme Sihirbazı
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Kritik İşlem
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Silinecek üyenin müşteri portföyünü diğer temsilcilere güvenle paylaştırın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Summary Info Card */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs">
              {userToDelete.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span>{userToDelete.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {userToDelete.role === 'ADMIN' ? 'Marka Merkezi' : userToDelete.role === 'SALES_MANAGER' ? 'Satış Yöneticisi' : 'Satış Temsilcisi'}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                {userToDelete.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 shadow-2xs">
              <span className="text-slate-500">Kayıtlı Portföy: </span>
              <span className="font-bold text-amber-700 font-mono text-sm">{clients.length} Müşteri</span>
            </div>

            {totalDealVolume > 0 && (
              <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 shadow-2xs hidden sm:block">
                <span className="text-slate-500">Portföy Teklif Hacmi: </span>
                <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalDealVolume)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Strategy Selector Tabs */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700">
            Devir Stratejisini Seçin:
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTransferMode('single')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                transferMode === 'single'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. Tek Temsilciye Tamamını Aktar</span>
            </button>

            <button
              type="button"
              onClick={() => setTransferMode('distribute')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                transferMode === 'distribute'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Eşit / Dengeli Dağıt</span>
            </button>

            <button
              type="button"
              onClick={() => setTransferMode('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                transferMode === 'custom'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Müşteri Bazında Özel Dağıt</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoadingClients ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
              <span className="text-xs font-medium">Müşteri portföyü yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* STRATEGY 1: SINGLE TARGET */}
              {transferMode === 'single' && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Tek Temsilciye Toplu Devir
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {userToDelete.name} temsilcisinin <strong>{clients.length} adet</strong> müşterisinin tamamı aşağıda seçeceğiniz temsilcinin portföyüne aktarılacaktır.
                      </p>
                    </div>
                  </div>

                  <div className="max-w-md pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hedef Satış Temsilcisini Seçin *
                    </label>
                    <select
                      value={singleTargetId}
                      onChange={(e) => setSingleTargetId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                    >
                      {eligibleReps.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.name} ({rep.role === 'ADMIN' ? 'Marka Merkezi' : rep.role === 'SALES_MANAGER' ? 'Satış Yöneticisi' : 'Satış Temsilcisi'}) - Mevcut: {rep._count?.clients || 0} Müşteri
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STRATEGY 2: EQUAL / ROUND-ROBIN DISTRIBUTION */}
              {transferMode === 'distribute' && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Eşit / Dengeli Otomatik Dağıtım
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        İşaretlediğiniz temsilciler arasında toplam <strong>{clients.length} müşteri</strong> dengeli bir şekilde paylaştırılır.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        Paylaşım Yapılacak Satış Temsilcileri:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedRepIdsForDistribution.length === eligibleReps.length) {
                            setSelectedRepIdsForDistribution([eligibleReps[0]?.id]);
                          } else {
                            setSelectedRepIdsForDistribution(eligibleReps.map((r) => r.id));
                          }
                        }}
                        className="text-[11px] text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        {selectedRepIdsForDistribution.length === eligibleReps.length ? 'Seçimi Daralt' : 'Tümünü Seç'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {eligibleReps.map((rep) => {
                        const isSelected = selectedRepIdsForDistribution.includes(rep.id);
                        const assignedCount = repClientCounts[rep.id] || 0;

                        return (
                          <div
                            key={rep.id}
                            onClick={() => handleToggleDistributeRep(rep.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none ${
                              isSelected
                                ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-5 h-5 rounded flex items-center justify-center text-xs transition ${
                                isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  {rep.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Mevcut: {rep._count?.clients || 0}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                +{assignedCount} Müşteri
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STRATEGY 3: CUSTOM PER-CLIENT ASSIGNMENT */}
              {transferMode === 'custom' && (
                <div className="space-y-3">
                  
                  {/* Search & Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 flex-1">
                      {/* Search */}
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Firma veya yetkili ara..."
                          className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                        />
                      </div>

                      {/* Type Filter */}
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
                      >
                        <option value="all">Tüm Müşteri Tipleri</option>
                        <option value="Kurumsal">Kurumsal</option>
                        <option value="Kamu">Kamu</option>
                        <option value="Ajans">Ajans</option>
                        <option value="KOBİ">KOBİ</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium self-end sm:self-center">
                      Toplam <strong>{filteredClients.length}</strong> müşteri listeleniyor
                    </div>
                  </div>

                  {/* Clients Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5">Firma Adı & Yetkili</th>
                          <th className="p-2.5 hidden sm:table-cell">Müşteri Tipi</th>
                          <th className="p-2.5 hidden md:table-cell">Aktif Fırsat Tutarı</th>
                          <th className="p-2.5 min-w-[180px]">Yeni Satış Temsilcisi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClients.map((c) => {
                          const clientDealsSum = (c.deals || []).reduce((s: number, d: any) => s + (d.teklif_tutari || 0), 0);
                          const currentAssignee = clientAssignments[c.id] || '';

                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{c.firma_adi}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span>{c.yetkili_kisi}</span>
                                  {c.telefon && <span>• {c.telefon}</span>}
                                </div>
                              </td>
                              <td className="p-2.5 hidden sm:table-cell">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                                  {c.musteri_tipi || 'Kurumsal'}
                                </span>
                              </td>
                              <td className="p-2.5 hidden md:table-cell font-mono font-semibold text-slate-700">
                                {clientDealsSum > 0 ? formatCurrency(clientDealsSum) : '-'}
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={currentAssignee}
                                  onChange={(e) => handleRowAssignChange(c.id, e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                                >
                                  {eligibleReps.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredClients.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                              Eşleşen müşteri bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transfer Summary Pill Breakdown */}
              <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                  <span>Devir ve Dağılım Özeti:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {eligibleReps.map((rep) => {
                    const count = repClientCounts[rep.id] || 0;
                    if (count === 0) return null;

                    return (
                      <div
                        key={rep.id}
                        className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-2 text-xs"
                      >
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="font-semibold text-slate-800">{rep.name}:</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          +{count} Müşteri
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Kullanıcı kalıcı olarak silinecek, müşterileri yukarıdaki temsilcilere devredilecektir.</span>
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer transition"
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleConfirmDeleteAndTransfer}
              disabled={isSubmitting || isLoadingClients || clients.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-98 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Devir Yapılıyor & Siliniyor...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Devri Tamamla ve Üyeyi Sil</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
