import { useState } from 'react';
import { Menu, X, MessageCircle, UserRound, LayoutDashboard, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TickerBar } from '@/components/TickerBar';
import { usePicks } from '@/context/PicksContext';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';

interface HeaderProps {
  onNavigate: (page: 'home' | 'dashboard' | 'admin') => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { count, openPanel } = usePicks();
  const { user, profile, signOut, isAdmin } = useAuth();

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    onNavigate('home');
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  };

  const handleAccount = () => {
    setMenuOpen(false);
    if (user) onNavigate(isAdmin ? 'admin' : 'dashboard');
    else setAuthOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-navy/85 backdrop-blur-xl border-b border-line">
        <div className="container-app h-[72px] flex items-center justify-between gap-4">
          <button onClick={() => onNavigate('home')} aria-label="Go home"><Logo withTagline /></button>
          <nav className="hidden lg:flex items-center gap-7 text-sm text-muted">
            <button onClick={() => scrollTo('categories')} className="hover:text-white transition-colors">Sport &amp; Casino</button>
            <button onClick={handleAccount} className="hover:text-white transition-colors">Account</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">How it works</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors">Contact</button>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={handleAccount} className="hidden sm:inline-flex btn-gold !px-4 !py-2.5 text-sm">
              {user ? <LayoutDashboard size={16} /> : <UserRound size={16} />}
              {user ? profile?.name?.split(' ')[0] || 'Dashboard' : 'Log in'}
            </button>
            <button onClick={openPanel} className="btn-ghost !px-3 !py-2.5 text-sm relative">
              <MessageCircle size={17} className="text-gold" />
              <span className="hidden sm:inline">My picks</span>
              {count > 0 && <span key={count} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold text-navy text-[11px] font-bold flex items-center justify-center animate-badge-pulse">{count}</span>}
            </button>
            <button onClick={() => setMenuOpen((v) => !v)} className="lg:hidden p-2 text-muted hover:text-white" aria-label="Menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-line bg-surface animate-fade-in">
            <div className="container-app py-4 space-y-1">
              <button onClick={() => scrollTo('categories')} className="block w-full text-left px-3 py-3 rounded-md text-muted hover:bg-white/5 hover:text-white">Sport &amp; Casino</button>
              <button onClick={handleAccount} className="block w-full text-left px-3 py-3 rounded-md text-muted hover:bg-white/5 hover:text-white">Account</button>
              <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left px-3 py-3 rounded-md text-muted hover:bg-white/5 hover:text-white">How it works</button>
              <button onClick={() => scrollTo('contact')} className="block w-full text-left px-3 py-3 rounded-md text-muted hover:bg-white/5 hover:text-white">Contact</button>
              {user && <button onClick={async () => { await signOut(); setMenuOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-3 rounded-md text-error-200 hover:bg-white/5"><LogOut size={16} /> Log out</button>}
            </div>
          </div>
        )}
      </header>
      <TickerBar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
