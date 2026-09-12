import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppContainer } from '@/components/AppContainer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sessionUser = await getSessionUser();

  // If no authenticated session, instantly redirect to /login
  if (!sessionUser) {
    redirect('/login');
  }

  try {
    // Fetch initial data directly on the server (instant local query)
    const [users, deals, clients, workReports] = await Promise.all([
      prisma.user.findMany({ orderBy: { name: 'asc' } }),
      prisma.deal.findMany({
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
        include: {
          satis_temsilcisi: true,
          deals: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workReport.findMany({
        include: {
          user: true,
        },
        orderBy: { tarih: 'desc' },
      }),
    ]);

    return (
      <AppContainer
        sessionUser={sessionUser}
        initialUsers={users}
        initialDeals={deals}
        initialClients={clients}
        initialWorkReports={workReports}
      />
    );
  } catch (error) {
    console.error('Database load error:', error);
    return (
      <AppContainer
        sessionUser={sessionUser}
        initialUsers={[]}
        initialDeals={[]}
        initialClients={[]}
        initialWorkReports={[]}
      />
    );
  }
}

