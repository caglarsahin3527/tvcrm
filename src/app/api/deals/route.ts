import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFast } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: VIEWER cannot create deals
    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların fırsat/teklif ekleme yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Check client ownership (Admins can create deals for any client)
    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
      const client = await prisma.client.findUnique({
        where: { id: data.musteri_id },
      });
      if (!client || client.satis_temsilcisi_id !== sessionUser.id) {
        return NextResponse.json(
          { success: false, error: 'Yalnızca kendi müşterilerinize fırsat ekleyebilirsiniz.' },
          { status: 403 }
        );
      }
    }

    const deal = await (prisma.deal as any).create({
      data: {
        musteri_id: data.musteri_id,
        kanal: data.kanal,
        teklif_tutari: Number(data.teklif_tutari) || 0,
        yayin_donemi: data.yayin_donemi || '',
        baslangic_tarihi:
          data.baslangic_tarihi && !isNaN(new Date(data.baslangic_tarihi).getTime())
            ? new Date(data.baslangic_tarihi)
            : null,
        bitis_tarihi:
          data.bitis_tarihi && !isNaN(new Date(data.bitis_tarihi).getTime())
            ? new Date(data.bitis_tarihi)
            : null,
        tahmini_kapanis_tarihi: data.tahmini_kapanis_tarihi
          ? new Date(data.tahmini_kapanis_tarihi)
          : null,
        ihtimal_derecesi: data.ihtimal_derecesi,
        asama: data.asama,
        not: data.not || '',
      },
      include: {
        musteri: true,
      },
    });

    return NextResponse.json({ success: true, deal });
  } catch (error: any) {
    console.error('Error in POST /api/deals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Deal creation failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: VIEWER cannot edit deals
    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların fırsat aşamalarını değiştirme yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const { dealId, asama } = await request.json();
    if (!dealId || !asama) {
      return NextResponse.json(
        { success: false, error: 'Fırsat ID ve Aşama bilgisi gereklidir.' },
        { status: 400 }
      );
    }

    const existingDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { musteri: true },
    });

    if (!existingDeal) {
      return NextResponse.json({ success: false, error: 'Fırsat bulunamadı.' }, { status: 404 });
    }

    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN' && existingDeal.musteri.satis_temsilcisi_id !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: 'Yalnızca kendi fırsatlarınızı güncelleyebilirsiniz.' },
        { status: 403 }
      );
    }

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: { asama },
    });
    return NextResponse.json({ success: true, deal: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/deals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Fırsat silmek için Admin yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('Deal ID missing');

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/deals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
