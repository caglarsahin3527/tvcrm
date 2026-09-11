import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    let repId = data.satis_temsilcisi_id;
    if (!repId) {
      const defaultUser = (await prisma.user.findFirst({
        where: { role: 'SALES_REP' },
      })) || (await prisma.user.findFirst());
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
                tahmini_kapanis_tarihi:
                  data.tahmini_kapanis_tarihi &&
                  !isNaN(new Date(data.tahmini_kapanis_tarihi).getTime())
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

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Error in POST /api/clients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Client creation failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { clientId, nextFollowUpDate } = await request.json();
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        sonraki_takip_tarihi: new Date(nextFollowUpDate),
      },
    });
    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/clients:', error);
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
    if (!id) throw new Error('Client ID missing');
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/clients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
