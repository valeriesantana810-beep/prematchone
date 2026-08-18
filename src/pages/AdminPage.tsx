import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Banknote, Check, Clock3, LogOut, RefreshCw, ShieldCheck, Users, X, PencilLine } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type BetRequest, type Profile, type RequestStatus } from '@/lib/supabase';

interface AdminPageProps { onBack: () => void; onEditOdds: () => void; }
interface AdminRequest extends BetRequest { profiles: Pick<Profile, 'name' | 'phone' | 'username'> | null; }

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/10 text-warning-200 border-warning/20',
  confirmed: 'bg-royal/20 text-royal-100 border-royal/30',
  paid: 'bg-success/10 text-success-300 border-success/20',
  rejected: 'bg-error/10 text-error-200 border-error/20',
};

export function AdminPage({ onBack, onEditOdds }: AdminPageProps) {
  const { signOut, profile } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'all' | RequestStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [balanceUser, setBalanceUser] = useState<Profile | null>(null);
  const [balance, setBalance] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: requestData }, { data: profileData }] = await Promise.all([
      supabase.from('requests').select('*, profiles(name, phone, username)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    setRequests((requestData as AdminRequest[] | null) ?? []);
    setProfiles((profileData as Profile[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (id: string, status: RequestStatus) => {
    setBusyId(id);
    const { error } = await supabase.rpc('admin_set_request_status', { p_request_id: id, p_status: status });
    setBusyId(null);
    if (!error) setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
  };

  const saveBalance = async () => {
    if (!balanceUser || Number(balance) < 0) return;
    setBusyId(balanceUser.id);
    const { error } = await supabase.rpc('admin_set_balance', { p_user_id: balanceUser.id, p_balance: Number(balance) });
    setBusyId(null);
    if (!error) {
      setProfiles((current) => current.map((item) => item.id === balanceUser.id ? { ...item, balance: Number(balance) } : item));
      setBalanceUser(null);
    }
  };

  const visibleRequests = filter === 'all' ? requests : requests.filter((request) => request.status === filter);
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  return (
    <div className="min-h-screen bg-navy">
      <div className="border-b border-line bg-navy/85 backdrop-blur-xl sticky top-0 z-20">
        <div className="container-app h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"><ArrowLeft size={17} /> Front door</button>
            <span className="hidden sm:block h-5 w-px bg-line" />
            <span className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold"><ShieldCheck size={14} /> Operator view</span>
          </div>
          <button onClick={async () => { await signOut(); onBack(); }} className="flex items-center gap-2 text-sm text-muted hover:text-error-200 transition-colors"><LogOut size={16} /> Log out</button>
        </div>
      </div>

      <main className="container-app py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
          <div>
            <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">Admin console</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">Good day, {profile?.name?.split(' ')[0] || 'operator'}.</h1>
            <p className="text-muted mt-2">Keep every customer request moving from pending to paid.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEditOdds} className="btn-ghost !px-4 !py-2.5 text-sm"><PencilLine size={15} /> Edit odds</button>
            <button onClick={() => void load()} className="btn-ghost !px-3 !py-2"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-9">
          <div className="card p-5 bg-gradient-to-br from-warning/20 to-warning/5">
            <div className="flex justify-between"><p className="text-xs uppercase tracking-wider text-muted">Needs attention</p><Clock3 size={18} className="text-warning" /></div>
            <p className="font-mono text-3xl font-bold text-white mt-3">{pendingCount}</p>
            <p className="text-xs text-muted mt-2">Pending requests</p>
          </div>
          <div className="card p-5">
            <div className="flex justify-between"><p className="text-xs uppercase tracking-wider text-muted">Customers</p><Users size={18} className="text-gold" /></div>
            <p className="font-mono text-3xl font-bold text-white mt-3">{profiles.length}</p>
            <p className="text-xs text-muted mt-2">Registered profiles</p>
          </div>
          <div className="card p-5">
            <div className="flex justify-between"><p className="text-xs uppercase tracking-wider text-muted">Confirmed / paid</p><Check size={18} className="text-success" /></div>
            <p className="font-mono text-3xl font-bold text-white mt-3">{requests.filter((request) => request.status === 'confirmed' || request.status === 'paid').length}</p>
            <p className="text-xs text-muted mt-2">Completed requests</p>
          </div>
        </div>

        <section className="card overflow-hidden mb-8">
          <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Request queue</h2>
              <p className="text-xs text-muted mt-1">Review and update customer requests manually.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {(['pending', 'confirmed', 'paid', 'rejected', 'all'] as const).map((value) => (
                <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold capitalize ${filter === value ? 'tab-active' : 'tab-inactive'}`}>{value}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-muted">Loading requests…</div>
          ) : visibleRequests.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#F5F3EE] font-semibold">No {filter === 'all' ? '' : filter} requests</p>
              <p className="text-sm text-muted mt-2">The queue is clear for now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[760px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted border-b border-line">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Request</th>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((request) => (
                    <tr key={request.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-4">
                        <p className="text-sm text-[#F5F3EE]">{request.profiles?.name || 'Unknown customer'}</p>
                        <p className="text-xs text-muted mt-1">{request.profiles?.username || request.profiles?.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-[#F5F3EE] capitalize">{request.type}</p>
                        <p className="text-xs font-mono text-muted mt-1">{request.amount ? `N$${request.amount.toFixed(2)}` : 'No amount'}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gold">{request.reference}</td>
                      <td className="px-5 py-4"><span className={`badge border capitalize ${statusStyles[request.status]}`}>{request.status}</span></td>
                      <td className="px-5 py-4">
                        <select value={request.status} disabled={busyId === request.id} onChange={(event) => void updateStatus(request.id, event.target.value as RequestStatus)} className="bg-navy-500 border border-line rounded-md px-2 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-gold/40">
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="paid">Paid</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="p-5 border-b border-line">
            <h2 className="text-xl font-bold text-white">Customer balances</h2>
            <p className="text-xs text-muted mt-1">Balances are manually updated here until payments are connected.</p>
          </div>
          <div className="divide-y divide-line">
            {profiles.filter((item) => item.role !== 'admin').map((item) => (
              <div key={item.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-royal/50 flex items-center justify-center"><Users size={16} className="text-gold" /></div>
                  <div>
                    <p className="text-sm text-[#F5F3EE]">{item.name || 'Unnamed customer'}</p>
                    <p className="text-xs text-muted">{item.username || item.phone || 'No username yet'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-[#F5F3EE]">N${item.balance.toFixed(2)}</span>
                  <button onClick={() => { setBalanceUser(item); setBalance(String(item.balance)); }} className="btn-ghost !px-3 !py-2 text-xs"><Banknote size={14} /> Edit balance</button>
                </div>
              </div>
            ))}
            {profiles.filter((item) => item.role !== 'admin').length === 0 && <div className="p-8 text-center text-sm text-muted">No customers yet.</div>}
          </div>
        </section>
      </main>

      {balanceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-navy-700/90 backdrop-blur-sm" onClick={() => setBalanceUser(null)} aria-label="Close balance editor" />
          <div className="relative w-full max-w-sm bg-surface border border-line rounded-md p-6">
            <button onClick={() => setBalanceUser(null)} className="absolute top-4 right-4 text-muted hover:text-white" aria-label="Close"><X size={19} /></button>
            <h2 className="text-xl font-bold text-white">Update balance</h2>
            <p className="text-sm text-muted mt-2">{balanceUser.name || balanceUser.username}</p>
            <label className="label mt-5">New balance <span className="text-muted">(NAD)</span></label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gold font-mono">N$</span>
              <input className="input pl-10 font-mono" type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} />
            </div>
            <button onClick={() => void saveBalance()} disabled={busyId === balanceUser.id} className="btn-gold w-full mt-5">{busyId === balanceUser.id ? 'Saving…' : 'Save balance'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
