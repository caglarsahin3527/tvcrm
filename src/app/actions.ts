'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth';

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function getDeals(filters: {
  currentUserId?: string;
  currentUserRole?: string;
  selectedRepId?: string;
  kanal?: string;
  musteriTipi?: string;
  timeRange?: string; // "all", "today", "this_week", "this_month", "this_quarter"
}) {
  const { currentUserId, currentUserRole, selectedRepId, kanal, musteriTipi, timeRange } = filters;

  let repFilter: string | undefined = undefined;
  if (currentUserRole === 'SALES_REP') {
    repFilter = currentUserId;
  } else if (selectedRepId && selectedRepId !== 'all') {
    repFilter = selectedRepId;
  }

  let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;
  const now = new Date();
  if (timeRange === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (timeRange === 'this_week') {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (timeRange === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (timeRange === 'this_quarter') {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterMonth, 1);
    const end = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  }

  const deals = await prisma.deal.findMany({
    where: {
      ...(kanal && kanal !== 'all' ? { kanal } : {}),
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      musteri: {
        ...(repFilter ? { satis_temsilcisi_id: repFilter } : {}),
        ...(musteriTipi && musteriTipi !== 'all' ? { musteri_tipi: musteriTipi } : {}),
      },
    },
    include: {
      musteri: {
        include: {
          satis_temsilcisi: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return deals;
}

export async function getClients(filters: {
  currentUserId?: string;
  currentUserRole?: string;
  selectedRepId?: string;
  musteriTipi?: string;
}) {
  const { currentUserId, currentUserRole, selectedRepId, musteriTipi } = filters;

  let repFilter: string | undefined = undefined;
  if (currentUserRole === 'SALES_REP') {
    repFilter = currentUserId;
  } else if (selectedRepId && selectedRepId !== 'all') {
    repFilter = selectedRepId;
  }

  const clients = await prisma.client.findMany({
    where: {
      ...(repFilter ? { satis_temsilcisi_id: repFilter } : {}),
      ...(musteriTipi && musteriTipi !== 'all' ? { musteri_tipi: musteriTipi } : {}),
    },
    include: {
      satis_temsilcisi: true,
      deals: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return clients;
}

export async function createClientAndDeal(data: {
  firma_adi: string;
  yetkili_kisi: string;
  telefon: string;
  eposta?: string;
  musteri_tipi: string;
  satis_temsilcisi_id: string;
  sonraki_takip_tarihi: string;
  has_deal?: boolean;
  kanal?: string;
  teklif_tutari?: number;
  yayin_donemi?: string;
  tahmini_kapanis_tarihi?: string;
  ihtimal_derecesi?: string;
  asama?: string;
  not?: string;
}) {
  try {
    let repId = data.satis_temsilcisi_id;
    if (!repId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'SALES_REP' },
      }) || await prisma.user.findFirst();
      if (defaultUser) {
        repId = defaultUser.id;
      }
    }

    const followUpDate = data.sonraki_takip_tarihi
      ? new Date(data.sonraki_takip_tarihi)
      : new Date();

    const client = await prisma.client.create({
      data: {
        firma_adi: data.firma_adi,
        yetkili_kisi: data.yetkili_kisi,
        telefon: data.telefon,
        eposta: data.eposta || '',
        musteri_tipi: data.musteri_tipi || 'Kurumsal',
        satis_temsilcisi_id: repId,
        sonraki_takip_tarihi: isNaN(followUpDate.getTime()) ? new Date() : followUpDate,
        deals: data.has_deal
          ? {
              create: {
                kanal: data.kanal || 'Bi Kanal',
                teklif_tutari: Number(data.teklif_tutari) || 0,
                yayin_donemi: data.yayin_donemi || '',
                tahmini_kapanis_tarihi: data.tahmini_kapanis_tarihi && !isNaN(new Date(data.tahmini_kapanis_tarihi).getTime())
                  ? new Date(data.tahmini_kapanis_tarihi)
                  : null,
                ihtimal_derecesi: data.ihtimal_derecesi || 'Orta',
                asama: data.asama || 'YENİ LEAD',
                not: data.not || '',
              },
            }
          : undefined,
      },
      include: {
        deals: true,
      },
    });

    revalidatePath('/');
    return client;
  } catch (error) {
    console.error('Error in createClientAndDeal:', error);
    throw error;
  }
}

export async function createDeal(data: {
  musteri_id: string;
  kanal: string;
  teklif_tutari: number;
  yayin_donemi: string;
  tahmini_kapanis_tarihi?: string;
  ihtimal_derecesi: string;
  asama: string;
  not: string;
}) {
  const deal = await prisma.deal.create({
    data: {
      musteri_id: data.musteri_id,
      kanal: data.kanal,
      teklif_tutari: Number(data.teklif_tutari) || 0,
      yayin_donemi: data.yayin_donemi,
      tahmini_kapanis_tarihi: data.tahmini_kapanis_tarihi
        ? new Date(data.tahmini_kapanis_tarihi)
        : null,
      ihtimal_derecesi: data.ihtimal_derecesi,
      asama: data.asama,
      not: data.not || '',
    },
  });

  revalidatePath('/');
  return deal;
}

export async function updateDealStage(dealId: string, asama: string) {
  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: { asama },
  });
  revalidatePath('/');
  return updated;
}

export async function updateClientFollowUpDate(clientId: string, nextFollowUpDate: string) {
  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      sonraki_takip_tarihi: new Date(nextFollowUpDate),
    },
  });
  revalidatePath('/');
  return updated;
}

export async function createClient(data: {
  firma_adi: string;
  yetkili_kisi: string;
  telefon: string;
  eposta?: string;
  musteri_tipi: string;
  satis_temsilcisi_id: string;
  sonraki_takip_tarihi: string;
}) {
  let repId = data.satis_temsilcisi_id;
  if (!repId) {
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'SALES_REP' },
    }) || await prisma.user.findFirst();
    if (defaultUser) {
      repId = defaultUser.id;
    }
  }

  const followUpDate = data.sonraki_takip_tarihi
    ? new Date(data.sonraki_takip_tarihi)
    : new Date();

  const client = await prisma.client.create({
    data: {
      firma_adi: data.firma_adi,
      yetkili_kisi: data.yetkili_kisi,
      telefon: data.telefon,
      eposta: data.eposta || '',
      musteri_tipi: data.musteri_tipi || 'Kurumsal',
      satis_temsilcisi_id: repId,
      sonraki_takip_tarihi: isNaN(followUpDate.getTime()) ? new Date() : followUpDate,
    },
    include: {
      satis_temsilcisi: true,
      deals: true,
    },
  });

  revalidatePath('/');
  return client;
}

