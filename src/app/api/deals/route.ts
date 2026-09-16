import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: Managers cannot create deals (monitoring only)
    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler fırsat/teklif ekleyemez.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Check client ownership for reps
    if (sessionUser.role === 'SALES_REP') {
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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: Managers cannot edit deals (monitoring only)
    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler fırsat aşamalarını değiştiremez.' },
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

    if (sessionUser.role === 'SALES_REP' && existingDeal.musteri.satis_temsilcisi_id !== sessionUser.id) {
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
    const sessionUser = await getSessionUser();
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
