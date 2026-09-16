'use client';

import React, { useState, useMemo } from 'react';
import { User, WorkReport, WorkReportOrgType, WorkReportContactType, WorkReportSaleType, WorkReportReservationType, WorkReportCustomerStatus, WorkReportAdType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  X, 
  Printer, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Building2,
  Tv,
  Phone,
  Mail,
  Video,
  UserCheck,
  Plus,
  Filter,
  FileSpreadsheet,
  FileText,
  Trash2,
  Lock,
  Sparkles,
  Search,
  Check,
  Loader2,
  AlertCircle,
  BarChart3,
  Percent,
  Layers,
  FileCheck
} from 'lucide-react';
import { exportToExcel, exportToCsv } from '@/lib/formatters';

interface WorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  workReports?: WorkReport[];
  onRefresh?: () => void;
}

export const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  workReports = [],
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'new_entry'>('reports');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Role Checks
  const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isManager = currentUser?.role === 'SALES_MANAGER';
  const isRep = currentUser?.role === 'SALES_REP';

  // --- FILTERS STATE ---
  const [timeRange, setTimeRange] = useState<'today' | 'this_week' | 'this_month' | 'all' | 'custom'>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [selectedContactFilter, setSelectedContactFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- NEW WORK REPORT FORM STATE ---
  const todayIso = new Date().toISOString().split('T')[0];
  const [tarih, setTarih] = useState(todayIso);
  const [assignedUserId, setAssignedUserId] = useState(currentUser ? currentUser.id : users[0]?.id || '');
  const [kurumAdi, setKurumAdi] = useState('');
  const [kurumTuru, setKurumTuru] = useState<WorkReportOrgType>('Marka');
  const [musteriDurumu, setMusteriDurumu] = useState<WorkReportCustomerStatus>('Yeni Müşteri');
  const [yetkili, setYetkili] = useState('');
  const [yetkiliTelefon, setYetkiliTelefon] = useState('');
  const [yetkiliEposta, setYetkiliEposta] = useState('');
  const [iletisimTuru, setIletisimTuru] = useState<WorkReportContactType>('Telefon');
  const [reklamTuru, setReklamTuru] = useState<WorkReportAdType>('Reklam');
  const [tvKanali, setTvKanali] = useState<'Bi Kanal' | 'Sıfır TV'>('Bi Kanal');
  const [gorusmeAmaci, setGorusmeAmaci] = useState('');
  const [sonuc, setSonuc] = useState('');

  // Optional Field Toggles
  const [teklifVerildi, setTeklifVerildi] = useState(false);
  const [teklifTutari, setTeklifTutari] = useState('');
  const [teklifIhtimal, setTeklifIhtimal] = useState('%50');

  const [satisYapildi, setSatisYapildi] = useState(false);
  const [satisTuru, setSatisTuru] = useState<WorkReportSaleType>('Spot Reklam');
  const [satisTutari, setSatisTutari] = useState('');

  const [kurumsalZiyaret, setKurumsalZiyaret] = useState(false);

  const [rezervasyonVar, setRezervasyonVar] = useState(false);
  const [rezervasyonGelen, setRezervasyonGelen] = useState('1');
  const [rezervasyonTuru, setRezervasyonTuru] = useState<WorkReportReservationType>('Spot');
  const [rezervasyonBirimFiyat, setRezervasyonBirimFiyat] = useState('');
  const [rezervasyonToplamSaniye, setRezervasyonToplamSaniye] = useState('30');

  // Reset Form
  const resetForm = () => {
    setTarih(new Date().toISOString().split('T')[0]);
    setKurumAdi('');
    setKurumTuru('Marka');
    setMusteriDurumu('Yeni Müşteri');
    setYetkili('');
    setYetkiliTelefon('');
    setYetkiliEposta('');
    setIletisimTuru('Telefon');
    setReklamTuru('Reklam');
    setTvKanali('Bi Kanal');
    setGorusmeAmaci('');
    setSonuc('');
    setTeklifVerildi(false);
    setTeklifTutari('');
    setTeklifIhtimal('%50');
    setSatisYapildi(false);
    setSatisTuru('Spot Reklam');
    setSatisTutari('');
    setKurumsalZiyaret(false);
    setRezervasyonVar(false);
    setRezervasyonGelen('1');
    setRezervasyonTuru('Spot');
    setRezervasyonBirimFiyat('');
    setRezervasyonToplamSaniye('30');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Synchronize current user on open
  React.useEffect(() => {
    if (currentUser) {
      setAssignedUserId(currentUser.id);
    }
  }, [currentUser, isOpen]);

  // Filtered Reports Calculation
  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    return workReports.filter((r) => {
      // 1. User Filter
      if (selectedUserFilter !== 'all' && r.user_id !== selectedUserFilter) {
        return false;
      }

      // 2. Org Type Filter
      if (selectedOrgFilter !== 'all' && r.kurum_turu !== selectedOrgFilter) {
        return false;
      }

      // 3. Contact Type Filter
      if (selectedContactFilter !== 'all' && r.iletisim_turu !== selectedContactFilter) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.kurum_adi?.toLowerCase().includes(q);
        const matchYetkili = r.yetkili?.toLowerCase().includes(q);
        const matchAmac = r.gorusme_amaci?.toLowerCase().includes(q);
        const matchUser = r.user?.name?.toLowerCase().includes(q);
        if (!matchName && !matchYetkili && !matchAmac && !matchUser) return false;
      }

      // 5. Date Range Filter
      const reportDate = new Date(r.tarih);
      const reportDateStr = reportDate.toISOString().split('T')[0];

      if (timeRange === 'today') {
        return reportDateStr === todayDateStr;
      } else if (timeRange === 'this_week') {
        const day = now.getDay() || 7;
        const start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        start.setHours(0, 0, 0, 0);
        return reportDate >= start;
      } else if (timeRange === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return reportDate >= start;
      } else if (timeRange === 'custom') {
        if (customStartDate && reportDateStr < customStartDate) return false;
        if (customEndDate && reportDateStr > customEndDate) return false;
        return true;
      }

      return true; // 'all'
    });
  }, [workReports, selectedUserFilter, selectedOrgFilter, selectedContactFilter, timeRange, customStartDate, customEndDate, searchQuery]);

  // Aggregated KPI Metrics
  const totalReportsCount = filteredReports.length;
  
  const teklifReports = filteredReports.filter((r) => r.teklif_verildi);
  const totalTeklifTutari = teklifReports.reduce((sum, r) => sum + (r.teklif_tutari || 0), 0);

  const satisReports = filteredReports.filter((r) => r.satis_yapildi);
  const totalSatisTutari = satisReports.reduce((sum, r) => sum + (r.satis_tutari || 0), 0);

  const rezervasyonReports = filteredReports.filter((r) => r.rezervasyon_var);
  const totalRezervasyonAdet = rezervasyonReports.reduce((sum, r) => sum + (r.rezervasyon_gelen || 0), 0);
  const totalRezervasyonSaniye = rezervasyonReports.reduce((sum, r) => sum + (r.rezervasyon_toplam_saniye || 0), 0);

  const kurumsalZiyaretCount = filteredReports.filter((r) => r.kurumsal_ziyaret || r.iletisim_turu === 'Kurumsal Ziyaret').length;

  // Handle Form Submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kurumAdi || !yetkili) {
      setErrorMessage('Lütfen Kurum Adı ve Yetkili alanlarını doldurunuz.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        tarih,
        user_id: isSuperAdmin ? assignedUserId : currentUser?.id,
        kurum_adi: kurumAdi,
        kurum_turu: kurumTuru,
        musteri_durumu: musteriDurumu,
        yetkili,
        yetkili_telefon: yetkiliTelefon,
        yetkili_eposta: yetkiliEposta,
        iletisim_turu: iletisimTuru,
        reklam_turu: reklamTuru,
        tv_kanali: tvKanali,
        gorusme_amaci: gorusmeAmaci,
        sonuc,
        teklif_verildi: teklifVerildi,
        teklif_tutari: teklifVerildi ? Number(teklifTutari) || 0 : 0,
        teklif_ihtimal: teklifVerildi ? teklifIhtimal : '',
        satis_yapildi: satisYapildi,
        satis_turu: satisYapildi ? satisTuru : '',
        satis_tutari: satisYapildi ? Number(satisTutari) || 0 : 0,
        kurumsal_ziyaret: kurumsalZiyaret || iletisimTuru === 'Kurumsal Ziyaret',
        rezervasyon_var: rezervasyonVar,
        rezervasyon_gelen: rezervasyonVar ? Number(rezervasyonGelen) || 0 : 0,
        rezervasyon_turu: rezervasyonVar ? rezervasyonTuru : '',
        rezervasyon_birim_fiyat: rezervasyonVar ? Number(rezervasyonBirimFiyat) || 0 : 0,
        rezervasyon_toplam_saniye: rezervasyonVar ? Number(rezervasyonToplamSaniye) || 0 : 0,
      };

      const res = await fetch('/api/work-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Rapor kaydedilemedi.');
        return;
      }

      setSuccessMessage('Çalışma raporu başarıyla sisteme işlendi.');
      resetForm();
      if (onRefresh) onRefresh();

      setTimeout(() => {
        setActiveTab('reports');
        setSuccessMessage('');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Kayıt sırasında bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Report (With strict role & ownership check)
  const handleDeleteReport = async (report: WorkReport) => {
    // Only creator or super admin can delete
    if (!isSuperAdmin && report.user_id !== currentUser?.id) {
      alert('Yalnızca kendi girdiğiniz çalışma raporlarını silebilirsiniz.');
      return;
    }

    if (!confirm(`"${report.kurum_adi}" için girilen çalışma raporunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/work-reports?id=${report.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Silinemedi.');
      }
    } catch {
      alert('Silme sırasında hata oluştu.');
    }
  };

  // Handle Print (Landscape A4) - Strictly for Super Admin
  const handlePrint = () => {
    if (!isSuperAdmin) {
      alert('Rapor alma ve yazdırma yetkisi yalnızca Süper Admin (Genel Müdür) hesabına aittir.');
      return;
    }
    window.print();
  };

  // Handle Excel Export - Strictly for Super Admin
  const handleExportExcel = () => {
    if (!isSuperAdmin) {
      alert('Rapor alma ve dışa aktarma yetkisi yalnızca Süper Admin hesabına aittir.');
      return;
    }

    const exportRows = filteredReports.map((r) => ({
      'Tarih': formatDate(r.tarih),
      'Grup Üyesi': r.user?.name || '',
      'Kurum': r.kurum_adi,
      'Kurum Türü': r.kurum_turu,
      'Yetkili': r.yetkili,
      'İletişim Türü': r.iletisim_turu,
      'Görüşme Amacı & Not': r.gorusme_amaci,
      'Teklif Verildi': r.teklif_verildi ? 'Evet' : 'Hayır',
      'Teklif Tutarı (TL)': r.teklif_tutari || 0,
      'Teklif İhtimal': r.teklif_ihtimal || '-',
      'Satış Yapıldı': r.satis_yapildi ? 'Evet' : 'Hayır',
      'Satış Türü': r.satis_turu || '-',
      'Satış Tutarı (TL)': r.satis_tutari || 0,
      'Kurumsal Ziyaret': r.kurumsal_ziyaret ? 'Evet' : 'Hayır',
      'Rezervasyon': r.rezervasyon_var ? 'Evet' : 'Hayır',
      'Rezervasyon Gelen (1-100)': r.rezervasyon_gelen || 0,
      'Rezervasyon Türü': r.rezervasyon_turu || '-',
      'Birim Fiyat (TL)': r.rezervasyon_birim_fiyat || 0,
      'Toplam Saniye': r.rezervasyon_toplam_saniye || 0,
    }));

    exportToExcel(exportRows, `TVCRM_Calisma_Raporu_${new Date().toISOString().split('T')[0]}`);
  };

  if (!isOpen) return null;

  const getRepName = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    return u ? u.name : 'Bilinmeyen Personel';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      
      {/* PRINT-ONLY LANDSCAPE A4 STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body * {
            visibility: hidden;
          }
          #print-work-report-area,
          #print-work-report-area * {
            visibility: visible;
          }
          #print-work-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            font-size: 9pt;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Header (No-Print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight font-mono text-white">ÇALIŞMA RAPORU & FAALİYET KONSOLU</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  B! Kanal & Sıfır TV
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Grup Üyeleri Günlük, Haftalık ve Dönemsel Faaliyet, Teklif ve Rezervasyon Kayıtları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Rapor Alma Butonları */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold transition border border-slate-700 cursor-pointer"
                  title="Excel Formatında İndir"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Yatay A4 Yazdır / PDF İndir"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yatay A4 Yazdır</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px] border border-slate-700">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Rapor İndirme: Süper Admin Yetkisinde</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (No-Print) */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-b-2 ${
                activeTab === 'reports'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Çalışma Raporları & Analiz ({filteredReports.length})</span>
            </button>

            {!isManager && (
              <button
                type="button"
                onClick={() => { setActiveTab('new_entry'); resetForm(); }}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-b-2 ${
                  activeTab === 'new_entry'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>+ Yeni Görüşme / Çalışma Kaydet</span>
              </button>
            )}
          </div>

          {isManager && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
              İzleme Modu: Yöneticiler çalışmaları izler, kayıt ekleyemez veya silemez.
            </span>
          )}
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" id="print-work-report-area">
          
          {/* TAB 1: ÇALIŞMA RAPORLARI LİSTESİ VE ANALİZİ */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              
              {/* PRINT HEADER ONLY VISIBLE ON PAPER / PDF */}
              <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-black tracking-tight font-mono">B! KANAL & SIFIR TV - GÜNLÜK VE DÖNEMSEL KURUMSAL ÇALIŞMA RAPORU</h1>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Marka ve Büyüme Merkezi • Reklam Satış Grup Direktörlüğü
                    </p>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <div><strong>Rapor Tarihi:</strong> {new Date().toLocaleDateString('tr-TR')}</div>
                    <div><strong>Filtre Kapsamı:</strong> {selectedUserFilter === 'all' ? 'Tüm Grup Üyeleri' : getRepName(selectedUserFilter)}</div>
                    <div><strong>Zaman Dilimi:</strong> {timeRange === 'today' ? 'Bugün' : timeRange === 'this_week' ? 'Bu Hafta' : timeRange === 'this_month' ? 'Bu Ay' : 'Tüm Dönem'}</div>
                  </div>
                </div>
              </div>

              {/* FILTER BAR (No-Print) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 no-print">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  
                  {/* 1. Time Range Quick Buttons */}
                  <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setTimeRange('today')}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        timeRange === 'today' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bugün (Anlık/Günlük)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange('this_week')}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        timeRange === 'this_week' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bu Hafta
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange('this_month')}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        timeRange === 'this_month' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bu Ay
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange('all')}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        timeRange === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tümü
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange('custom')}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        timeRange === 'custom' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Özel Tarih
                    </button>
                  </div>

                  {/* 2. Custom Date Pickers (if custom selected) */}
                  {timeRange === 'custom' && (
                    <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-transparent text-slate-800 font-mono focus:outline-none"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-transparent text-slate-800 font-mono focus:outline-none"
                      />
                    </div>
                  )}

                  {/* 3. Search Box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Kurum, yetkili veya konu ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-48 sm:w-56"
                    />
                  </div>
                </div>

                {/* Second Filter Row: Grup Üyesi (İsim İsim), Kurum Türü, İletişim Türü */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-xs">
                  
                  {/* Grup Üyesi (İsim İsim Seçimi) */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                    <Users className="w-3.5 h-3.5 text-sky-600 mr-1.5" />
                    <span className="text-slate-500 text-[11px] mr-1">Grup Üyesi:</span>
                    <select
                      value={selectedUserFilter}
                      onChange={(e) => setSelectedUserFilter(e.target.value)}
                      className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Grup Üyeleri (Genel)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'SALES_MANAGER' ? 'Yönetici' : 'Temsilci'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kurum Türü Filtresi */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                    <span className="text-slate-500 text-[11px] mr-1">Kurum:</span>
                    <select
                      value={selectedOrgFilter}
                      onChange={(e) => setSelectedOrgFilter(e.target.value)}
                      className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Kurumlar</option>
                      <option value="Marka">Marka</option>
                      <option value="Ajans">Ajans</option>
                      <option value="KOBİ">KOBİ</option>
                      <option value="Kamu">Kamu</option>
                    </select>
                  </div>

                  {/* İletişim Türü Filtresi */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                    <span className="text-slate-500 text-[11px] mr-1">İletişim:</span>
                    <select
                      value={selectedContactFilter}
                      onChange={(e) => setSelectedContactFilter(e.target.value)}
                      className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm İletişim Türleri</option>
                      <option value="Telefon">Telefon</option>
                      <option value="E-posta">E-posta</option>
                      <option value="Yüzyüze Toplantı">Yüzyüze Toplantı</option>
                      <option value="Dijital Toplantı">Dijital Toplantı</option>
                      <option value="Kurumsal Ziyaret">Kurumsal Ziyaret</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(selectedUserFilter !== 'all' || selectedOrgFilter !== 'all' || selectedContactFilter !== 'all' || searchQuery || timeRange !== 'all' || customStartDate || customEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserFilter('all');
                        setSelectedOrgFilter('all');
                        setSelectedContactFilter('all');
                        setTimeRange('all');
                        setCustomStartDate('');
                        setCustomEndDate('');
                        setSearchQuery('');
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
                    >
                      Filtreleri Sıfırla
                    </button>
                  )}

                </div>
              </div>

              {/* KPI KONSOLU (Özet İstatistikler) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Toplam Görüşme</span>
                  <div className="text-lg font-mono font-black text-slate-900 mt-1">{totalReportsCount} Kayıt</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Faaliyet temas sayısı</div>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl">
                  <span className="text-[10px] font-mono uppercase font-bold text-sky-700">Verilen Teklifler</span>
                  <div className="text-lg font-mono font-black text-sky-800 mt-1">{formatCurrency(totalTeklifTutari)}</div>
                  <div className="text-[10px] text-sky-700 font-mono mt-0.5">{teklifReports.length} Teklif Sunuldu</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700">Gerçekleşen Satış</span>
                  <div className="text-lg font-mono font-black text-emerald-700 mt-1">{formatCurrency(totalSatisTutari)}</div>
                  <div className="text-[10px] text-emerald-800 font-mono mt-0.5">{satisReports.length} Satış Kapatıldı</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800">Rezervasyonlar</span>
                  <div className="text-lg font-mono font-black text-amber-800 mt-1">{totalRezervasyonAdet} Adet</div>
                  <div className="text-[10px] text-amber-700 font-mono mt-0.5">{totalRezervasyonSaniye} sn Toplam Kuşak</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-800">Kurumsal Ziyaret</span>
                  <div className="text-lg font-mono font-black text-purple-900 mt-1">{kurumsalZiyaretCount} Ziyaret</div>
                  <div className="text-[10px] text-purple-700 font-mono mt-0.5">Yüzyüze / Saha Teması</div>
                </div>
              </div>

              {/* DETAYLI ÇALIŞMA RAPORU TABLOSU */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    Faaliyet ve Görüşme Kayıtları Listesi
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Listelenen: {filteredReports.length} Rapor
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-mono font-bold">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tarih</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Personel</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Kurum</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Yeni/Mevcut</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tür</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Yetkili</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Telefon</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">E-posta</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">İletişim</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Reklam/Barter</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">TV</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tutar (₺)</th>
                        <th className="py-2.5 px-3">Sonuç</th>
                        <th className="py-2.5 px-3 text-right no-print">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.map((report) => {
                        const isOwner = report.user_id === currentUser?.id;
                        const canDelete = isSuperAdmin || isOwner;

                        return (
                          <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* Tarih */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {formatDate(report.tarih)}
                            </td>

                            {/* Personel */}
                            <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap text-[11px]">
                              {report.user?.name || getRepName(report.user_id)}
                            </td>

                            {/* Kurum */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900 text-[11px]">{report.kurum_adi}</div>
                            </td>

                            {/* Yeni / Mevcut */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                report.musteri_durumu === 'Yeni Müşteri'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {report.musteri_durumu || 'Yeni Müşteri'}
                              </span>
                            </td>

                            {/* Kurum Türü (Marka/Ajans/KOBİ/Kamu) */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                                {report.kurum_turu}
                              </span>
                            </td>

                            {/* Yetkili */}
                            <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap text-[11px]">
                              {report.yetkili}
                            </td>

                            {/* Telefon */}
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                              {report.yetkili_telefon || '-'}
                            </td>

                            {/* E-posta */}
                            <td className="py-2.5 px-3 text-[10px] text-slate-600 whitespace-nowrap max-w-[160px] truncate">
                              {report.yetkili_eposta || '-'}
                            </td>

                            {/* İletişim Türü */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                report.iletisim_turu === 'Telefon' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                report.iletisim_turu === 'E-posta' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                report.iletisim_turu === 'Yüzyüze Toplantı' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                report.iletisim_turu === 'Dijital Toplantı' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                'bg-purple-50 text-purple-800 border-purple-200'
                              }`}>
                                {report.iletisim_turu}
                              </span>
                            </td>

                            {/* Reklam / Barter */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                report.reklam_turu === 'Barter'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}>
                                {report.reklam_turu || 'Reklam'}
                              </span>
                            </td>

                            {/* TV Kanalı */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-bold text-slate-700">
                              {report.tv_kanali || 'Bi Kanal'}
                            </td>

                            {/* Tutar (₺) */}
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                              {(report.teklif_tutari && report.teklif_tutari > 0) ? (
                                <span className="font-bold text-sky-700">{formatCurrency(report.teklif_tutari)}</span>
                              ) : (report.satis_tutari && report.satis_tutari > 0) ? (
                                <span className="font-bold text-emerald-700">{formatCurrency(report.satis_tutari)}</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Sonuç */}
                            <td className="py-2.5 px-3 text-slate-700 max-w-[200px] text-[11px]">
                              <p className="line-clamp-2" title={report.sonuc || report.gorusme_amaci}>
                                {report.sonuc || report.gorusme_amaci || '-'}
                              </p>
                            </td>

                            {/* İşlemler (No-Print) */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap no-print">
                              {canDelete && !isManager ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(report)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Raporu Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic" title="Yalnızca Görüntüleme">
                                  İzleme
                                </span>
                              )}
                            </td>

                          </tr>
                        );
                      })}

                      {filteredReports.length === 0 && (
                        <tr>
                          <td colSpan={14} className="text-center py-10 text-slate-400 font-mono text-xs">
                            SEÇİLEN KRİTERLERE UYGUN ÇALIŞMA RAPORU KAYDI BULUNAMADI
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRINT FOOTER / SIGNATURE BLOCK (Visible only on print/PDF) */}
              <div className="hidden print:grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-300 text-center font-mono text-xs">
                <div>
                  <div className="font-bold text-slate-900">Raporu Hazırlayan</div>
                  <div className="text-slate-600 mt-1">{currentUser?.name || 'Sistem Kullanıcısı'}</div>
                  <div className="mt-8 border-b border-slate-400 w-32 mx-auto"></div>
                  <div className="text-[10px] text-slate-400 mt-1">İmza</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Reklam Satış Grup Direktörü</div>
                  <div className="text-slate-600 mt-1">İnceleme & Kontrol</div>
                  <div className="mt-8 border-b border-slate-400 w-32 mx-auto"></div>
                  <div className="text-[10px] text-slate-400 mt-1">İmza</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Genel Müdür Onayı</div>
                  <div className="text-slate-600 mt-1">Süper Admin / Yönetim</div>
                  <div className="mt-8 border-b border-slate-400 w-32 mx-auto"></div>
                  <div className="text-[10px] text-slate-400 mt-1">Onay & Mühür</div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: YENİ GÖRÜŞME / ÇALIŞMA RAPORU GİRİŞ FORMU */}
          {activeTab === 'new_entry' && (
            <form onSubmit={handleSubmitReport} className="space-y-4 max-w-3xl mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-sm text-slate-900">YENİ ÇALIŞMA RAPORU GİRİŞİ</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Yapılan görüşmeyi ve çıktıları kaydedin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Rapor Listesine Dön
                </button>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Tarih */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    Görüşme Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={tarih}
                    onChange={(e) => setTarih(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                {/* 2. Grup Üyesi / Temsilci (Admin için seçilebilir) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    Grup Üyesi / Temsilci *
                  </label>
                  <select
                    disabled={!isSuperAdmin}
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold disabled:opacity-75 cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'SALES_MANAGER' ? 'Yönetici' : 'Satış Temsilcisi'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Kurum Adı */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    Kurum / Firma Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Vestel, Eczacıbaşı, Çevre Bakanlığı"
                    value={kurumAdi}
                    onChange={(e) => setKurumAdi(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                {/* 4. Kurum Türü (Marka, Ajans, Kobi, Kamu) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                    Kurum Türü *
                  </label>
                  <select
                    value={kurumTuru}
                    onChange={(e) => setKurumTuru(e.target.value as WorkReportOrgType)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold cursor-pointer"
                  >
                    <option value="Marka">Marka</option>
                    <option value="Ajans">Ajans</option>
                    <option value="KOBİ">KOBİ</option>
                    <option value="Kamu">Kamu</option>
                  </select>
                </div>

                {/* 4.5. Müşteri Durumu (Yeni/Mevcut) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                    Müşteri Durumu *
                  </label>
                  <select
                    value={musteriDurumu}
                    onChange={(e) => setMusteriDurumu(e.target.value as WorkReportCustomerStatus)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold cursor-pointer"
                  >
                    <option value="Yeni Müşteri">Yeni Müşteri</option>
                    <option value="Mevcut">Mevcut</option>
                  </select>
                </div>

                {/* 5. Yetkili */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    Görüşülen Yetkili Kişi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Yetkili Kişi Adı Soyadı"
                    value={yetkili}
                    onChange={(e) => setYetkili(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                {/* 5.1 Yetkili Telefon */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Yetkili Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="Örn: 0555 000 0000"
                    value={yetkiliTelefon}
                    onChange={(e) => setYetkiliTelefon(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                {/* 5.2 Yetkili E-posta */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Yetkili E-posta
                  </label>
                  <input
                    type="email"
                    placeholder="Örn: yetkili@firma.com"
                    value={yetkiliEposta}
                    onChange={(e) => setYetkiliEposta(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                {/* 6. İletişim Türü Seçici Butonları */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                    İletişim Türü Seçin *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['Telefon', 'E-posta', 'Yüzyüze Toplantı', 'Dijital Toplantı', 'Kurumsal Ziyaret'] as WorkReportContactType[]).map((type) => {
                      const isSelected = iletisimTuru === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setIletisimTuru(type);
                            if (type === 'Kurumsal Ziyaret') setKurumsalZiyaret(true);
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                          }`}
                        >
                          {type === 'Telefon' && <Phone className="w-4 h-4" />}
                          {type === 'E-posta' && <Mail className="w-4 h-4" />}
                          {type === 'Yüzyüze Toplantı' && <Users className="w-4 h-4" />}
                          {type === 'Dijital Toplantı' && <Video className="w-4 h-4" />}
                          {type === 'Kurumsal Ziyaret' && <Building2 className="w-4 h-4" />}
                          <span className="text-[10px] leading-tight text-center">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6.1 Reklam Türü ve TV Kanalı */}
                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                      Reklam / Barter *
                    </label>
                    <select
                      value={reklamTuru}
                      onChange={(e) => setReklamTuru(e.target.value as WorkReportAdType)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold cursor-pointer"
                    >
                      <option value="Reklam">Reklam</option>
                      <option value="Barter">Barter</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                      TV Kanalı *
                    </label>
                    <select
                      value={tvKanali}
                      onChange={(e) => setTvKanali(e.target.value as 'Bi Kanal' | 'Sıfır TV')}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold cursor-pointer"
                    >
                      <option value="Bi Kanal">Bi Kanal</option>
                      <option value="Sıfır TV">Sıfır TV</option>
                    </select>
                  </div>
                </div>

                {/* 7. Kiminle Ne Amaçla Görüşüldü */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                    Görüşme Amacı & Notlar
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Kiminle ve ne amaçla görüşüldüğü, konuşulan detaylar, takip notları..."
                    value={gorusmeAmaci}
                    onChange={(e) => setGorusmeAmaci(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs resize-none"
                  />
                </div>

                {/* 8. Sonuç */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                    Sonuç
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Teklif İstendi, Randevu İstendi, Görüşme Devam Ediyor..."
                    value={sonuc}
                    onChange={(e) => setSonuc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

              </div>

              {/* OPSİYONEL ALANLAR: TEKLİF, SATIŞ, KURUMSAL ZİYARET, REZERVASYON */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-slate-500 block">
                  İşlem & Çıktı Detayları (Opsiyonel):
                </span>

                {/* TEKLİF VERİLDİ BÖLÜMÜ */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={teklifVerildi}
                      onChange={(e) => setTeklifVerildi(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Teklif Verildi
                    </span>
                  </label>

                  {teklifVerildi && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Teklif Tutarı (₺)</label>
                        <input
                          type="number"
                          placeholder="250000"
                          value={teklifTutari}
                          onChange={(e) => setTeklifTutari(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-mono font-bold focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">İhtimal % Oranı</label>
                        <select
                          value={teklifIhtimal}
                          onChange={(e) => setTeklifIhtimal(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="%10">%10 (Düşük İhtimal)</option>
                          <option value="%25">%25 (Görüşme Sürüyor)</option>
                          <option value="%50">%50 (Orta İhtimal)</option>
                          <option value="%75">%75 (Yüksek İhtimal)</option>
                          <option value="%90">%90 (Kapanmak Üzere)</option>
                          <option value="%100">%100 (Kesinleşti)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* SATIŞ YAPILDI BÖLÜMÜ */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={satisYapildi}
                      onChange={(e) => setSatisYapildi(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Satış Yapıldı (Anlaşma Sağlandı)
                    </span>
                  </label>

                  {satisYapildi && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Satış / Reklam Türü</label>
                        <select
                          value={satisTuru}
                          onChange={(e) => setSatisTuru(e.target.value as WorkReportSaleType)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="Spot Reklam">Spot Reklam</option>
                          <option value="Alt Bant Reklam">Alt Bant Reklam</option>
                          <option value="Sponsorluk">Sponsorluk</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Satış Bedeli (₺)</label>
                        <input
                          type="number"
                          placeholder="500000"
                          value={satisTutari}
                          onChange={(e) => setSatisTutari(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-mono font-black focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* REZERVASYON BÖLÜMÜ */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rezervasyonVar}
                      onChange={(e) => setRezervasyonVar(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Rezervasyon Kaydı
                    </span>
                  </label>

                  {rezervasyonVar && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Gelen (1-100)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={rezervasyonGelen}
                          onChange={(e) => setRezervasyonGelen(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Tür</label>
                        <select
                          value={rezervasyonTuru}
                          onChange={(e) => setRezervasyonTuru(e.target.value as WorkReportReservationType)}
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="Spot">Spot</option>
                          <option value="Alt Bant">Alt Bant</option>
                          <option value="Sponsorluk">Sponsorluk</option>
                          <option value="Kamu Spotu">Kamu Spotu</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Birim Fiyat (₺)</label>
                        <input
                          type="number"
                          placeholder="2500"
                          value={rezervasyonBirimFiyat}
                          onChange={(e) => setRezervasyonBirimFiyat(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Toplam Saniye</label>
                        <input
                          type="number"
                          placeholder="45"
                          value={rezervasyonToplamSaniye}
                          onChange={(e) => setRezervasyonToplamSaniye(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Çalışma Raporunu Kaydet</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer (No-Print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
          <div className="text-[11px] font-mono text-slate-500">
            Aktif Kullanıcı: <strong className="text-slate-800">{currentUser?.name || 'Süper Admin'}</strong>
            <span className="mx-1.5">•</span>
            Rol: <strong className="text-sky-700">{currentUser?.role === 'ADMIN' ? 'Süper Admin' : currentUser?.role === 'SALES_MANAGER' ? 'Satış Yöneticisi' : 'Satış Temsilcisi'}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
