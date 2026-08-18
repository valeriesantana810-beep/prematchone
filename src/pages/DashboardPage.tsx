import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Banknote, Clock3, LogOut, RefreshCw, ShieldCheck, TrendingUp, UserRound, ReceiptText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type BetRequest, type Pick } from '@/lib/supabase';

interface DashboardPageProps {
  onBack: () => void;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/10 text-warning-200 border-warning/20',
  confirmed: 'bg-royal/20 text-royal-100 border-royal/30',
  paid: 'bg-success/10 text-success-300 border-success/20',
  rejected: 'bg-error/10 text-error-200 border-error/20',
  sent: 'bg-success/10 text-success-300 border-success/20',
};

const requestLabel: Record<string, string> = {
  registration: 'Registration',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
};

export function DashboardPage({ onBack }: DashboardPageProps) {
  const { profile, user, signOut } = useAuth();
  const [requests, setRequests] = useState<BetRequest[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: requestData }, { data: pickData }] = await Promise.all([
      supabase.from('requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('picks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setRequests((requestData as BetRequest[] | null) ?? []);
    setPicks((pickData as Pick[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-navy">
      <div className="border-b border-line bg-navy/85 backdrop-blur-xl sticky top-0 z-20">
        <div className="container-app h-[72px] flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
            <ArrowLeft size={17} /> Back to front door
          </button>
          <button onClick={async () => { await signOut(); onBack(); }} className="flex items-center gap-2 text-sm text-muted hover:text-error-200 transition-colors">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      <main className="container-app py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
          <div>
            <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">My account</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">Welcome, {profile?.name?.split(' ')[0] || 'player'}.</h1>
            <p className="text-muted mt-2">Track your requests, picks, and account balance in one place.</p>
          </div>
          <button onClick={() => void load()} className="btn-ghost !px-3 !py-2 self-start sm:self-auto">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-9">
          <div className="card p-5 bg-gradient-to-br from-royal/50 to-royal/10">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted">Current balance</p>
              <Banknote size={18} className="text-gold" />
            </div>
            <p className="font-mono text-3xl font-bold text-white mt-3">N${(profile?.balance ?? 0).toFixed(2)}</p>
            <p className="text-xs text-muted mt-2">Updated by the Prematch team</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted">Account status</p>
              <ShieldCheck size={18} className="text-gold" />
            </div>
            <p className="text-xl font-bold text-white mt-4 capitalize">{profile?.account_status ?? 'pending'}</p>
            <p className="text-xs text-muted mt-2">Username: <span className="font-mono text-[#F5F3EE]">{profile?.username || 'pending'}</span></p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted">Picks saved</p>
              <TrendingUp size={18} className="text-gold" />
            </div>
            <p className="font-mono text-3xl font-bold text-white mt-3">{picks.length}</p>
            <p className="text-xs text-muted mt-2">Your personal picks history</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-6">
          <section className="card overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Request history</h2>
                <p className="text-xs text-muted mt-1">Deposits, withdrawals, and registrations</p>
              </div>
              <Clock3 size={18} className="text-gold" />
            </div>
            {loading ? (
              <LoadingRows />
            ) : requests.length === 0 ? (
              <EmptyState label="No requests yet" detail="Your account requests will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-muted border-b border-line">
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Reference</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b border-line last:border-0">
                        <td className="px-5 py-4 text-sm text-[#F5F3EE]">{requestLabel[request.type]}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gold">{request.reference}</td>
                        <td className="px-5 py-4 font-mono text-sm text-[#F5F3EE]">{request.amount ? `N$${request.amount.toFixed(2)}` : '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`badge border capitalize ${statusStyles[request.status] || statusStyles.pending}`}>{request.status}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted">{new Date(request.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Picks history</h2>
                <p className="text-xs text-muted mt-1">Your WhatsApp pick references</p>
              </div>
              <ReceiptText size={18} className="text-gold" />
            </div>
            {loading ? (
              <LoadingRows />
            ) : picks.length === 0 ? (
              <EmptyState label="No picks saved yet" detail="Send a pick from Today's Odds to see it here." />
            ) : (
              <div className="divide-y divide-line">
                {picks.map((pick) => (
                  <div key={pick.id} className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-gold">{pick.reference}</span>
                      <span className={`badge border capitalize ${statusStyles[pick.status] || statusStyles.pending}`}>{pick.status}</span>
                    </div>
                    <p className="text-sm text-[#F5F3EE] mt-3">{pick.items.map((item) => item.selection).join(' · ')}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted">
                      <span>{pick.items.length} selection{pick.items.length === 1 ? '' : 's'}</span>
                      <span className="font-mono">{pick.stake ? `N$${pick.stake.toFixed(2)} stake` : 'Stake not set'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="p-5 space-y-4">
      <div className="h-4 rounded-md bg-white/5 animate-pulse" />
      <div className="h-4 rounded-md bg-white/5 animate-pulse w-4/5" />
      <div className="h-4 rounded-md bg-white/5 animate-pulse w-3/5" />
    </div>
  );
}

function EmptyState({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="p-10 text-center">
      <p className="text-[#F5F3EE] font-semibold">{label}</p>
      <p className="text-sm text-muted mt-2">{detail}</p>
    </div>
  );
}
