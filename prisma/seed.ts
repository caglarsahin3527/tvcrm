import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding database with enriched brief data & auth accounts...');

  // Clean old records
  await prisma.deal.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users (Roles: SALES_REP, SALES_MANAGER, ADMIN)
  const rep1 = await prisma.user.create({
    data: {
      name: 'Ahmet Yılmaz',
      email: 'ahmet@tvcrm.com',
      password: hashPassword('rep123'),
      role: 'SALES_REP',
      target: 600000,
      phone: '0532 100 2030',
    },
  });

  const rep2 = await prisma.user.create({
    data: {
      name: 'Elif Demir',
      email: 'elif@tvcrm.com',
      password: hashPassword('rep123'),
      role: 'SALES_REP',
      target: 500000,
      phone: '0533 200 3040',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Mehmet Kaya',
      email: 'mehmet@tvcrm.com',
      password: hashPassword('manager123'),
      role: 'SALES_MANAGER',
      target: 1200000,
      phone: '0535 300 4050',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Ayşe Yıldız (Genel Müdür)',
      email: 'admin@tvcrm.com',
      password: hashPassword('admin123'),
      role: 'ADMIN',
      target: 2500000,
      phone: '0530 500 6070',
    },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const overdue3Days = new Date(today);
  overdue3Days.setDate(today.getDate() - 3);
  const overdue2Days = new Date(today);
  overdue2Days.setDate(today.getDate() - 2);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // 2. Create Clients & Deals for Ahmet
  await prisma.client.create({
    data: {
      firma_adi: 'Anadolu Sigorta Grubu',
      yetkili_kisi: 'Murat Arslan',
      telefon: '05321112233',
      eposta: 'murat.arslan@anadolusigorta.com.tr',
      musteri_tipi: 'Kurumsal',
      satis_temsilcisi_id: rep1.id,
      sonraki_takip_tarihi: today, // Bugün takip
      deals: {
        create: [
          {
            kanal: 'Bi Kanal',
            teklif_tutari: 320000,
            yayin_donemi: 'Ekim 2026 Prime Time',
            tahmini_kapanis_tarihi: nextWeek,
            ihtimal_derecesi: 'Yüksek',
            asama: 'PAZARLIK',
            not: 'Bütçe onayında son aşama, revize teklif iletildi.',
          },
        ],
      },
    },
  });

  await prisma.client.create({
    data: {
      firma_adi: 'Bursa Otomotiv A.Ş.',
      yetkili_kisi: 'Hakan Çelik',
      telefon: '05423334455',
      eposta: 'hakan@bursaoto.com',
      musteri_tipi: 'KOBİ',
      satis_temsilcisi_id: rep1.id,
      sonraki_takip_tarihi: overdue3Days, // Geciken takip (3 gün)
      deals: {
        create: [
          {
            kanal: 'Sıfır TV',
            teklif_tutari: 250000,
            yayin_donemi: 'Kasım 2026 Kuşak',
            tahmini_kapanis_tarihi: tomorrow,
            ihtimal_derecesi: 'Orta',
            asama: 'TAKİP',
            not: 'Yönetim kurulu kararı bekleniyor, 3 gün gecikti.',
          },
        ],
      },
    },
  });

  await prisma.client.create({
    data: {
      firma_adi: 'Vakıfbank Genel Müdürlük',
      yetkili_kisi: 'Selin Aydın',
      telefon: '05556667788',
      eposta: 'selin.aydin@vakifbank.com.tr',
      musteri_tipi: 'Kamu',
      satis_temsilcisi_id: rep1.id,
      sonraki_takip_tarihi: nextWeek,
      deals: {
        create: [
          {
            kanal: 'Bi Kanal',
            teklif_tutari: 550000,
            yayin_donemi: 'Q4 2026 Kampanya',
            tahmini_kapanis_tarihi: nextWeek,
            ihtimal_derecesi: 'Kesin',
            asama: 'SATIŞ',
            not: 'Sözleşme imzalandı, prodüksiyon bekleniyor.',
          },
        ],
      },
    },
  });

  // 3. Create Clients & Deals for Elif
  await prisma.client.create({
    data: {
      firma_adi: 'Medya Net İletişim Ajansı',
      yetkili_kisi: 'Canan Güneş',
      telefon: '05059998877',
      eposta: 'canan@medyanet.com',
      musteri_tipi: 'Ajans',
      satis_temsilcisi_id: rep2.id,
      sonraki_takip_tarihi: today, // Bugün takip
      deals: {
        create: [
          {
            kanal: 'Sıfır TV',
            teklif_tutari: 420000,
            yayin_donemi: 'Ekim 2026 Haber Önü',
            tahmini_kapanis_tarihi: nextWeek,
            ihtimal_derecesi: 'Yüksek',
            asama: 'TEKLİF',
            not: 'Spot planlaması hazırlandı, müşteri sunumu yapılacak.',
          },
          {
            kanal: 'Bi Kanal',
            teklif_tutari: 210000,
            yayin_donemi: 'Ekim 2026 Gece Kuşağı',
            tahmini_kapanis_tarihi: tomorrow,
            ihtimal_derecesi: 'Kesin',
            asama: 'TAHSİLAT',
            not: 'Yayın tamamlandı, fatura kesildi, ödeme bekleniyor.',
          },
        ],
      },
    },
  });

  await prisma.client.create({
    data: {
      firma_adi: 'Güneş Gıda Sanayi',
      yetkili_kisi: 'Serdar Demir',
      telefon: '05332221100',
      eposta: 'serdar@gunesgida.com.tr',
      musteri_tipi: 'KOBİ',
      satis_temsilcisi_id: rep2.id,
      sonraki_takip_tarihi: overdue2Days, // Geciken takip (2 gün)
      deals: {
        create: [
          {
            kanal: 'Bi Kanal',
            teklif_tutari: 150000,
            yayin_donemi: 'Eylül 2026',
            tahmini_kapanis_tarihi: tomorrow,
            ihtimal_derecesi: 'Düşük',
            asama: 'GÖRÜŞME',
            not: 'İlk görüşme yapıldı, teklif sunulacak.',
          },
        ],
      },
    },
  });

  // 4. Seed Comprehensive Work Reports (Çalışma Raporları)
  await prisma.workReport.deleteMany();

  // Reports for Ahmet Yılmaz
  await prisma.workReport.createMany({
    data: [
      {
        tarih: today,
        user_id: rep1.id,
        kurum_adi: 'Turkcell İletişim Hizmetleri',
        kurum_turu: 'Marka',
        yetkili: 'Emre Karaca (Pazarlama Müdürü)',
        iletisim_turu: 'Telefon',
        gorusme_amaci: 'Q4 Prime Time kuşak sponsorluğu ve spot reklam planlaması için görüşüldü.',
        teklif_verildi: true,
        teklif_tutari: 450000,
        teklif_ihtimal: '%75',
        satis_yapildi: false,
        kurumsal_ziyaret: false,
        rezervasyon_var: true,
        rezervasyon_gelen: 25,
        rezervasyon_turu: 'Spot',
        rezervasyon_birim_fiyat: 18000,
        rezervasyon_toplam_saniye: 750,
      },
      {
        tarih: today,
        user_id: rep1.id,
        kurum_adi: 'Anadolu Sigorta Grubu',
        kurum_turu: 'Marka',
        yetkili: 'Murat Arslan',
        iletisim_turu: 'Kurumsal Ziyaret',
        gorusme_amaci: 'Genel merkezde yüz yüze bütçe toplantısı yapıldı. Yayın dönemine onay verildi.',
        teklif_verildi: true,
        teklif_tutari: 320000,
        teklif_ihtimal: '%90',
        satis_yapildi: true,
        satis_turu: 'Spot Reklam',
        satis_tutari: 320000,
        kurumsal_ziyaret: true,
        rezervasyon_var: true,
        rezervasyon_gelen: 15,
        rezervasyon_turu: 'Spot',
        rezervasyon_birim_fiyat: 21333,
        rezervasyon_toplam_saniye: 450,
      },
      {
        tarih: overdue2Days,
        user_id: rep1.id,
        kurum_adi: 'Bursa Otomotiv A.Ş.',
        kurum_turu: 'KOBİ',
        yetkili: 'Hakan Çelik',
        iletisim_turu: 'Dijital Toplantı',
        gorusme_amaci: 'Zoom üzerinden yeni model lansmanı alt bant reklam yerleşimi sunuldu.',
        teklif_verildi: true,
        teklif_tutari: 250000,
        teklif_ihtimal: '%50',
        satis_yapildi: false,
        kurumsal_ziyaret: false,
        rezervasyon_var: false,
      },
      {
        tarih: overdue3Days,
        user_id: rep1.id,
        kurum_adi: 'Vakıfbank Genel Müdürlük',
        kurum_turu: 'Kamu',
        yetkili: 'Selin Aydın',
        iletisim_turu: 'Yüzyüze Toplantı',
        gorusme_amaci: 'Kamu spotu ve kurumsal imaj kampanyası anlaşması sağlandı.',
        teklif_verildi: true,
        teklif_tutari: 550000,
        teklif_ihtimal: '%100',
        satis_yapildi: true,
        satis_turu: 'Sponsorluk',
        satis_tutari: 550000,
        kurumsal_ziyaret: true,
        rezervasyon_var: true,
        rezervasyon_gelen: 40,
        rezervasyon_turu: 'Kamu Spotu',
        rezervasyon_birim_fiyat: 13750,
        rezervasyon_toplam_saniye: 1200,
      },
    ],
  });

  // Reports for Elif Demir
  await prisma.workReport.createMany({
    data: [
      {
        tarih: today,
        user_id: rep2.id,
        kurum_adi: 'Medya Net İletişim Ajansı',
        kurum_turu: 'Ajans',
        yetkili: 'Canan Güneş',
        iletisim_turu: 'Telefon',
        gorusme_amaci: 'Ekim ayı ajans konsolide reklam paketleri görüşüldü.',
        teklif_verildi: true,
        teklif_tutari: 420000,
        teklif_ihtimal: '%80',
        satis_yapildi: false,
        kurumsal_ziyaret: false,
        rezervasyon_var: true,
        rezervasyon_gelen: 30,
        rezervasyon_turu: 'Spot',
        rezervasyon_birim_fiyat: 14000,
        rezervasyon_toplam_saniye: 900,
      },
      {
        tarih: today,
        user_id: rep2.id,
        kurum_adi: 'Güneş Gıda Sanayi',
        kurum_turu: 'KOBİ',
        yetkili: 'Serdar Demir',
        iletisim_turu: 'E-posta',
        gorusme_amaci: 'Yeni ürün lansmanı için alt bant ve spot fiyat teklifi e-posta ile iletildi.',
        teklif_verildi: true,
        teklif_tutari: 150000,
        teklif_ihtimal: '%40',
        satis_yapildi: false,
        kurumsal_ziyaret: false,
        rezervasyon_var: false,
      },
      {
        tarih: overdue2Days,
        user_id: rep2.id,
        kurum_adi: 'Vestel Beyaz Eşya',
        kurum_turu: 'Marka',
        yetkili: 'Kerem Öztürk',
        iletisim_turu: 'Kurumsal Ziyaret',
        gorusme_amaci: 'Fabrika ve pazarlama üssünde yıllık sponsorluk görüşmesi gerçekleştirildi.',
        teklif_verildi: true,
        teklif_tutari: 850000,
        teklif_ihtimal: '%70',
        satis_yapildi: true,
        satis_turu: 'Sponsorluk',
        satis_tutari: 850000,
        kurumsal_ziyaret: true,
        rezervasyon_var: true,
        rezervasyon_gelen: 50,
        rezervasyon_turu: 'Sponsorluk',
        rezervasyon_birim_fiyat: 17000,
        rezervasyon_toplam_saniye: 1500,
      },
    ],
  });

  // Reports for Ayşe Yıldız (Genel Müdür / Admin)
  await prisma.workReport.createMany({
    data: [
      {
        tarih: today,
        user_id: admin.id,
        kurum_adi: 'Cumhurbaşkanlığı İletişim Başkanlığı',
        kurum_turu: 'Kamu',
        yetkili: 'Daire Başkanı',
        iletisim_turu: 'Kurumsal Ziyaret',
        gorusme_amaci: 'Yıllık kamu spotu yayın protokolü ve resmi işbirliği çerçevesi imzalandı.',
        teklif_verildi: true,
        teklif_tutari: 1200000,
        teklif_ihtimal: '%100',
        satis_yapildi: true,
        satis_turu: 'Sponsorluk',
        satis_tutari: 1200000,
        kurumsal_ziyaret: true,
        rezervasyon_var: true,
        rezervasyon_gelen: 100,
        rezervasyon_turu: 'Kamu Spotu',
        rezervasyon_birim_fiyat: 12000,
        rezervasyon_toplam_saniye: 3000,
      },
    ],
  });

  console.log('Seed completed successfully with enriched Work Reports!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
