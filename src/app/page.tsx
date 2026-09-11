'use client';

import { useState, useEffect, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<{
    users: any[];
    deals: any[];
    clients: any[];
    sessionUser: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [AppComponent, setAppComponent] = useState<ComponentType<any> | null>(
    null
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // 1. Fetch current auth user and data in parallel
    Promise.all([
      fetch('/api/auth/me', { signal: controller.signal }),
      fetch('/api/data', { signal: controller.signal }),
    ])
      .then(async ([authRes, dataRes]) => {
        if (authRes.status === 401) {
          router.replace('/login');
          return null;
        }

        if (!authRes.ok) throw new Error(`Oturum hatası: HTTP ${authRes.status}`);
        if (!dataRes.ok) throw new Error(`Veri hatası: HTTP ${dataRes.status}`);

        const authJson = await authRes.json();
        const dataJson = await dataRes.json();

        if (!authJson.success || !authJson.user) {
          router.replace('/login');
          return null;
        }

        clearTimeout(timeout);

        setData({
          users: dataJson.users || [],
          deals: dataJson.deals || [],
          clients: dataJson.clients || [],
          sessionUser: authJson.user,
        });

        // Load the heavy component tree after data is ready
        return import('@/components/AppContainer');
      })
      .then((mod) => {
        if (mod) {
          setAppComponent(() => mod.AppContainer);
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        const msg =
          err.name === 'AbortError' ? 'Zaman aşımı (20s)' : err.message;
        setError(msg);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [router]);

  // ── Loaded: render the full app ──
  if (data && AppComponent) {
    const App = AppComponent;
    return (
      <App
        initialUsers={data.users}
        initialDeals={data.deals}
        initialClients={data.clients}
        sessionUser={data.sessionUser}
      />
    );
  }

  // ── Loading / Error screen ──
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 24,
        gap: 20,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38bdf8',
          fontWeight: 900,
          fontSize: 18,
          fontFamily: 'monospace',
        }}
      >
        TV
      </div>

      {error ? (
        <>
          <p style={{ color: '#dc2626', fontWeight: 600, fontSize: 14, margin: 0 }}>
            Bağlantı Hatası
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, textAlign: 'center' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tekrar Dene
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: 20,
              height: 20,
              border: '2.5px solid #e2e8f0',
              borderTopColor: '#0284c7',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            Veriler ve oturum doğrulanıyor...
          </p>
        </>
      )}
    </div>
  );
}
