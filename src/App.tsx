import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PicksProvider } from '@/context/PicksContext';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CategoryTiles } from '@/components/CategoryTiles';
import { TodaysOdds } from '@/components/TodaysOdds';
import { MyPicksPanel } from '@/components/MyPicksPanel';
import { AccountSection } from '@/components/AccountSection';
import { HowItWorks } from '@/components/HowItWorks';
import { TrustRow } from '@/components/TrustRow';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { EditOddsPage } from '@/pages/EditOddsPage';

type Page = 'home' | 'dashboard' | 'admin' | 'edit-odds';

function AppContent() {
  const { user, isAdmin, loading } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (page === 'dashboard' && !user && !loading) {
      setPage('home');
      setAuthMode('login');
      setAuthOpen(true);
    }
    if (page === 'admin' && !isAdmin && !loading) {
      setPage('home');
      setAuthMode('login');
      setAuthOpen(true);
    }
  }, [page, user, isAdmin, loading]);

  const openAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    if (nextPage === 'edit-odds') window.location.hash = 'admin/odds';
    else if (nextPage !== 'home') window.location.hash = nextPage;
    else history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash === 'admin/odds') setPage('edit-odds');
    else if (hash === 'dashboard') setPage('dashboard');
    else if (hash === 'admin') setPage('admin');
  }, []);

  if (page === 'edit-odds') return <EditOddsPage onBack={() => navigate('home')} />;
  if (page === 'dashboard' && user) return <DashboardPage onBack={() => navigate('home')} />;
  if (page === 'admin' && user && isAdmin) return <AdminPage onBack={() => navigate('home')} onEditOdds={() => navigate('edit-odds')} />;

  return (
    <div className="min-h-screen bg-navy">
      <Header onNavigate={navigate} />
      <main>
        <Hero />
        <TrustRow />
        <CategoryTiles />
        <TodaysOdds />
        <AccountSection onRequireLogin={openAuth} />
        <HowItWorks />
      </main>
      <Footer />
      <MyPicksPanel onRequireLogin={() => openAuth('login')} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}

function App() {
  return <AuthProvider><PicksProvider><AppContent /></PicksProvider></AuthProvider>;
}

export default App;
