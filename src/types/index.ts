export type UserRole = 'SALES_REP' | 'SALES_MANAGER' | 'ADMIN' | 'VIEWER';

export type CustomerType = 'Kamu' | 'Kurumsal' | 'KOBİ' | 'Ajans' | 'Diğer';

export type TVChannel = 'Bi Kanal' | 'Sıfır TV';

export type DealProbability = 'Kesin' | 'Yüksek' | 'Orta' | 'Düşük';

export type DealStage =
  | 'YENİ LEAD'
  | 'GÖRÜŞME'
  | 'TEKLİF'
  | 'TAKİP'
  | 'PAZARLIK'
  | 'ONAY'
  | 'SATIŞ'
  | 'YAYIN'
  | 'TAHSİLAT';

export const STAGES: DealStage[] = [
  'YENİ LEAD',
  'GÖRÜŞME',
  'TEKLİF',
  'TAKİP',
  'PAZARLIK',
  'ONAY',
  'SATIŞ',
  'YAYIN',
  'TAHSİLAT',
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  target?: number;
  phone?: string | null;
  avatar?: string | null;
}

export interface Client {
  id: string;
  firma_adi: string;
  yetkili_kisi: string;
  telefon: string;
  eposta?: string | null;
  musteri_tipi: string;
  satis_temsilcisi_id: string;
  sonraki_takip_tarihi: Date | string;
  satis_temsilcisi?: User;
  deals?: Deal[];
  createdAt?: Date | string;
}

export interface Deal {
  id: string;
  musteri_id: string;
  kanal: string;
  teklif_tutari: number;
  yayin_donemi: string;
  baslangic_tarihi?: Date | string | null;
  bitis_tarihi?: Date | string | null;
  tahmini_kapanis_tarihi: Date | string | null;
  ihtimal_derecesi: string;
  asama: string;
  is_archived?: boolean;
  not: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  musteri?: Client;
}

export type WorkReportOrgType = 'Marka' | 'Ajans' | 'KOBİ' | 'Kamu';

export type WorkReportContactType = 
  | 'Telefon'
  | 'E-posta'
  | 'Yüzyüze Toplantı'
  | 'Dijital Toplantı'
  | 'Kurumsal Ziyaret';

export type WorkReportSaleType = 'Spot Reklam' | 'Alt Bant Reklam' | 'Sponsorluk';

export type WorkReportReservationType = 'Spot' | 'Alt Bant' | 'Sponsorluk' | 'Kamu Spotu';

export type WorkReportCustomerStatus = 'Yeni Müşteri' | 'Mevcut';

export type WorkReportAdType = 'Reklam' | 'Barter';

export interface WorkReport {
  id: string;
  user_id: string;
  user?: User;
  tarih: Date | string;
  kurum_adi: string;
  kurum_turu: string;
  musteri_durumu: string;
  yetkili: string;
  yetkili_telefon: string;
  yetkili_eposta: string;
  iletisim_turu: string;
  reklam_turu: string;
  tv_kanali: string;
  gorusme_amaci: string;
  sonuc: string;
  teklif_verildi: boolean;
  teklif_tutari?: number | null;
  teklif_ihtimal?: string | null;
  satis_yapildi: boolean;
  satis_turu?: string | null;
  satis_tutari?: number | null;
  kurumsal_ziyaret: boolean;
  rezervasyon_var: boolean;
  rezervasyon_gelen?: number | null;
  rezervasyon_turu?: string | null;
  rezervasyon_fiyat_tipi?: 'TEK_FIYAT' | 'PT_OPT' | string | null;
  rezervasyon_opt_saniye?: number | null;
  rezervasyon_opt_fiyat?: number | null;
  rezervasyon_pt_saniye?: number | null;
  rezervasyon_pt_fiyat?: number | null;
  rezervasyon_birim_fiyat?: number | null;
  rezervasyon_toplam_saniye?: number | null;
  rezervasyon_vade?: string | null;
  deal_id?: string | null;
  tamamlandi?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

