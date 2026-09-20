import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFast } from '@/lib/auth';
import { toTurkishUpper, toCleanEmail } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    // Role check: VIEWER cannot create clients
    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların müşteri kaydı oluşturma yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const upperFirmaAdi = toTurkishUpper(data.firma_adi?.trim());
    if (!upperFirmaAdi) {
      return NextResponse.json({ success: false, error: 'Firma adı gereklidir.' }, { status: 400 });
    }

    // Check if client with identical company name already exists
    const existingSameName = await prisma.client.findFirst({
      where: { firma_adi: upperFirmaAdi },
      include: { satis_temsilcisi: true },
    });

    if (existingSameName) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Bu firma zaten "${existingSameName.satis_temsilcisi?.name || 'başka bir temsilci'}" portföyünde kayıtlıdır. Marka Merkezi ve Satış Yöneticisi dahil başka bir temsilcinin müşterisine mükerrer kayıt açılamaz veya teklif verilemez.` 
        },
        { status: 400 }
      );
    }

    // Default rep is current session user
    let repId = data.satis_temsilcisi_id;
    if ((sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') || !repId) {
      repId = sessionUser.id;
    }

    const followUpDate = data.sonraki_takip_tarihi
      ? new Date(data.sonraki_takip_tarihi)
      : new Date();

    const client = await prisma.client.create({
      data: {
        firma_adi: upperFirmaAdi,
        yetkili_kisi: toTurkishUpper(data.yetkili_kisi),
        telefon: data.telefon,
        eposta: toCleanEmail(data.eposta),
        musteri_tipi: data.musteri_tipi || 'Kurumsal',
        satis_temsilcisi_id: repId,
        sonraki_takip_tarihi: isNaN(followUpDate.getTime()) ? new Date() : followUpDate,
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

    if (sessionUser.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'İzleme modundaki hesapların müşteri güncelleme yetkisi yoktur.' },
        { status: 403 }
      );
    }

    const { clientId, nextFollowUpDate } = await request.json();
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Müşteri ID gereklidir.' }, { status: 400 });
    }

    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
      include: { satis_temsilcisi: true },
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    // Role check: Only the client owner can update their customer's follow-up date
    if (existingClient.satis_temsilcisi_id !== sessionUser.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Bu müşteri "${existingClient.satis_temsilcisi?.name || 'başka bir temsilci'}" portföyündedir. Yalnızca kendi müşterilerinizin takip tarihini güncelleyebilirsiniz.` 
        },
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
