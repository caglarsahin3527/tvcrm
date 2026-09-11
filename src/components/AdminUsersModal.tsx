'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Users, 
  Trash2, 
  Edit2, 
  KeyRound, 
  TrendingUp, 
  Phone, 
  Mail, 
  Check, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUsersUpdated?: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
}) => {
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'SALES_REP' | 'SALES_MANAGER' | 'ADMIN'>('SALES_REP');
  const [newTarget, setNewTarget] = useState('500000');
  const [newPhone, setNewPhone] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'SALES_REP' | 'SALES_MANAGER' | 'ADMIN'>('SALES_REP');
  const [editTarget, setEditTarget] = useState('500000');
  const [editPhone, setEditPhone] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUserList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setActiveTab('list');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          target: Number(newTarget) || 500000,
          phone: newPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Kullanıcı eklenemedi.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`${newName} başarıyla sisteme eklendi.`);
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewTarget('500000');
      
      await fetchUsers();
      if (onUsersUpdated) onUsersUpdated();
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      setErrorMessage('Bağlantı hatası oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditRole(user.role);
    setEditTarget(user.target?.toString() || '500000');
    setEditPhone(user.phone || '');
    setActiveTab('edit');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          password: editPassword || undefined,
          role: editRole,
          target: Number(editTarget) || 500000,
          phone: editPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Kullanıcı güncellenemedi.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Kullanıcı bilgileri güncellendi.');
      await fetchUsers();
      if (onUsersUpdated) onUsersUpdated();
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMessage('');
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Bağlantı hatası oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName} isimli kullanıcıyı silmek istediğinize emin misiniz? (Müşterileri admin hesabına devredilecektir)`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        if (onUsersUpdated) onUsersUpdated();
      } else {
        alert(data.error || 'Silinemedi');
      }
    } catch (e) {
      alert('Silme sırasında hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Personel & Yetki Yönetim Masası
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Süper Admin
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ekip üyelerini ekleyin, rol ve aylık satış hedeflerini düzenleyin.
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

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setActiveTab('list'); setErrorMessage(''); }}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-b-2 ${
                activeTab === 'list'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personel Listesi ({userList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('add'); setErrorMessage(''); }}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-b-2 ${
                activeTab === 'add'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Yeni Personel / Temsilci Ekle</span>
            </button>

            {activeTab === 'edit' && (
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 border-amber-600 text-amber-700 bg-white shadow-2xs flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Personel Düzenle ({editingUser?.name})</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: USER LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <span className="text-xs">Personeller yükleniyor...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {userList.map((u) => {
                    const isSuper = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    const isManager = u.role === 'SALES_MANAGER';
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <div
                        key={u.id}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold shadow-xs ${
                            isSuper 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : isManager 
                              ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                  Siz
                                </span>
                              )}
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                isSuper 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : isManager 
                                  ? 'bg-sky-50 text-sky-700 border-sky-200' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {isSuper ? 'Genel Müdür (Admin)' : isManager ? 'Satış Yöneticisi' : 'Satış Temsilcisi'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {u.email}
                              </span>
                              {u.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {u.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                                Hedef: {formatCurrency(u.target || 0)}
                              </span>
                              <span className="text-slate-400">
                                • {u._count?.clients || 0} Müşteri Portföyü
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                            title="Düzenle / Şifre Değiştir"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Düzenle</span>
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                              title="Personeli Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD NEW USER */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateUser} className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Örn: Burak Özdemir"
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kurumsal E-Posta (Giriş için) *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="burak@tvcrm.com"
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giriş Şifresi *
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Örn: sifre123"
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kullanıcı Rolü & Yetki Düzeyi *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold"
                  >
                    <option value="SALES_REP">Satış Temsilcisi (Yalnız Kendi Portföyü)</option>
                    <option value="SALES_MANAGER">Satış Yöneticisi (Ekip & Satış İzleme)</option>
                    <option value="ADMIN">Süper Admin (Tüm Yetkiler & Personel Masası)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aylık Satış Hedefi (TL)
                  </label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="500000"
                    step="10000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0532 000 0000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Personeli Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: EDIT USER */}
          {activeTab === 'edit' && editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kurumsal E-Posta *
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yeni Şifre Belirle (Değişmeyecekse boş bırakın)
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Boş bırakılırsa eski şifre kalır"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol & Yetki Düzeyi *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold"
                  >
                    <option value="SALES_REP">Satış Temsilcisi</option>
                    <option value="SALES_MANAGER">Satış Yöneticisi</option>
                    <option value="ADMIN">Süper Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aylık Satış Hedefi (TL)
                  </label>
                  <input
                    type="number"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    step="10000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Güncelleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Değişiklikleri Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
