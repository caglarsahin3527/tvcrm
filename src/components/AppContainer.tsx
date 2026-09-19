'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { User, Deal, Client, WorkReport } from '@/types';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { QuickAddClientModal } from '@/components/QuickAddClientModal';
import { UpdateFollowUpModal } from '@/components/UpdateFollowUpModal';
import { AdminUsersModal } from '@/components/AdminUsersModal';
import { WorkReportModal } from '@/components/WorkReportModal';
import { ProfileModal } from '@/components/ProfileModal';
import { Loader2 } from 'lucide-react';

import { DashboardView } from '@/components/DashboardView';
import { ClientsView } from '@/components/ClientsView';

interface AppContainerProps {
  initialUsers: User[];
  initialDeals: Deal[];
  initialClients: Client[];
  initialWorkReports?: WorkReport[];
  sessionUser: User;
}

export const AppContainer: React.FC<AppContainerProps> = ({
  initialUsers,
  initialDeals,
  initialClients,
  initialWorkReports = [],
  sessionUser,
}) => {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [currentUser, setCurrentUser] = useState<User>(sessionUser);
  const [deals, setDeals] = useState<Deal[]>(initialDeals || []);
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [workReports, setWorkReports] = useState<WorkReport[]>(initialWorkReports || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Active View Tab - default is 'dashboard'
  const [activeTab, setActiveTab] = useState<'clients' | 'dashboard'>('dashboard');

  // Global Filters
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('all');

  // Modal States
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [isWorkReportOpen, setIsWorkReportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedClientForAction, setSelectedClientForAction] = useState<Client | null>(null);

  // Helper for checking date within time range
  const isDateInTimeRange = (dateVal: string | Date | undefined | null, range: string): boolean => {
    if (!dateVal || range === 'all') return true;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (range === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return d >= start && d <= end;
    }
    if (range === 'this_week') {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    if (range === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return d >= start && d <= end;
    }
    if (range === 'this_quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterMonth, 1);
      const end = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return true;
  };

  // Filtered Deals calculation
  const filteredDeals = React.useMemo(() => {
    return deals.filter((deal) => {
      // 1. Channel Filter
      if (selectedChannel !== 'all' && deal.kanal !== selectedChannel) {
        return false;
      }
      // 2. Representative Filter
      const repId = deal.musteri?.satis_temsilcisi_id || deal.musteri?.satis_temsilcisi?.id;
      if (selectedRep !== 'all' && repId !== selectedRep) {
        return false;
      }
      // 3. Customer Type Filter
      if (selectedCustomerType !== 'all' && deal.musteri?.musteri_tipi !== selectedCustomerType) {
        return false;
      }
      // 4. Time Range Filter
      if (selectedTimeRange !== 'all') {
        if (!isDateInTimeRange(deal.createdAt, selectedTimeRange)) {
          return false;
        }
      }
      return true;
    });
  }, [deals, selectedChannel, selectedRep, selectedCustomerType, selectedTimeRange, currentUser]);

  // Filtered Clients calculation
  const filteredClients = React.useMemo(() => {
    return clients
      .filter((client) => {
        // 1. Representative Filter
        if (selectedRep !== 'all' && client.satis_temsilcisi_id !== selectedRep) {
          return false;
        }

        // 2. Customer Type Filter
        if (selectedCustomerType !== 'all' && client.musteri_tipi !== selectedCustomerType) {
          return false;
        }

        // 3. Channel Filter (Include if channel is 'all' OR if client has deals in that channel)
        if (selectedChannel !== 'all') {
          const hasChannelDeal = (client.deals || []).some((d) => d.kanal === selectedChannel);
          if (!hasChannelDeal) return false;
        }

        // 4. Time Range Filter
        if (selectedTimeRange !== 'all') {
          const inCreated = isDateInTimeRange(client.createdAt, selectedTimeRange);
          const inFollowUp = isDateInTimeRange(client.sonraki_takip_tarihi, selectedTimeRange);
          const inDeals = (client.deals || []).some((d) => isDateInTimeRange(d.createdAt, selectedTimeRange));
          if (!inCreated && !inFollowUp && !inDeals) return false;
        }

        return true;
      })
      .map((client) => {
        if (selectedChannel !== 'all') {
          return {
            ...client,
            deals: (client.deals || []).filter((d) => d.kanal === selectedChannel),
          };
        }
        return client;
      });
  }, [clients, selectedChannel, selectedRep, selectedCustomerType, selectedTimeRange, currentUser]);

  // Fetch updated deals, clients and work reports
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          startTransition(() => {
            if (json.deals) setDeals(json.deals);
            if (json.clients) setClients(json.clients);
            if (json.users && json.users.length > 0) setUsers(json.users);
            if (json.workReports) setWorkReports(json.workReports);
          });
        }
      }
    } catch (e) {
      console.error('Veri güncelleme hatası:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/login';
    }
  };

  const handleResetFilters = () => {
    setSelectedChannel('all');
    setSelectedTimeRange('all');
    setSelectedRep('all');
    setSelectedCustomerType('all');
  };

  const handleOpenFollowUp = (client: any) => {
    setSelectedClientForAction(client);
    setIsFollowUpOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddClient={() => setIsAddClientOpen(true)}
        onOpenAdminUsers={() => setIsAdminUsersOpen(true)}
        onOpenWorkReport={() => setIsWorkReportOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-5">
        
        {/* Global Filter Bar */}
        <FilterBar
          users={users}
          currentUser={currentUser}
          selectedChannel={selectedChannel}
          setSelectedChannel={setSelectedChannel}
          selectedTimeRange={selectedTimeRange}
          setSelectedTimeRange={setSelectedTimeRange}
          selectedRep={selectedRep}
          setSelectedRep={setSelectedRep}
          selectedCustomerType={selectedCustomerType}
          setSelectedCustomerType={setSelectedCustomerType}
          onReset={handleResetFilters}
        />

        {/* Refreshing subtle banner indicator if background loading (Fixed position to avoid layout shifts) */}
        {isRefreshing && (
          <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-mono backdrop-blur-xs animate-in fade-in duration-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Veriler güncelleniyor...</span>
          </div>
        )}

        {/* Dynamic Content Views - Instant Switching */}
        <div className="transition-opacity duration-150">
          {activeTab === 'clients' && (
            <ClientsView
              clients={filteredClients}
              currentUser={currentUser}
              onRefresh={refreshData}
              onOpenAddClient={() => setIsAddClientOpen(true)}
              onOpenFollowUpModal={handleOpenFollowUp}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              deals={filteredDeals}
              users={users}
              clients={filteredClients}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <QuickAddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        users={users}
        clients={clients}
        currentUser={currentUser}
        onSuccess={refreshData}
      />

      <UpdateFollowUpModal
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        client={selectedClientForAction}
        onSuccess={refreshData}
      />

      {/* Super Admin User Management Modal */}
      <AdminUsersModal
        isOpen={isAdminUsersOpen}
        onClose={() => setIsAdminUsersOpen(false)}
        currentUser={currentUser}
        onUsersUpdated={refreshData}
      />

      {/* Work Report Modal */}
      <WorkReportModal
        isOpen={isWorkReportOpen}
        onClose={() => setIsWorkReportOpen(false)}
        users={users}
        clients={clients}
        currentUser={currentUser}
        workReports={workReports}
        onRefresh={refreshData}
      />

      {/* User Profile & Password Change Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          refreshData();
        }}
      />
    </div>
  );
};
