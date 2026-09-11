'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { User, Deal, Client } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AlertBanner } from '@/components/AlertBanner';
import { FilterBar } from '@/components/FilterBar';
import { QuickAddClientModal } from '@/components/QuickAddClientModal';
import { QuickAddDealModal } from '@/components/QuickAddDealModal';
import { UpdateFollowUpModal } from '@/components/UpdateFollowUpModal';
import { AdminUsersModal } from '@/components/AdminUsersModal';
import { Loader2 } from 'lucide-react';

import { KanbanBoard } from '@/components/KanbanBoard';
import { DashboardView } from '@/components/DashboardView';
import { ClientsView } from '@/components/ClientsView';

interface AppContainerProps {
  initialUsers: User[];
  initialDeals: Deal[];
  initialClients: Client[];
  sessionUser: User;
}

export const AppContainer: React.FC<AppContainerProps> = ({
  initialUsers,
  initialDeals,
  initialClients,
  sessionUser,
}) => {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [currentUser, setCurrentUser] = useState<User>(sessionUser);
  const [deals, setDeals] = useState<Deal[]>(initialDeals || []);
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Active View Tab - default is 'dashboard'
  const [activeTab, setActiveTab] = useState<'pipeline' | 'clients' | 'dashboard'>('dashboard');

  // Global Filters
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('all');

  // Modal States
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [selectedClientForAction, setSelectedClientForAction] = useState<Client | null>(null);

  // Fetch updated deals and clients using reliable API route with fallback
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (currentUser?.id) params.set('currentUserId', currentUser.id);
      if (currentUser?.role) params.set('currentUserRole', currentUser.role);
      if (selectedRep) params.set('selectedRepId', selectedRep);
      if (selectedChannel) params.set('kanal', selectedChannel);
      if (selectedCustomerType) params.set('musteriTipi', selectedCustomerType);
      if (selectedTimeRange) params.set('timeRange', selectedTimeRange);

      const res = await fetch(`/api/data?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          startTransition(() => {
            if (json.deals) setDeals(json.deals);
            if (json.clients) setClients(json.clients);
            if (json.users && json.users.length > 0) setUsers(json.users);
          });
        }
      }
    } catch (e) {
      console.error('Veri güncelleme hatası:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser, selectedRep, selectedChannel, selectedCustomerType, selectedTimeRange]);

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
    setTimeout(() => {
      refreshData();
    }, 50);
  };

  const handleOpenFollowUp = (client: any) => {
    setSelectedClientForAction(client);
    setIsFollowUpOpen(true);
  };

  const handleOpenAddDeal = (client: any) => {
    setSelectedClientForAction(client);
    setIsAddDealOpen(true);
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
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-5">
        
        {/* Alert & Reminder Banner */}
        <AlertBanner
          currentUser={currentUser}
          deals={deals}
          onOpenFollowUpModal={handleOpenFollowUp}
        />

        {/* Global Filter Bar */}
        <FilterBar
          users={users}
          currentUser={currentUser}
          selectedChannel={selectedChannel}
          setSelectedChannel={(ch) => {
            setSelectedChannel(ch);
            setTimeout(refreshData, 50);
          }}
          selectedTimeRange={selectedTimeRange}
          setSelectedTimeRange={(tr) => {
            setSelectedTimeRange(tr);
            setTimeout(refreshData, 50);
          }}
          selectedRep={selectedRep}
          setSelectedRep={(rep) => {
            setSelectedRep(rep);
            setTimeout(refreshData, 50);
          }}
          selectedCustomerType={selectedCustomerType}
          setSelectedCustomerType={(ct) => {
            setSelectedCustomerType(ct);
            setTimeout(refreshData, 50);
          }}
          onReset={handleResetFilters}
        />

        {/* Refreshing subtle banner indicator if background loading */}
        {isRefreshing && (
          <div className="flex items-center justify-end gap-2 text-[11px] font-mono text-sky-600 mb-2 pr-1 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Veriler güncelleniyor...</span>
          </div>
        )}

        {/* Dynamic Content Views - Instant Switching */}
        <div className="transition-opacity duration-150">
          {activeTab === 'pipeline' && (
            <KanbanBoard
              deals={deals}
              onRefresh={refreshData}
              onOpenFollowUpModal={handleOpenFollowUp}
              onOpenAddDealModal={handleOpenAddDeal}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              currentUser={currentUser}
              onRefresh={refreshData}
              onOpenAddClient={() => setIsAddClientOpen(true)}
              onOpenAddDeal={handleOpenAddDeal}
              onOpenFollowUpModal={handleOpenFollowUp}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              deals={deals}
              users={users}
              clients={clients}
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
        currentUser={currentUser}
        onSuccess={refreshData}
      />

      <QuickAddDealModal
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        client={selectedClientForAction}
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
    </div>
  );
};
