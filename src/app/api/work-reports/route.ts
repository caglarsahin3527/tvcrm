import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
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

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: Managers are monitoring only and cannot create or modify reports (feedback #7)
    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler çalışma raporu ekleyemez veya düzenleyemez.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      tarih,
      kurum_adi,
      kurum_turu,
      yetkili,
      iletisim_turu,
      gorusme_amaci,
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
      rezervasyon_birim_fiyat,
      rezervasyon_toplam_saniye,
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
        kurum_adi,
        kurum_turu: kurum_turu || 'Kurumsal',
        yetkili,
        iletisim_turu,
        gorusme_amaci: gorusme_amaci || '',
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
        rezervasyon_birim_fiyat: rezervasyon_var ? Number(rezervasyon_birim_fiyat) || 0 : 0,
        rezervasyon_toplam_saniye: rezervasyon_var ? Number(rezervasyon_toplam_saniye) || 0 : 0,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('WorkReport POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
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

    // Role check: Managers cannot edit (feedback #7); Sales Reps cannot edit other reps' reports (feedback #6)
    const isAdmin = sessionUser.role === 'ADMIN';
    const isOwner = existing.user_id === sessionUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Başkasına ait çalışma raporuna müdahale etme yetkiniz yoktur.' },
        { status: 403 }
      );
    }

    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler çalışma raporlarına müdahale edemez.' },
        { status: 403 }
      );
    }

    const reportDate = data.tarih ? new Date(data.tarih) : existing.tarih;

    const updated = await prisma.workReport.update({
      where: { id },
      data: {
        tarih: isNaN(reportDate.getTime()) ? existing.tarih : reportDate,
        kurum_adi: data.kurum_adi !== undefined ? data.kurum_adi : existing.kurum_adi,
        kurum_turu: data.kurum_turu !== undefined ? data.kurum_turu : existing.kurum_turu,
        yetkili: data.yetkili !== undefined ? data.yetkili : existing.yetkili,
        iletisim_turu: data.iletisim_turu !== undefined ? data.iletisim_turu : existing.iletisim_turu,
        gorusme_amaci: data.gorusme_amaci !== undefined ? data.gorusme_amaci : existing.gorusme_amaci,
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
        rezervasyon_birim_fiyat: data.rezervasyon_birim_fiyat !== undefined ? Number(data.rezervasyon_birim_fiyat) : existing.rezervasyon_birim_fiyat,
        rezervasyon_toplam_saniye: data.rezervasyon_toplam_saniye !== undefined ? Number(data.rezervasyon_toplam_saniye) : existing.rezervasyon_toplam_saniye,
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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
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

    // Role check: Managers cannot delete (feedback #7); Sales Reps cannot delete other reps' reports (feedback #6)
    const isAdmin = sessionUser.role === 'ADMIN';
    const isOwner = existing.user_id === sessionUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Başkasına ait çalışma raporunu silme yetkiniz yoktur.' },
        { status: 403 }
      );
    }

    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler çalışma raporlarını silemez.' },
        { status: 403 }
      );
    }

    await prisma.workReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WorkReport DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
