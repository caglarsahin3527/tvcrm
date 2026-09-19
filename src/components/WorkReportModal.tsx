'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  User, 
  Client,
  WorkReport, 
  WorkReportOrgType, 
  WorkReportContactType, 
  WorkReportSaleType, 
  WorkReportReservationType, 
  WorkReportCustomerStatus, 
  WorkReportAdType 
} from '@/types';
import { formatCurrency, formatDate, toTurkishUpper, toCleanEmail, exportToExcel } from '@/lib/formatters';
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
  FileCheck,
  Table,
  Calculator,
  ChevronDown
} from 'lucide-react';

// Helper to calculate total monetary amount of a reservation
export const getReportRezAmount = (r: Partial<WorkReport>): number => {
  if (!r.rezervasyon_var) return 0;
  if (r.rezervasyon_fiyat_tipi === 'PT_OPT') {
    const opt = (Number(r.rezervasyon_opt_saniye) || 0) * (Number(r.rezervasyon_opt_fiyat) || 0);
    const pt = (Number(r.rezervasyon_pt_saniye) || 0) * (Number(r.rezervasyon_pt_fiyat) || 0);
    return opt + pt;
  }
  return (Number(r.rezervasyon_toplam_saniye) || 0) * (Number(r.rezervasyon_birim_fiyat) || 0);
};

interface WorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  clients?: Client[];
  currentUser: User | null;
  workReports?: WorkReport[];
  onRefresh?: () => void;
}

