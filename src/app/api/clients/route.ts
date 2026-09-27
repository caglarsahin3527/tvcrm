import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFast } from '@/lib/auth';
import { toTurkishUpper, toCleanEmail, formatPhoneInput, isValidPhone } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repId = searchParams.get('repId') || searchParams.get('userId');

    const clients = await prisma.client.findMany({
      where: repId ? { satis_temsilcisi_id: repId } : undefined,
      include: {
        deals: {
          where: { is_archived: false },
          select: {
            id: true,
            teklif_tutari: true,
            asama: true,
            ihtimal_derecesi: true,
            kanal: true,
          },
        },
        satis_temsilcisi: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { firma_adi: 'asc' },
    });

    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Müşteriler alınamadı.' },
      { status: 500 }
    );
  }
}

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

    if (!data.telefon || !isValidPhone(data.telefon)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lütfen geçerli bir telefon numarası giriniz (Örn: 05XX XXX XX XX).' 
      }, { status: 400 });
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
        telefon: formatPhoneInput(data.telefon),
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

    const data = await request.json();
    const clientId = data.clientId || data.id;
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

    // Branch 1: Full Client Update (Firma Adı, Yetkili, Telefon vb.)
    // Only Marka Merkezi (ADMIN / SUPER_ADMIN) is allowed!
    if (data.firma_adi !== undefined || data.yetkili_kisi !== undefined || data.telefon !== undefined || data.musteri_tipi !== undefined || data.satis_temsilcisi_id !== undefined) {
      if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Müşteri bilgilerini düzenleme yetkisi sadece Marka Merkezi rolüne aittir.' },
          { status: 403 }
        );
      }

      const upperFirmaAdi = toTurkishUpper(data.firma_adi?.trim() || existingClient.firma_adi);
      if (!upperFirmaAdi) {
        return NextResponse.json({ success: false, error: 'Firma adı belirtilmelidir.' }, { status: 400 });
      }

      // Check duplicate client name if name is changed
      if (upperFirmaAdi !== existingClient.firma_adi) {
        const duplicateClient = await prisma.client.findFirst({
          where: {
            firma_adi: upperFirmaAdi,
            id: { not: clientId },
          },
          include: { satis_temsilcisi: true },
        });

        if (duplicateClient) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Bu firma adı zaten "${duplicateClient.satis_temsilcisi?.name || 'başka bir temsilci'}" portföyünde kayıtlıdır.` 
            },
            { status: 400 }
          );
        }

        // Sync old WorkReport kurum_adi records to new company name
        await prisma.workReport.updateMany({
          where: { kurum_adi: existingClient.firma_adi },
          data: { kurum_adi: upperFirmaAdi },
        });
      }

      if (data.telefon !== undefined) {
        if (!isValidPhone(data.telefon)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Lütfen geçerli bir telefon numarası giriniz (Örn: 05XX XXX XX XX).' 
          }, { status: 400 });
        }
      }

      const followUpDate = data.sonraki_takip_tarihi
        ? new Date(data.sonraki_takip_tarihi)
        : existingClient.sonraki_takip_tarihi;

      const updated = await prisma.client.update({
        where: { id: clientId },
        data: {
          firma_adi: upperFirmaAdi,
          yetkili_kisi: data.yetkili_kisi ? toTurkishUpper(data.yetkili_kisi) : existingClient.yetkili_kisi,
          telefon: data.telefon !== undefined ? formatPhoneInput(data.telefon) : existingClient.telefon,
          eposta: data.eposta !== undefined ? toCleanEmail(data.eposta) : existingClient.eposta,
          musteri_tipi: data.musteri_tipi || existingClient.musteri_tipi,
          satis_temsilcisi_id: data.satis_temsilcisi_id || existingClient.satis_temsilcisi_id,
          sonraki_takip_tarihi: isNaN(followUpDate.getTime()) ? existingClient.sonraki_takip_tarihi : followUpDate,
        },
        include: {
          satis_temsilcisi: true,
          deals: true,
        },
      });

      return NextResponse.json({ success: true, client: updated });
    }

    // Branch 2: Follow-up Date Only (Can be called by client owner or Marka Merkezi)
    const isOwner = existingClient.satis_temsilcisi_id === sessionUser.id;
    const isMarkaMerkezi = sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN';

    if (!isOwner && !isMarkaMerkezi) {
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
        sonraki_takip_tarihi: new Date(data.nextFollowUpDate),
      },
      include: {
        satis_temsilcisi: true,
        deals: true,
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

    // Only Marka Merkezi can delete clients
    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Müşteri kaydını kalıcı olarak silmek için Marka Merkezi yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('Müşteri ID belirtilmelidir.');

    // Find and unlink associated deals from WorkReports
    const deals = await prisma.deal.findMany({
      where: { musteri_id: id },
      select: { id: true },
    });

    if (deals.length > 0) {
      const dealIds = deals.map((d) => d.id);
      await prisma.workReport.updateMany({
        where: { deal_id: { in: dealIds } },
        data: { deal_id: null },
      });
    }

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
