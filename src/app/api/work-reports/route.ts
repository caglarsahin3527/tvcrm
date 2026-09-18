import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFast } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const selectedUserId = searchParams.get('userId') || undefined;
    const timeRange = searchParams.get('timeRange') || undefined; // "today", "this_week", "this_month", "all"
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const kurumTuru = searchParams.get('kurumTuru') || undefined;
    const iletisimTuru = searchParams.get('iletisimTuru') || undefined;

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

    const reports = await prisma.workReport.findMany({
      where: {
        ...(selectedUserId && selectedUserId !== 'all' ? { user_id: selectedUserId } : {}),
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

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error('WorkReport GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { toTurkishUpper, toCleanEmail } from '@/lib/formatters';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: VIEWER role cannot create reports
    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların çalışma raporu ekleme yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      tarih,
      kurum_adi,
      kurum_turu,
      musteri_durumu,
      yetkili,
      yetkili_telefon,
      yetkili_eposta,
      iletisim_turu,
      reklam_turu,
      tv_kanali,
      gorusme_amaci,
      sonuc,
      teklif_verildi,
      teklif_tutari,
      teklif_ihtimal,
      satis_yapildi,
      satis_turu,
      satis_tutari,
      kurumsal_ziyaret,
      rezervasyon_var,
      rezervasyon_gelen,
      rezervasyon_turu,
      rezervasyon_fiyat_tipi,
      rezervasyon_opt_saniye,
      rezervasyon_opt_fiyat,
      rezervasyon_pt_saniye,
      rezervasyon_pt_fiyat,
      rezervasyon_birim_fiyat,
      rezervasyon_toplam_saniye,
      rezervasyon_vade,
      user_id,
    } = body;

    if (!kurum_adi || !yetkili || !iletisim_turu) {
      return NextResponse.json(
        { success: false, error: 'Lütfen zorunlu alanları (Kurum, Yetkili, İletişim türü) doldurunuz.' },
        { status: 400 }
      );
    }

    // Assign to sessionUser by default, or if Admin, allow assigning to designated user
    const effectiveUserId = (sessionUser.role === 'ADMIN' && user_id) ? user_id : sessionUser.id;
    const reportDate = tarih ? new Date(tarih) : new Date();

    const report = await prisma.workReport.create({
      data: {
        user_id: effectiveUserId,
        tarih: isNaN(reportDate.getTime()) ? new Date() : reportDate,
        kurum_adi: toTurkishUpper(kurum_adi),
        kurum_turu: kurum_turu || 'Marka',
        musteri_durumu: musteri_durumu || 'Yeni Müşteri',
        yetkili: toTurkishUpper(yetkili),
        yetkili_telefon: yetkili_telefon || '',
        yetkili_eposta: toCleanEmail(yetkili_eposta),
        iletisim_turu,
        reklam_turu: reklam_turu || 'Reklam',
        tv_kanali: tv_kanali || 'Bi Kanal',
        gorusme_amaci: gorusme_amaci || '',
        sonuc: sonuc || '',
        teklif_verildi: Boolean(teklif_verildi),
        teklif_tutari: teklif_verildi ? Number(teklif_tutari) || 0 : 0,
        teklif_ihtimal: teklif_verildi ? teklif_ihtimal || '' : '',
        satis_yapildi: Boolean(satis_yapildi),
        satis_turu: satis_yapildi ? satis_turu || '' : '',
        satis_tutari: satis_yapildi ? Number(satis_tutari) || 0 : 0,
        kurumsal_ziyaret: Boolean(kurumsal_ziyaret),
        rezervasyon_var: Boolean(rezervasyon_var),
        rezervasyon_gelen: rezervasyon_var ? Number(rezervasyon_gelen) || 0 : 0,
        rezervasyon_turu: rezervasyon_var ? rezervasyon_turu || '' : '',
        rezervasyon_fiyat_tipi: rezervasyon_var ? rezervasyon_fiyat_tipi || 'TEK_FIYAT' : 'TEK_FIYAT',
        rezervasyon_opt_saniye: rezervasyon_var ? Number(rezervasyon_opt_saniye) || 0 : 0,
        rezervasyon_opt_fiyat: rezervasyon_var ? Number(rezervasyon_opt_fiyat) || 0 : 0,
        rezervasyon_pt_saniye: rezervasyon_var ? Number(rezervasyon_pt_saniye) || 0 : 0,
        rezervasyon_pt_fiyat: rezervasyon_var ? Number(rezervasyon_pt_fiyat) || 0 : 0,
        rezervasyon_birim_fiyat: rezervasyon_var ? Number(rezervasyon_birim_fiyat) || 0 : 0,
        rezervasyon_toplam_saniye: rezervasyon_var ? Number(rezervasyon_toplam_saniye) || 0 : 0,
        rezervasyon_vade: rezervasyon_var ? (rezervasyon_vade || '') : '',
      },
      include: {
        user: true,
      },
    });

    
    if (satis_yapildi || teklif_verildi) {
      let client = await prisma.client.findFirst({
        where: { firma_adi: toTurkishUpper(kurum_adi) },
      });
      
      // Auto-create client if they don't exist so the deal isn't lost
      if (!client) {
        client = await prisma.client.create({
          data: {
            firma_adi: toTurkishUpper(kurum_adi),
            yetkili_kisi: toTurkishUpper(yetkili) || 'Bilinmiyor',
            telefon: yetkili_telefon || '0000000000',
            eposta: yetkili_eposta || '',
            musteri_tipi: kurum_turu || 'Diğer',
            satis_temsilcisi_id: effectiveUserId,
            sonraki_takip_tarihi: new Date(),
          }
        });
      }

      if (client) {
        // Herkes (Admin hariç) sadece kendi müşterisi için işlem yapabilir.
        // Eğer yönetici bile olsa, başkasının (veya Admin'in) müşterisine rapor giremez, ancak belki kendi alt ekibi için girebilir.
        // Ama kural "Herkes sadece kendi yaptığı müşterilerle ilgili değişiklik yapabilir" diyor.
        if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN' && client.satis_temsilcisi_id !== sessionUser.id) {
          throw new Error('Bu müşteri başka bir temsilciye aittir. Yalnızca kendi müşterileriniz için işlem yapabilirsiniz.');
        }
        const asama = satis_yapildi ? 'SATIŞ' : 'TEKLİF';
        const tutar = satis_yapildi ? (Number(satis_tutari) || 0) : (Number(teklif_tutari) || 0);
        const deal = await prisma.deal.create({
          data: {
            musteri_id: client.id,
            kanal: tv_kanali || 'Bi Kanal',
            teklif_tutari: tutar,
            ihtimal_derecesi: satis_yapildi 
              ? 'Kesin' 
              : (teklif_ihtimal === '%100' 
                  ? 'Kesin' 
                  : teklif_ihtimal === '%75' 
                  ? 'Yüksek' 
                  : teklif_ihtimal === '%25' 
                  ? 'Düşük' 
                  : (teklif_ihtimal === '%90' ? 'Yüksek' : teklif_ihtimal === '%10' ? 'Düşük' : 'Orta')),
            asama: asama,
            not: (satis_yapildi ? satis_turu : 'Teklif Verildi') + ' - Çalışma Raporundan Otomatik Eklendi',
          }
        });

        await prisma.workReport.update({
          where: { id: report.id },
          data: { deal_id: deal.id }
        });
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('WorkReport POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların çalışma raporu düzenleme yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Rapor ID gereklidir.' }, { status: 400 });
    }

    const existing = await prisma.workReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    const isAdmin = sessionUser.role === 'ADMIN';
    const isOwner = existing.user_id === sessionUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Başkasına ait çalışma raporuna müdahale etme yetkiniz yoktur.' },
        { status: 403 }
      );
    }

    const reportDate = data.tarih ? new Date(data.tarih) : existing.tarih;

    const updated = await prisma.workReport.update({
      where: { id },
      data: {
        tarih: isNaN(reportDate.getTime()) ? existing.tarih : reportDate,
        kurum_adi: data.kurum_adi !== undefined ? toTurkishUpper(data.kurum_adi) : existing.kurum_adi,
        kurum_turu: data.kurum_turu !== undefined ? data.kurum_turu : existing.kurum_turu,
        musteri_durumu: data.musteri_durumu !== undefined ? data.musteri_durumu : existing.musteri_durumu,
        yetkili: data.yetkili !== undefined ? toTurkishUpper(data.yetkili) : existing.yetkili,
        yetkili_telefon: data.yetkili_telefon !== undefined ? data.yetkili_telefon : existing.yetkili_telefon,
        yetkili_eposta: data.yetkili_eposta !== undefined ? toCleanEmail(data.yetkili_eposta) : existing.yetkili_eposta,
        iletisim_turu: data.iletisim_turu !== undefined ? data.iletisim_turu : existing.iletisim_turu,
        reklam_turu: data.reklam_turu !== undefined ? data.reklam_turu : existing.reklam_turu,
        tv_kanali: data.tv_kanali !== undefined ? data.tv_kanali : existing.tv_kanali,
        gorusme_amaci: data.gorusme_amaci !== undefined ? data.gorusme_amaci : existing.gorusme_amaci,
        sonuc: data.sonuc !== undefined ? data.sonuc : existing.sonuc,
        teklif_verildi: data.teklif_verildi !== undefined ? Boolean(data.teklif_verildi) : existing.teklif_verildi,
        teklif_tutari: data.teklif_tutari !== undefined ? Number(data.teklif_tutari) : existing.teklif_tutari,
        teklif_ihtimal: data.teklif_ihtimal !== undefined ? data.teklif_ihtimal : existing.teklif_ihtimal,
        satis_yapildi: data.satis_yapildi !== undefined ? Boolean(data.satis_yapildi) : existing.satis_yapildi,
        satis_turu: data.satis_turu !== undefined ? data.satis_turu : existing.satis_turu,
        satis_tutari: data.satis_tutari !== undefined ? Number(data.satis_tutari) : existing.satis_tutari,
        kurumsal_ziyaret: data.kurumsal_ziyaret !== undefined ? Boolean(data.kurumsal_ziyaret) : existing.kurumsal_ziyaret,
        rezervasyon_var: data.rezervasyon_var !== undefined ? Boolean(data.rezervasyon_var) : existing.rezervasyon_var,
        rezervasyon_gelen: data.rezervasyon_gelen !== undefined ? Number(data.rezervasyon_gelen) : existing.rezervasyon_gelen,
        rezervasyon_turu: data.rezervasyon_turu !== undefined ? data.rezervasyon_turu : existing.rezervasyon_turu,
        rezervasyon_fiyat_tipi: data.rezervasyon_fiyat_tipi !== undefined ? data.rezervasyon_fiyat_tipi : (existing as any).rezervasyon_fiyat_tipi,
        rezervasyon_opt_saniye: data.rezervasyon_opt_saniye !== undefined ? Number(data.rezervasyon_opt_saniye) : (existing as any).rezervasyon_opt_saniye,
        rezervasyon_opt_fiyat: data.rezervasyon_opt_fiyat !== undefined ? Number(data.rezervasyon_opt_fiyat) : (existing as any).rezervasyon_opt_fiyat,
        rezervasyon_pt_saniye: data.rezervasyon_pt_saniye !== undefined ? Number(data.rezervasyon_pt_saniye) : (existing as any).rezervasyon_pt_saniye,
        rezervasyon_pt_fiyat: data.rezervasyon_pt_fiyat !== undefined ? Number(data.rezervasyon_pt_fiyat) : (existing as any).rezervasyon_pt_fiyat,
        rezervasyon_birim_fiyat: data.rezervasyon_birim_fiyat !== undefined ? Number(data.rezervasyon_birim_fiyat) : existing.rezervasyon_birim_fiyat,
        rezervasyon_toplam_saniye: data.rezervasyon_toplam_saniye !== undefined ? Number(data.rezervasyon_toplam_saniye) : existing.rezervasyon_toplam_saniye,
        rezervasyon_vade: data.rezervasyon_vade !== undefined ? data.rezervasyon_vade : (existing as any).rezervasyon_vade,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error: any) {
    console.error('WorkReport PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların çalışma raporu silme yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Rapor ID gereklidir.' }, { status: 400 });
    }

    const existing = await prisma.workReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    const isAdmin = sessionUser.role === 'ADMIN';
    const isOwner = existing.user_id === sessionUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Başkasına ait çalışma raporunu silme yetkiniz yoktur.' },
        { status: 403 }
      );
    }

    if ((existing as any).deal_id) {
      try {
        await prisma.deal.delete({ where: { id: (existing as any).deal_id } });
      } catch (err) {
        console.error('Failed to delete associated deal:', err);
      }
    }

    await prisma.workReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WorkReport DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