export const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  users,
  clients = [],
  currentUser,
  workReports = [],
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'matrix' | 'new_entry'>('reports');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [localReports, setLocalReports] = useState<WorkReport[]>(workReports);

  useEffect(() => {
    setLocalReports(workReports);
  }, [workReports]);

  // Role Checks
  const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isManager = currentUser?.role === 'SALES_MANAGER';
  const isViewer = currentUser?.role === 'VIEWER';
  // Misafir yönetici raporları görebilmeli
  const canSeeMatrix = isSuperAdmin || isManager || isViewer;

  // --- FILTERS STATE ---
  const [timeRange, setTimeRange] = useState<'today' | 'this_week' | 'this_month' | 'all' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
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

  // TV Reklam Rezervasyon Kuşak Fiyatlama (PT / OPT / Tek Fiyat)
  const [rezervasyonVar, setRezervasyonVar] = useState(false);
  const [rezervasyonGelen, setRezervasyonGelen] = useState('1');
  const [rezervasyonTuru, setRezervasyonTuru] = useState<WorkReportReservationType>('Spot');
  const [rezervasyonFiyatTipi, setRezervasyonFiyatTipi] = useState<'TEK_FIYAT' | 'PT_OPT'>('TEK_FIYAT');
  
  // Tek Fiyat Mode
  const [rezervasyonBirimFiyat, setRezervasyonBirimFiyat] = useState('');
  const [rezervasyonToplamSaniye, setRezervasyonToplamSaniye] = useState('');

  // PT / OPT Kuşak Mode
  const [rezervasyonOptSaniye, setRezervasyonOptSaniye] = useState('');
  const [rezervasyonOptFiyat, setRezervasyonOptFiyat] = useState('');
  const [rezervasyonPtSaniye, setRezervasyonPtSaniye] = useState('');
  const [rezervasyonPtFiyat, setRezervasyonPtFiyat] = useState('');

  // Vade (Payment Terms)
  const [rezervasyonVade, setRezervasyonVade] = useState('');

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

  // Distinct company suggestions from clients and past work reports
  const companySuggestions = useMemo(() => {
    const map = new Map<string, { name: string; yetkili: string; telefon: string; eposta: string; tip: WorkReportOrgType }>();
    
    // Add from clients
    clients.forEach((c) => {
      if (c.firma_adi && !map.has(c.firma_adi.toUpperCase())) {
        let mappedTip: WorkReportOrgType = 'Marka';
        if (c.musteri_tipi === 'Ajans') mappedTip = 'Ajans';
        else if (c.musteri_tipi === 'Kamu') mappedTip = 'Kamu';
        else if (c.musteri_tipi === 'KOBİ') mappedTip = 'KOBİ';

        map.set(c.firma_adi.toUpperCase(), {
          name: c.firma_adi,
          yetkili: c.yetkili_kisi || '',
          telefon: c.telefon || '',
          eposta: c.eposta || '',
          tip: mappedTip,
        });
      }
    });

    // Add from previous work reports
    localReports.forEach((r) => {
      if (r.kurum_adi && !map.has(r.kurum_adi.toUpperCase())) {
        map.set(r.kurum_adi.toUpperCase(), {
          name: r.kurum_adi,
          yetkili: r.yetkili || '',
          telefon: r.yetkili_telefon || '',
          eposta: r.yetkili_eposta || '',
          tip: (r.kurum_turu as WorkReportOrgType) || 'Marka',
        });
      }
    });

    return Array.from(map.values()).filter(item => {
      if (currentUser?.role === 'SALES_REP') {
        const client = clients.find(c => c.firma_adi?.toUpperCase() === item.name.toUpperCase());
        if (client && client.satis_temsilcisi_id !== currentUser.id) return false;
      }
      return true;
    });
  }, [clients, localReports, currentUser]);

  // Filtered suggestions based on user input
  const filteredSuggestions = useMemo(() => {
    if (!kurumAdi.trim() || kurumAdi.length < 1) return [];
    const q = kurumAdi.toLowerCase();
    return companySuggestions.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 6);
  }, [kurumAdi, companySuggestions]);

  // Reset Form
  const resetForm = () => {
    setTarih(new Date().toISOString().split('T')[0]);
    setAssignedUserId(currentUser ? currentUser.id : users[0]?.id || '');
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
    setRezervasyonFiyatTipi('TEK_FIYAT');
    setRezervasyonBirimFiyat('');
    setRezervasyonToplamSaniye('');
    setRezervasyonOptSaniye('');
    setRezervasyonOptFiyat('');
    setRezervasyonPtSaniye('');
    setRezervasyonPtFiyat('');
    setRezervasyonVade('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Synchronize current user on open
  useEffect(() => {
    if (isOpen && currentUser) {
      if (!isSuperAdmin) {
        setAssignedUserId(currentUser.id);
      }
    }
  }, [currentUser, isOpen, isSuperAdmin]);

  // Calculations for Reservation Totals
  const calculatedReservation = useMemo(() => {
    if (rezervasyonFiyatTipi === 'PT_OPT') {
      const optSn = Number(rezervasyonOptSaniye) || 0;
      const optPrice = Number(rezervasyonOptFiyat) || 0;
      const ptSn = Number(rezervasyonPtSaniye) || 0;
      const ptPrice = Number(rezervasyonPtFiyat) || 0;

      const totalSn = optSn + ptSn;
      const totalAmount = (optSn * optPrice) + (ptSn * ptPrice);
      const avgUnitPrice = totalSn > 0 ? totalAmount / totalSn : 0;

      return {
        totalSaniye: totalSn,
        totalAmount,
        unitPrice: Math.round(avgUnitPrice * 100) / 100,
        optAmount: optSn * optPrice,
        ptAmount: ptSn * ptPrice,
      };
    } else {
      const sn = Number(rezervasyonToplamSaniye) || 0;
      const price = Number(rezervasyonBirimFiyat) || 0;
      return {
        totalSaniye: sn,
        totalAmount: sn * price,
        unitPrice: price,
        optAmount: 0,
        ptAmount: 0,
      };
    }
  }, [
    rezervasyonFiyatTipi, 
    rezervasyonBirimFiyat, 
    rezervasyonToplamSaniye, 
    rezervasyonOptSaniye, 
    rezervasyonOptFiyat, 
    rezervasyonPtSaniye, 
    rezervasyonPtFiyat
  ]);

  // Handle selecting an autocomplete suggestion
  const handleSelectSuggestion = (item: typeof companySuggestions[0]) => {
    setKurumAdi(toTurkishUpper(item.name));
    if (item.yetkili) setYetkili(toTurkishUpper(item.yetkili));
    if (item.telefon) setYetkiliTelefon(item.telefon);
    if (item.eposta) setYetkiliEposta(toCleanEmail(item.eposta));
    if (item.tip) setKurumTuru(item.tip);
    setMusteriDurumu('Mevcut');
    setShowSuggestions(false);
  };

  // Filtered Reports Calculation
  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    return localReports.filter((r) => {
      // 0. Status Filter (Active vs Completed/Archived)
      if (statusFilter === 'active' && r.tamamlandi) {
        return false;
      }
      if (statusFilter === 'completed' && !r.tamamlandi) {
        return false;
      }

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
  }, [localReports, statusFilter, selectedUserFilter, selectedOrgFilter, selectedContactFilter, timeRange, customStartDate, customEndDate, searchQuery]);


  // Aggregated KPI Metrics
  const totalReportsCount = filteredReports.length;
  
  const teklifReports = filteredReports.filter((r) => r.teklif_verildi);
  const totalTeklifTutari = teklifReports.reduce((sum, r) => sum + (r.teklif_tutari || 0), 0);

  const satisReports = filteredReports.filter((r) => r.satis_yapildi);
  const totalSatisTutari = satisReports.reduce((sum, r) => sum + (r.satis_tutari || 0), 0);

  const rezervasyonReports = filteredReports.filter((r) => r.rezervasyon_var);
  const totalRezervasyonAdet = rezervasyonReports.reduce((sum, r) => sum + (r.rezervasyon_gelen || 1), 0);
  const totalRezervasyonSaniye = rezervasyonReports.reduce((sum, r) => sum + (r.rezervasyon_toplam_saniye || 0), 0);
  const totalRezervasyonTutari = rezervasyonReports.reduce((sum, r) => sum + getReportRezAmount(r), 0);

  // --- EXECUTIVE SUMMARY MATRIX (Personel Bazlı Matris Tablosu) ---
  const executiveMatrix = useMemo(() => {
    // Filter by selected user if specific user selected, else list all team members with activity
    const targetUsers = selectedUserFilter !== 'all' 
      ? users.filter((u) => u.id === selectedUserFilter)
      : users.filter((u) => {
          if (isSuperAdmin || isViewer) return true;
          if (isManager) return u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN';
          return u.id === currentUser?.id;
        });

    return targetUsers.map((u) => {
      const userReports = filteredReports.filter((r) => r.user_id === u.id);

      const telCount = userReports.filter((r) => r.iletisim_turu === 'Telefon').length;
      const dijitalCount = userReports.filter((r) => r.iletisim_turu === 'Dijital Toplantı').length;
      const yuzyuzeCount = userReports.filter((r) => r.iletisim_turu === 'Yüzyüze Toplantı').length;
      const ziyaretCount = userReports.filter((r) => r.kurumsal_ziyaret || r.iletisim_turu === 'Kurumsal Ziyaret').length;
      const emailCount = userReports.filter((r) => r.iletisim_turu === 'E-posta').length;
      const totalActivities = userReports.length;

      const userTeklif = userReports.filter((r) => r.teklif_verildi);
      const teklifCount = userTeklif.length;
      const teklifSum = userTeklif.reduce((sum, r) => sum + (r.teklif_tutari || 0), 0);

      const userSatis = userReports.filter((r) => r.satis_yapildi);
      const satisCount = userSatis.length;
      const satisSum = userSatis.reduce((sum, r) => sum + (r.satis_tutari || 0), 0);

      const userRez = userReports.filter((r) => r.rezervasyon_var);
      const rezCount = userRez.reduce((sum, r) => sum + (r.rezervasyon_gelen || 1), 0);
      const rezSaniye = userRez.reduce((sum, r) => sum + (r.rezervasyon_toplam_saniye || 0), 0);
      const rezOptSaniye = userRez.reduce((sum, r) => sum + (r.rezervasyon_opt_saniye || 0), 0);
      const rezPtSaniye = userRez.reduce((sum, r) => sum + (r.rezervasyon_pt_saniye || 0), 0);
      const rezSum = userRez.reduce((sum, r) => sum + getReportRezAmount(r), 0);

      return {
        user: u,
        telCount,
        dijitalCount,
        yuzyuzeCount,
        ziyaretCount,
        emailCount,
        totalActivities,
        teklifCount,
        teklifSum,
        satisCount,
        satisSum,
        rezCount,
        rezSaniye,
        rezOptSaniye,
        rezPtSaniye,
        rezSum,
      };
    });
  }, [users, filteredReports, selectedUserFilter]);

  // Matrix Grand Totals
  const matrixTotals = useMemo(() => {
    return executiveMatrix.reduce(
      (acc, row) => ({
        telCount: acc.telCount + row.telCount,
        dijitalCount: acc.dijitalCount + row.dijitalCount,
        yuzyuzeCount: acc.yuzyuzeCount + row.yuzyuzeCount,
        ziyaretCount: acc.ziyaretCount + row.ziyaretCount,
        emailCount: acc.emailCount + row.emailCount,
        totalActivities: acc.totalActivities + row.totalActivities,
        teklifCount: acc.teklifCount + row.teklifCount,
        teklifSum: acc.teklifSum + row.teklifSum,
        satisCount: acc.satisCount + row.satisCount,
        satisSum: acc.satisSum + row.satisSum,
        rezCount: acc.rezCount + row.rezCount,
        rezSaniye: acc.rezSaniye + row.rezSaniye,
        rezOptSaniye: acc.rezOptSaniye + row.rezOptSaniye,
        rezPtSaniye: acc.rezPtSaniye + row.rezPtSaniye,
        rezSum: acc.rezSum + row.rezSum,
      }),
      {
        telCount: 0,
        dijitalCount: 0,
        yuzyuzeCount: 0,
        ziyaretCount: 0,
        emailCount: 0,
        totalActivities: 0,
        teklifCount: 0,
        teklifSum: 0,
        satisCount: 0,
        satisSum: 0,
        rezCount: 0,
        rezSaniye: 0,
        rezOptSaniye: 0,
        rezPtSaniye: 0,
        rezSum: 0,
      }
    );
  }, [executiveMatrix]);

  // Handle Form Submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kurumAdi || !yetkili) {
      setErrorMessage('Lütfen Kurum Adı ve Yetkili alanlarını doldurunuz.');
      return;
    }

    if (isViewer) {
      setErrorMessage('İzleme modundaki hesapların çalışma raporu ekleme yetkisi yoktur.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const effectiveUserId = isSuperAdmin ? assignedUserId : currentUser?.id;

      const payload = {
        tarih,
        user_id: effectiveUserId,
        kurum_adi: toTurkishUpper(kurumAdi),
        kurum_turu: kurumTuru,
        musteri_durumu: musteriDurumu,
        yetkili: toTurkishUpper(yetkili),
        yetkili_telefon: yetkiliTelefon,
        yetkili_eposta: toCleanEmail(yetkiliEposta),
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
        rezervasyon_gelen: rezervasyonVar ? Number(rezervasyonGelen) || 1 : 0,
        rezervasyon_turu: rezervasyonVar ? rezervasyonTuru : '',
        rezervasyon_fiyat_tipi: rezervasyonVar ? rezervasyonFiyatTipi : 'TEK_FIYAT',
        rezervasyon_opt_saniye: rezervasyonVar && rezervasyonFiyatTipi === 'PT_OPT' ? Number(rezervasyonOptSaniye) || 0 : 0,
        rezervasyon_opt_fiyat: rezervasyonVar && rezervasyonFiyatTipi === 'PT_OPT' ? Number(rezervasyonOptFiyat) || 0 : 0,
        rezervasyon_pt_saniye: rezervasyonVar && rezervasyonFiyatTipi === 'PT_OPT' ? Number(rezervasyonPtSaniye) || 0 : 0,
        rezervasyon_pt_fiyat: rezervasyonVar && rezervasyonFiyatTipi === 'PT_OPT' ? Number(rezervasyonPtFiyat) || 0 : 0,
        rezervasyon_birim_fiyat: rezervasyonVar ? calculatedReservation.unitPrice : 0,
        rezervasyon_toplam_saniye: rezervasyonVar ? calculatedReservation.totalSaniye : 0,
        rezervasyon_vade: (rezervasyonVar || satisYapildi) ? (rezervasyonVade || '') : '',
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

      // Optimistically add report directly to localReports state
      if (data.report) {
        setLocalReports((prev) => [data.report, ...prev.filter((r) => r.id !== data.report.id)]);
      }

      setSuccessMessage('Çalışma raporu başarıyla sisteme işlendi.');
      resetForm();
      if (onRefresh) onRefresh();

      setTimeout(() => {
        setActiveTab('reports');
        setSuccessMessage('');
      }, 600);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Kayıt sırasında bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Complete / Archive (With sync to associated deal)
  const handleToggleComplete = async (report: WorkReport) => {
    if (isViewer) {
      alert('İzleme modundaki hesapların işlem yapma yetkisi yoktur.');
      return;
    }

    const newStatus = !report.tamamlandi;

    // 1. Optimistic Instant UI Update (Immediate response on screen)
    setLocalReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, tamamlandi: newStatus } : r))
    );

    try {
      const res = await fetch('/api/work-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, tamamlandi: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      } else {
        // Revert optimistic update on failure
        setLocalReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, tamamlandi: report.tamamlandi } : r))
        );
        alert(data.error || 'İşlem güncellenemedi.');
      }
    } catch {
      // Revert optimistic update on error
      setLocalReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, tamamlandi: report.tamamlandi } : r))
      );
      alert('Güncelleme sırasında hata oluştu.');
    }
  };

  // Handle Delete Report (With strict role & ownership check)
  const handleDeleteReport = async (report: WorkReport) => {
    if (isViewer) {
      alert('İzleme modundaki hesapların çalışma raporu silme yetkisi yoktur.');
      return;
    }

    if (!isSuperAdmin && report.user_id !== currentUser?.id) {
      alert('Yalnızca kendi girdiğiniz çalışma raporlarını silebilirsiniz.');
      return;
    }

    if (!confirm(`"${report.kurum_adi}" için girilen çalışma raporunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    // Optimistic Instant Removal
    setLocalReports((prev) => prev.filter((r) => r.id !== report.id));

    try {
      const res = await fetch(`/api/work-reports?id=${report.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      } else {
        setLocalReports(workReports);
        alert(data.error || 'Silinemedi.');
      }
    } catch {
      setLocalReports(workReports);
      alert('Silme sırasında hata oluştu.');
    }
  };

  // Handle Print (Landscape A4)
  const handlePrint = () => {
    window.print();
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (activeTab === 'matrix') {
      const matrixRows = executiveMatrix.map((r) => ({
        'Grup Üyesi': r.user.name,
        'Rol': r.user.role === 'SALES_MANAGER' ? 'Satış Yöneticisi' : 'Satış Temsilcisi',
        'Telefon': r.telCount,
        'Dijital Toplantı': r.dijitalCount,
        'Yüzyüze Toplantı': r.yuzyuzeCount,
        'Kurumsal Ziyaret': r.ziyaretCount,
        'E-posta': r.emailCount,
        'Toplam Temas': r.totalActivities,
        'Teklif (Adet)': r.teklifCount,
        'Teklif Tutarı (TL)': r.teklifSum,
        'Satış (Adet)': r.satisCount,
        'Satış Tutarı (TL)': r.satisSum,
        'Rezervasyon (Adet)': r.rezCount,
        'Rezervasyon Kuşak Saniyesi': r.rezSaniye,
        'Rezervasyon Tutarı (TL)': r.rezSum,
      }));

      exportToExcel(matrixRows, `TVCRM_Yonetici_Faaliyet_Ozeti_${new Date().toISOString().split('T')[0]}`);
      return;
    }

    const exportRows = filteredReports.filter((r) => {
      if (isSuperAdmin || isViewer) return true; // Marka Merkezi ve Misafir yönetici tüm raporları alır
      if (isManager) {
        // Yönetici kendisi ve temsilciler için rapor alır (Admin'leri hariç tut)
        const userRole = users.find(u => u.id === r.user_id)?.role;
        return userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN';
      }
      return r.user_id === currentUser?.id; // Temsilci sadece kendisi için rapor alır
    }).map((r) => ({
      'Tarih': formatDate(r.tarih),
      'Grup Üyesi': r.user?.name || '',
      'Kurum': r.kurum_adi,
      'Kurum Türü': r.kurum_turu,
      'Müşteri Durumu': r.musteri_durumu || 'Yeni Müşteri',
      'Yetkili': r.yetkili,
      'Telefon': r.yetkili_telefon || '-',
      'E-posta': r.yetkili_eposta || '-',
      'İletişim Türü': r.iletisim_turu,
      'Reklam Türü': r.reklam_turu || 'Reklam',
      'TV Kanalı': r.tv_kanali || 'Bi Kanal',
      'Görüşme Amacı & Not': r.gorusme_amaci,
      'Vade': r.rezervasyon_vade || '-',
      'Teklif Verildi': r.teklif_verildi ? 'Evet' : 'Hayır',
      'Teklif Tutarı (TL)': r.teklif_tutari || 0,
      'Teklif İhtimal': r.teklif_ihtimal || '-',
      'Satış Yapıldı': r.satis_yapildi ? 'Evet' : 'Hayır',
      'Satış Türü': r.satis_turu || '-',
      'Satış Tutarı (TL)': r.satis_tutari || 0,
      'Kurumsal Ziyaret': r.kurumsal_ziyaret ? 'Evet' : 'Hayır',
      'Rezervasyon': r.rezervasyon_var ? 'Evet' : 'Hayır',
      'Rezervasyon Gelen': r.rezervasyon_gelen || 0,
      'Rezervasyon Türü': r.rezervasyon_turu || '-',
      'Fiyat Tipi': r.rezervasyon_fiyat_tipi || 'TEK_FIYAT',
      'Rezervasyon Tutarı (TL)': getReportRezAmount(r),
      'OPT Saniye': r.rezervasyon_opt_saniye || 0,
      'OPT Birim Fiyat (TL)': r.rezervasyon_opt_fiyat || 0,
      'PT Saniye': r.rezervasyon_pt_saniye || 0,
      'PT Birim Fiyat (TL)': r.rezervasyon_pt_fiyat || 0,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn work-report-modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col work-report-modal-card">
        
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
                Grup Üyeleri Günlük, Haftalık ve Dönemsel Faaliyet, Teklif, Satış ve PT/OPT Rezervasyon Kayıtları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title="Yatay A4 Yazdır / PDF İndir"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yatay A4 Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (No-Print) */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print flex-wrap gap-2">
          <div className="flex gap-2">
            {/* Tab 1: Detaylı Rapor Listesi */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'reports'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Faaliyet Kayıtları ({filteredReports.length})</span>
            </button>

            {/* Tab 2: Yönetici Faaliyet Özeti (A4 Matris) - Sadece Yönetim ve Misafir */}
            {canSeeMatrix && (
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'matrix'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-4 h-4 text-indigo-600" />
              <span>Yönetici Özeti (A4 Matris)</span>
            </button>
            )}

            {/* Tab 3: Yeni Çalışma Kaydet (Available for rep, manager, admin; hidden for viewer) */}
            {!isViewer && (
              <button
                type="button"
                onClick={() => { setActiveTab('new_entry'); resetForm(); }}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                  activeTab === 'new_entry'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Yeni Görüşme / Çalışma Kaydet</span>
              </button>
            )}
          </div>

          {isViewer && (
            <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-purple-600" />
              İzleme Modu: Misafir/Yönetim hesabı salt okunur moddadır.
            </span>
          )}
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" id="print-work-report-area">
          
          {/* TAB 1: ÇALIŞMA RAPORLARI LİSTESİ VE ANALİZİ */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              
              {/* PRINT HEADER ONLY VISIBLE ON PAPER / PDF */}
              <div className="hidden print:block border-b-2 border-slate-900 pb-2 mb-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-sm sm:text-base font-black tracking-tight font-mono text-slate-900">
                      B! KANAL & SIFIR TV - GÜNLÜK VE DÖNEMSEL KURUMSAL ÇALIŞMA RAPORU
                    </h1>
                    <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                      Marka ve Büyüme Merkezi • Reklam Satış Grup Direktörlüğü
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-mono">
                    <div><strong>Rapor Tarihi:</strong> {new Date().toLocaleDateString('tr-TR')}</div>
                    <div><strong>Filtre Kapsamı:</strong> {selectedUserFilter === 'all' ? 'Tüm Grup Üyeleri' : getRepName(selectedUserFilter)}</div>
                    <div><strong>Zaman Dilimi:</strong> {timeRange === 'today' ? 'Bugün' : timeRange === 'this_week' ? 'Bu Hafta' : timeRange === 'this_month' ? 'Bu Ay' : 'Tüm Dönem'}</div>
                  </div>
                </div>
              </div>

              {/* FILTER BAR (No-Print) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 no-print">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 0. Status Filter: Aktif / Tamamlanan / Tümü */}
                    <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                          statusFilter === 'active' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Aktif İşler</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('completed')}
                        className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                          statusFilter === 'completed' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tamamlananlar / Arşiv</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                          statusFilter === 'all' ? 'bg-slate-700 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tümü
                      </button>
                    </div>

                    {/* 1. Time Range Quick Buttons */}
                    <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setTimeRange('today')}
                        className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                          timeRange === 'today' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bugün
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeRange('this_week')}
                        className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                          timeRange === 'this_week' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bu Hafta
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeRange('this_month')}
                        className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                          timeRange === 'this_month' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bu Ay
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeRange('all')}
                        className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                          timeRange === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tümü
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeRange('custom')}
                        className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                          timeRange === 'custom' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Özel Tarih
                      </button>
                    </div>
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

                {/* Second Filter Row: Grup Üyesi, Kurum Türü, İletişim Türü */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-xs">
                  
                  {/* Grup Üyesi */}
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
                          {u.name} ({u.role === 'SALES_MANAGER' ? 'Yönetici' : u.role === 'ADMIN' ? 'Admin' : 'Temsilci'})
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

              {/* KPI KONSOLU */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-1.5 print:mb-2 print-avoid-break">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl print:p-1.5 print:rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 print:text-[8px]">Toplam Temas</span>
                  <div className="text-lg font-mono font-black text-slate-900 mt-1 print:text-xs print:mt-0.5">{totalReportsCount} Kayıt</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 print:hidden">Faaliyet sayısı</div>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl print:p-1.5 print:rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-sky-700 print:text-[8px]">Verilen Teklifler</span>
                  <div className="text-lg font-mono font-black text-sky-800 mt-1 print:text-xs print:mt-0.5">{formatCurrency(totalTeklifTutari)}</div>
                  <div className="text-[10px] text-sky-700 font-mono mt-0.5 print:hidden">{teklifReports.length} Teklif Sunuldu</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl print:p-1.5 print:rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 print:text-[8px]">Gerçekleşen Satış</span>
                  <div className="text-lg font-mono font-black text-emerald-700 mt-1 print:text-xs print:mt-0.5">{formatCurrency(totalSatisTutari)}</div>
                  <div className="text-[10px] text-emerald-800 font-mono mt-0.5 print:hidden">{satisReports.length} Satış Kapatıldı</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl print:p-1.5 print:rounded-lg">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800 print:text-[8px]">Rezervasyonlar</span>
                  <div className="text-lg font-mono font-black text-amber-800 mt-1 print:text-xs print:mt-0.5">{formatCurrency(totalRezervasyonTutari)}</div>
                  <div className="text-[10px] text-amber-700 font-mono mt-0.5 print:hidden">{totalRezervasyonAdet} Adet • {totalRezervasyonSaniye} sn</div>
                </div>
              </div>

              {/* DETAYLI ÇALIŞMA RAPORU TABLOSU */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs print:border-slate-300 print:rounded-none">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:px-2 print:py-1">
                  <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2 print:text-[9px]">
                    <FileCheck className="w-4 h-4 text-sky-600 print:w-3 print:h-3" />
                    Faaliyet ve Görüşme Kayıtları Listesi
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono print:text-[8px]">
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
                        <th className="py-2.5 px-3 whitespace-nowrap">Durum</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tür</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Yetkili</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">İletişim</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Kanal</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tutar (₺)</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Rezervasyon / Kuşak</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">Vade</th>
                        <th className="py-2.5 px-3 text-right no-print">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.map((report) => {
                        const isOwner = report.user_id === currentUser?.id;
                        const canDelete = isSuperAdmin || isOwner;
                        const rezAmount = getReportRezAmount(report);

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

                            {/* Yeni / Mevcut / Tamamlandı Durumu */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                  report.musteri_durumu === 'Yeni Müşteri'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {report.musteri_durumu || 'Yeni Müşteri'}
                                </span>
                                {report.tamamlandi && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 font-mono">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Tamamlandı
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Kurum Türü */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                                {report.kurum_turu}
                              </span>
                            </td>

                            {/* Yetkili */}
                            <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap text-[11px]">
                              <div>{report.yetkili}</div>
                              {report.yetkili_telefon && (
                                <div className="text-[10px] text-slate-400 font-mono">{report.yetkili_telefon}</div>
                              )}
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

                            {/* TV Kanalı */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-bold text-slate-700">
                              {report.tv_kanali || 'Bi Kanal'}
                            </td>

                            {/* Tutar (₺) */}
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                              {(report.satis_yapildi && report.satis_tutari && report.satis_tutari > 0) ? (
                                <div>
                                  <span className="font-bold text-emerald-700">{formatCurrency(report.satis_tutari)}</span>
                                  <div className="text-[9px] text-emerald-600 font-sans font-medium">Satış</div>
                                </div>
                              ) : (report.teklif_verildi && report.teklif_tutari && report.teklif_tutari > 0) ? (
                                <div>
                                  <span className="font-bold text-sky-700">{formatCurrency(report.teklif_tutari)}</span>
                                  <div className="text-[9px] text-sky-600 font-sans font-medium">Teklif ({report.teklif_ihtimal || '%50'})</div>
                                </div>
                              ) : (report.rezervasyon_var && rezAmount > 0) ? (
                                <div>
                                  <span className="font-bold text-amber-800">{formatCurrency(rezAmount)}</span>
                                  <div className="text-[9px] text-amber-700 font-sans font-medium">Rezervasyon ({report.rezervasyon_toplam_saniye} sn)</div>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Rezervasyon / Kuşak Detayı */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-mono">
                              {report.rezervasyon_var ? (
                                <div>
                                  <div className="font-bold text-amber-800">
                                    {report.rezervasyon_toplam_saniye} sn ({report.rezervasyon_turu || 'Spot'})
                                  </div>
                                  <div className="text-[9.5px] text-slate-500">
                                    {report.rezervasyon_fiyat_tipi === 'PT_OPT' ? (
                                      <span>OPT: {report.rezervasyon_opt_fiyat}₺ ({report.rezervasyon_opt_saniye}s) | PT: {report.rezervasyon_pt_fiyat}₺ ({report.rezervasyon_pt_saniye}s)</span>
                                    ) : (
                                      <span>Birim: {report.rezervasyon_birim_fiyat} ₺/sn</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-sans">-</span>
                              )}
                            </td>

                            {/* Vade (Ödeme) */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-center font-mono text-[11px]">
                              {report.rezervasyon_vade ? (
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                                  {report.rezervasyon_vade}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* İşlemler (No-Print) */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap no-print">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isViewer && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleComplete(report)}
                                    className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border shadow-2xs ${
                                      report.tamamlandi
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                        : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                    }`}
                                    title={report.tamamlandi ? 'Tamamlanma durumunu geri al (Aktif yap)' : 'İşi Tamamla / Çıktı Alındı (Arşive Taşı)'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{report.tamamlandi ? 'Aktife Al' : 'Tamamla'}</span>
                                  </button>
                                )}

                                {canDelete && !isViewer && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReport(report)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Raporu Sil (Hatalı Giriş)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}

                      {filteredReports.length === 0 && (
                        <tr>
                          <td colSpan={12} className="text-center py-10 text-slate-400 font-mono text-xs">
                            SEÇİLEN KRİTERLERE UYGUN ÇALIŞMA RAPORU KAYDI BULUNAMADI
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: YÖNETİCİ FAALİYET ÖZETİ (A4 YATAY MATRİS RAPORU) */}
          {activeTab === 'matrix' && (
            <div className="space-y-2.5">
              
              {/* PRINT HEADER FOR MATRIX VIEW */}
              <div className="border-b-2 border-slate-900 pb-2 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-sm sm:text-base font-black tracking-tight font-mono text-slate-900">
                      B! KANAL & SIFIR TV - REKLAM SATIŞ DİREKTÖRLÜĞÜ FAALİYET RAPORU
                    </h1>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      Marka ve Büyüme Merkezi • Reklam Satış Grup Direktörlüğü Faaliyet İcmali
                    </p>
                  </div>
                  <div className="text-right text-[11px] font-mono">
                    <div><strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}</div>
                    <div><strong>Zaman Dilimi:</strong> {timeRange === 'today' ? 'Bugün' : timeRange === 'this_week' ? 'Bu Hafta' : timeRange === 'this_month' ? 'Bu Ay' : 'Tüm Dönem'}</div>
                  </div>
                </div>
              </div>

              {/* PERSONEL BAZLI KONSOLİDE FAALİYET VE SATIŞ MATRİSİ (COMPACT DESIGN FOR 9-10+ PEOPLE) */}
              <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-slate-900 text-white text-[9.5px] uppercase font-mono font-bold">
                    <tr>
                      <th className="py-1.5 px-2.5">Grup Üyesi (Personel)</th>
                      <th className="py-1.5 px-2 text-center">Telefon</th>
                      <th className="py-1.5 px-2 text-center">Dijital</th>
                      <th className="py-1.5 px-2 text-center">Yüzyüze</th>
                      <th className="py-1.5 px-2 text-center">Kurumsal Ziy.</th>
                      <th className="py-1.5 px-2 text-center bg-slate-800 text-amber-300">Toplam Temas</th>
                      <th className="py-1.5 px-2.5 text-right">Teklif (Adet / ₺)</th>
                      <th className="py-1.5 px-2.5 text-right text-emerald-300">Satış (Adet / ₺)</th>
                      <th className="py-1.5 px-2.5 text-right text-amber-300">Rezervasyon (₺ / sn)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {executiveMatrix.map((row) => (
                      <tr key={row.user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{row.user.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono font-normal">
                              ({row.user.role === 'SALES_MANAGER' ? 'Satış Yöneticisi' : row.user.role === 'ADMIN' ? 'Marka Merkezi' : 'Satış Temsilcisi'})
                            </span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">{row.telCount}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">{row.dijitalCount}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">{row.yuzyuzeCount}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-purple-700">{row.ziyaretCount}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-black text-slate-900 bg-slate-50">{row.totalActivities}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          <span className="font-bold text-sky-700">{formatCurrency(row.teklifSum)}</span>
                          <span className="text-[9.5px] text-slate-400 ml-1">({row.teklifCount})</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          <span className="font-black text-emerald-700">{formatCurrency(row.satisSum)}</span>
                          <span className="text-[9.5px] text-emerald-600 ml-1">({row.satisCount})</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          <div className="font-bold text-amber-800">{formatCurrency(row.rezSum)}</div>
                          <div className="text-[9.5px] text-slate-500 font-normal">{row.rezSaniye} sn ({row.rezCount} ad.)</div>
                        </td>
                      </tr>
                    ))}

                    {/* DİP TOPLAM (GRAND TOTAL ROW) */}
                    <tr className="bg-slate-100 font-mono text-[11px] font-black border-t-2 border-slate-900 text-slate-900">
                      <td className="py-2 px-2.5 uppercase tracking-wider">GENEL DİP TOPLAM:</td>
                      <td className="py-2 px-2 text-center text-slate-900">{matrixTotals.telCount}</td>
                      <td className="py-2 px-2 text-center text-slate-900">{matrixTotals.dijitalCount}</td>
                      <td className="py-2 px-2 text-center text-slate-900">{matrixTotals.yuzyuzeCount}</td>
                      <td className="py-2 px-2 text-center text-purple-900">{matrixTotals.ziyaretCount}</td>
                      <td className="py-2 px-2 text-center bg-slate-200 text-slate-950 font-black">{matrixTotals.totalActivities}</td>
                      <td className="py-2 px-2.5 text-right text-sky-800">
                        {formatCurrency(matrixTotals.teklifSum)} <span className="text-[9.5px] font-normal">({matrixTotals.teklifCount})</span>
                      </td>
                      <td className="py-2 px-2.5 text-right text-emerald-800">
                        {formatCurrency(matrixTotals.satisSum)} <span className="text-[9.5px] font-normal">({matrixTotals.satisCount})</span>
                      </td>
                      <td className="py-2 px-2.5 text-right text-amber-900 font-mono">
                        <div className="font-black text-amber-900">{formatCurrency(matrixTotals.rezSum)}</div>
                        <div className="text-[9.5px] font-normal">{matrixTotals.rezSaniye} sn ({matrixTotals.rezCount} ad.)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TV REKLAM KUŞAK & REZERVASYON DAĞILIMI ANALİZ KUTULARI */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 print:gap-2 print:pt-1 print-avoid-break">
                <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg print:p-1.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase text-slate-500 block print:text-[8px]">Kuşak Rezervasyon Özeti</span>
                  <div className="text-xs font-mono font-bold text-amber-800 mt-0.5 print:text-[9.5px]">
                    Rezervasyon Hacmi: <strong>{formatCurrency(matrixTotals.rezSum)}</strong>
                  </div>
                  <div className="text-[10px] text-slate-700 font-mono mt-0.5 print:text-[8px]">
                    Toplam: {matrixTotals.rezSaniye} sn ({matrixTotals.rezCount} Adet) • OPT: {matrixTotals.rezOptSaniye}s | PT: {matrixTotals.rezPtSaniye}s
                  </div>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 rounded-lg print:p-1.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase text-emerald-800 block print:text-[8px]">Kapanan Ciro & Başarı</span>
                  <div className="text-xs font-mono font-bold text-emerald-800 mt-0.5 print:text-[9.5px]">
                    Toplam Satış: {formatCurrency(matrixTotals.satisSum)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono mt-0.5 print:text-[8px]">
                    {matrixTotals.satisCount} Başarılı Anlaşma
                  </div>
                </div>

                <div className="border border-sky-200 bg-sky-50/50 px-3 py-1.5 rounded-lg print:p-1.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase text-sky-800 block print:text-[8px]">Görüşülen & Teklif Portföyü</span>
                  <div className="text-xs font-mono font-bold text-sky-800 mt-0.5 print:text-[9.5px]">
                    Teklif Havuzu: {formatCurrency(matrixTotals.teklifSum)}
                  </div>
                  <div className="text-[10px] text-sky-700 font-mono mt-0.5 print:text-[8px]">
                    {matrixTotals.totalActivities} Toplam Görüşme Teması
                  </div>
                </div>
              </div>

              {/* PRINT FOOTER / SIGNATURE BLOCK (Visible on matrix print) */}
              <div className="grid grid-cols-3 gap-6 pt-3 mt-2 border-t border-slate-300 text-center font-mono text-[11px] print:pt-2 print:mt-2 print:text-[9px] print-avoid-break">
                <div>
                  <div className="font-bold text-slate-900">Raporu Hazırlayan</div>
                  <div className="text-slate-600 text-[10px] mt-0.5 print:text-[8px]">{currentUser?.name || 'Sistem Kullanıcısı'}</div>
                  <div className="mt-3 border-b border-slate-400 w-24 mx-auto"></div>
                  <div className="text-[9px] text-slate-400 mt-0.5 print:text-[7.5px]">İmza</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Reklam Satış Grup Direktörü</div>
                  <div className="text-slate-600 text-[10px] mt-0.5 print:text-[8px]">İnceleme & Kontrol</div>
                  <div className="mt-3 border-b border-slate-400 w-24 mx-auto"></div>
                  <div className="text-[9px] text-slate-400 mt-0.5 print:text-[7.5px]">İmza</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Marka Merkezi Onayı</div>
                  <div className="text-slate-600 text-[10px] mt-0.5 print:text-[8px]">Yönetim / Onay</div>
                  <div className="mt-3 border-b border-slate-400 w-24 mx-auto"></div>
                  <div className="text-[9px] text-slate-400 mt-0.5 print:text-[7.5px]">Onay & Mühür</div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: YENİ GÖRÜŞME / ÇALIŞMA RAPORU GİRİŞ FORMU */}
          {activeTab === 'new_entry' && (
            <form onSubmit={handleSubmitReport} className="space-y-4 max-w-3xl mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-sm text-slate-900">YENİ ÇALIŞMA RAPORU GİRİŞİ</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Yapılan görüşmeyi, teklif, satış veya PT/OPT rezervasyonunu kaydedin</p>
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

                {/* 2. Grup Üyesi / Personel (Admin için seçilebilir, Temsilci ve Yönetici için kendi ID'sine kilitli) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    Grup Üyesi / Personel *
                  </label>
                  {!isSuperAdmin ? (
                    <div className="w-full text-xs px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-800 font-semibold flex items-center justify-between select-none">
                      <span>{currentUser?.name || 'Giriş Yapan Kullanıcı'}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-200/80 px-2 py-0.5 rounded font-bold">Otomatik</span>
                    </div>
                  ) : (
                    <select
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs font-semibold cursor-pointer"
                    >
                      {users.length > 0 ? (
                        users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role === 'SALES_MANAGER' ? 'Yönetici' : u.role === 'ADMIN' ? 'Marka Merkezi' : 'Satış Temsilcisi'})
                          </option>
                        ))
                      ) : currentUser ? (
                        <option value={currentUser.id}>{currentUser.name}</option>
                      ) : null}
                    </select>
                  )}
                </div>

                {/* 3. Kurum / Firma Adı - WITH AUTOCOMPLETE */}
                <div className="space-y-1 relative" ref={autocompleteRef}>
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
                      Kurum / Firma Adı *
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Otomatik tamamlama destekli</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: ZİRAAT BANKASI, VESTEL..."
                    value={kurumAdi}
                    onChange={(e) => {
                      setKurumAdi(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs uppercase"
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase">
                        Kayıtlı Kurumlar (Mükerrer kaydı önlemek için seçin):
                      </div>
                      {filteredSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 transition flex items-center justify-between text-xs cursor-pointer group"
                        >
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-sky-700">{item.name}</span>
                            {item.yetkili && (
                              <span className="text-[10px] text-slate-500 ml-2 font-mono">• {item.yetkili}</span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {item.tip}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Kurum Türü */}
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

                {/* 4.5. Müşteri Durumu */}
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
                    placeholder="Örn: AHMET YILMAZ"
                    value={yetkili}
                    onChange={(e) => setYetkili(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs uppercase"
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
                    placeholder="0555 000 0000"
                    value={yetkiliTelefon}
                    onChange={(e) => setYetkiliTelefon(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>

                {/* 5.2 Yetkili E-posta */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Yetkili E-posta (Otomatik küçük harf)
                  </label>
                  <input
                    type="email"
                    placeholder="yetkili@firma.com"
                    value={yetkiliEposta}
                    onChange={(e) => setYetkiliEposta(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs lowercase"
                  />
                </div>

                {/* 6. İletişim Türü */}
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs resize-none uppercase"
                  />
                </div>

                {/* 8. Sonuç */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-700 font-bold">
                    Sonuç
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: TEKLİF İSTENDİ, GÖRÜŞME DEVAM EDİYOR..."
                    value={sonuc}
                    onChange={(e) => setSonuc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 shadow-2xs uppercase"
                  />
                </div>

              </div>

              {/* OPSİYONEL ALANLAR: TEKLİF, SATIŞ, REZERVASYON */}
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
                          <option value="%25">%25 (Düşük İhtimal)</option>
                          <option value="%50">%50 (Orta İhtimal)</option>
                          <option value="%75">%75 (Yüksek İhtimal)</option>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
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

                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Vade (Ödeme)</label>
                        <select
                          value={rezervasyonVade}
                          onChange={(e) => setRezervasyonVade(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="">Seçiniz...</option>
                          <option value="Nakit">Nakit</option>
                          <option value="30 Gün">30 Gün</option>
                          <option value="60 Gün">60 Gün</option>
                          <option value="90 Gün">90 Gün</option>
                          <option value="120 Gün">120 Gün</option>
                          <option value="150 Gün">150 Gün</option>
                          <option value="180 Gün">180 Gün</option>
                          <option value="Özel">Özel</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* TV REKLAM REZERVASYONU BÖLÜMÜ (PT / OPT / TEK FİYAT DESTEKLİ) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
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
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setRezervasyonFiyatTipi('TEK_FIYAT')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            rezervasyonFiyatTipi === 'TEK_FIYAT' 
                              ? 'bg-slate-100 border-slate-200 text-slate-700' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Tek Fiyat
                        </button>
                        <button
                          type="button"
                          onClick={() => setRezervasyonFiyatTipi('PT_OPT')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            rezervasyonFiyatTipi === 'PT_OPT' 
                              ? 'bg-amber-600 border-amber-700 text-white shadow-sm' 
                              : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          OPT & PT
                        </button>
                      </div>
                    )}
                  </div>

                  {rezervasyonVar && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      
                      {/* Vade Seçimi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Vade (Ödeme)</label>
                          <select
                            value={rezervasyonVade}
                            onChange={(e) => setRezervasyonVade(e.target.value)}
                            className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500 font-semibold"
                          >
                            <option value="">Seçiniz...</option>
                            <option value="Nakit">Nakit</option>
                            <option value="30 Gün">30 Gün</option>
                            <option value="60 Gün">60 Gün</option>
                            <option value="90 Gün">90 Gün</option>
                            <option value="120 Gün">120 Gün</option>
                            <option value="150 Gün">150 Gün</option>
                            <option value="180 Gün">180 Gün</option>
                            <option value="Özel">Özel</option>
                          </select>
                        </div>
                      </div>

                      {/* Rezervasyon Adet ve Türü */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Rezervasyon Adedi</label>
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
                          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Rezervasyon Türü</label>
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
                      </div>

                      {/* SEÇENEK 1: TEK FİYAT MODU */}
                      {rezervasyonFiyatTipi === 'TEK_FIYAT' && (
                        <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80">
                          <div>
                            <label className="text-[10px] font-mono uppercase text-amber-800 font-bold">Tek Birim Fiyat (₺/sn)</label>
                            <input
                              type="number"
                              placeholder="40"
                              value={rezervasyonBirimFiyat}
                              onChange={(e) => setRezervasyonBirimFiyat(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono uppercase text-amber-800 font-bold">Toplam Saniye</label>
                            <input
                              type="number"
                              placeholder="30"
                              value={rezervasyonToplamSaniye}
                              onChange={(e) => setRezervasyonToplamSaniye(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* SEÇENEK 2: PT / OPT AYRI KUŞAK MODU */}
                      {rezervasyonFiyatTipi === 'PT_OPT' && (
                        <div className="space-y-2.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* OPT Gündüz Kuşağı */}
                            <div>
                              <label className="text-[10px] font-mono uppercase text-amber-800 font-bold">OPT</label>
                              <input
                                type="number"
                                placeholder="20"
                                value={rezervasyonOptSaniye}
                                onChange={(e) => setRezervasyonOptSaniye(e.target.value)}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono uppercase text-amber-800 font-bold">OPT Birim Fiyat (₺)</label>
                              <input
                                type="number"
                                placeholder="35"
                                value={rezervasyonOptFiyat}
                                onChange={(e) => setRezervasyonOptFiyat(e.target.value)}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none"
                              />
                            </div>

                            {/* PT Akşam Kuşağı */}
                            <div>
                              <label className="text-[10px] font-mono uppercase text-amber-800 font-bold">PT</label>
                              <input
                                type="number"
                                placeholder="10"
                                value={rezervasyonPtSaniye}
                                onChange={(e) => setRezervasyonPtSaniye(e.target.value)}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono uppercase text-amber-800 font-bold">PT Birim Fiyat (₺)</label>
                              <input
                                type="number"
                                placeholder="50"
                                value={rezervasyonPtFiyat}
                                onChange={(e) => setRezervasyonPtFiyat(e.target.value)}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Otomatik Hesaplanan Rezervasyon Özeti */}
                      <div className="flex flex-wrap items-center justify-between text-xs bg-slate-100 px-3 py-2 rounded-lg font-mono">
                        <span className="text-slate-600 font-bold">
                          Hesaplanan Kuşak: <strong className="text-slate-900">{calculatedReservation.totalSaniye} sn</strong> Toplam
                        </span>
                        <span className="text-amber-800 font-bold">
                          Rezervasyon Tutarı: <strong className="text-emerald-700">{formatCurrency(calculatedReservation.totalAmount)}</strong>
                        </span>
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
            Aktif Kullanıcı: <strong className="text-slate-800">{currentUser?.name || 'Marka Merkezi'}</strong>
            <span className="mx-1.5">•</span>
            Rol: <strong className="text-sky-700">
              {currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' 
                ? 'Marka Merkezi' 
                : currentUser?.role === 'SALES_MANAGER' 
                ? 'Satış Yöneticisi' 
                : currentUser?.role === 'VIEWER'
                ? 'Yönetim Katı / Misafir'
                : 'Satış Temsilcisi'}
            </strong>
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

