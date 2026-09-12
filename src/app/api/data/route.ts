import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const searchParams = request.nextUrl.searchParams;
    const selectedRepId = searchParams.get('selectedRepId') || undefined;
    const kanal = searchParams.get('kanal') || undefined;
    const musteriTipi = searchParams.get('musteriTipi') || undefined;
    const timeRange = searchParams.get('timeRange') || undefined;

    // RBAC: SALES_REP can only access their own data
    let repFilter: string | undefined = undefined;
    if (sessionUser && sessionUser.role === 'SALES_REP') {
      repFilter = sessionUser.id;
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

    const [users, deals, clients, workReports] = await Promise.all([
      prisma.user.findMany({ orderBy: { name: 'asc' } }),
      prisma.deal.findMany({
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
      }),
      prisma.client.findMany({
        where: {
          ...(repFilter ? { satis_temsilcisi_id: repFilter } : {}),
          ...(musteriTipi && musteriTipi !== 'all' ? { musteri_tipi: musteriTipi } : {}),
        },
        include: {
          satis_temsilcisi: true,
          deals: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workReport.findMany({
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
      }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      deals,
      clients,
      workReports,
    });
  } catch (error: any) {
    console.error('API /api/data error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
