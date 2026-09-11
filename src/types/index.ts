export type UserRole = 'SALES_REP' | 'SALES_MANAGER' | 'ADMIN';

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
  target: number;
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
  tahmini_kapanis_tarihi: Date | string | null;
  ihtimal_derecesi: string;
  asama: string;
  not: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  musteri?: Client;
}
