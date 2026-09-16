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

    // Role check: Managers cannot create clients (monitoring only)
    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler müşteri kaydı oluşturamaz.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // If sales rep, enforce rep ID to be current user
    let repId = data.satis_temsilcisi_id;
    if (sessionUser.role === 'SALES_REP' || !repId) {
      repId = sessionUser.id;
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
        satis_temsilcisi: true,
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
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    const { clientId, nextFollowUpDate } = await request.json();
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Müşteri ID gereklidir.' }, { status: 400 });
    }

    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    // Role check: If rep, ensure client belongs to rep
    if (sessionUser.role === 'SALES_REP' && existingClient.satis_temsilcisi_id !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: 'Yalnızca kendi müşterilerinizin takip tarihini güncelleyebilirsiniz.' },
        { status: 403 }
      );
    }

    if (sessionUser.role === 'SALES_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'İzleyen yöneticiler müşteri kayıtlarını güncelleyemez.' },
        { status: 403 }
      );
    }

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
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Only Admin can delete clients
    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Müşteri kaydını silmek için Admin yetkisi gereklidir.' },
        { status: 403 }
      );
    }

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