export async function deleteDeal(dealId: string) {
  await prisma.deal.delete({ where: { id: dealId } });
  revalidatePath('/');
}

export async function deleteClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath('/');
}

export async function getWorkReports(filters?: {
  userId?: string;
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  kurumTuru?: string;
  iletisimTuru?: string;
}) {
  const { userId, timeRange, startDate, endDate, kurumTuru, iletisimTuru } = filters || {};
  let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;
  const now = new Date();

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (timeRange === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (timeRange === 'this_week') {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  } else if (timeRange === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  }

  return await prisma.workReport.findMany({
    where: {
      ...(userId && userId !== 'all' ? { user_id: userId } : {}),
      ...(kurumTuru && kurumTuru !== 'all' ? { kurum_turu: kurumTuru } : {}),
      ...(iletisimTuru && iletisimTuru !== 'all' ? { iletisim_turu: iletisimTuru } : {}),
      ...(dateFilter ? { tarih: dateFilter } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { tarih: 'desc' },
  });
}

export async function createWorkReport(data: any) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error('Oturum açılmalıdır.');
  if (sessionUser.role === 'SALES_MANAGER') {
    throw new Error('İzleyen yöneticiler çalışma raporu ekleyemez.');
  }

  const effectiveUserId = (sessionUser.role === 'ADMIN' && data.user_id) ? data.user_id : sessionUser.id;
  const reportDate = data.tarih ? new Date(data.tarih) : new Date();

  const report = await prisma.workReport.create({
    data: {
      user_id: effectiveUserId,
      tarih: isNaN(reportDate.getTime()) ? new Date() : reportDate,
      kurum_adi: data.kurum_adi,
      kurum_turu: data.kurum_turu || 'Kurumsal',
      yetkili: data.yetkili,
      iletisim_turu: data.iletisim_turu,
      gorusme_amaci: data.gorusme_amaci || '',
      teklif_verildi: Boolean(data.teklif_verildi),
      teklif_tutari: data.teklif_verildi ? Number(data.teklif_tutari) || 0 : 0,
      teklif_ihtimal: data.teklif_verildi ? data.teklif_ihtimal || '' : '',
      satis_yapildi: Boolean(data.satis_yapildi),
      satis_turu: data.satis_yapildi ? data.satis_turu || '' : '',
      satis_tutari: data.satis_yapildi ? Number(data.satis_tutari) || 0 : 0,
      kurumsal_ziyaret: Boolean(data.kurumsal_ziyaret),
      rezervasyon_var: Boolean(data.rezervasyon_var),
      rezervasyon_gelen: data.rezervasyon_var ? Number(data.rezervasyon_gelen) || 0 : 0,
      rezervasyon_turu: data.rezervasyon_var ? data.rezervasyon_turu || '' : '',
      rezervasyon_birim_fiyat: data.rezervasyon_var ? Number(data.rezervasyon_birim_fiyat) || 0 : 0,
      rezervasyon_toplam_saniye: data.rezervasyon_var ? Number(data.rezervasyon_toplam_saniye) || 0 : 0,
    },
    include: {
      user: true,
    },
  });

  revalidatePath('/');
  return report;
}
