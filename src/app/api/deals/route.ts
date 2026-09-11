import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
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
    const { dealId, asama } = await request.json();
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
