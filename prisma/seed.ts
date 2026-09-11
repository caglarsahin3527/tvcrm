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

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
