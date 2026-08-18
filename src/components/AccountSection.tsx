import { useState } from 'react';
import { ArrowRight, Banknote, Check, MessageCircle, UserPlus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { generateRequestReference } from '@/lib/reference';
import { supabase, type RequestType } from '@/lib/supabase';
import { whatsappLink } from '@/lib/constants';

interface AccountSectionProps { onRequireLogin: (mode?: 'login' | 'signup') => void; }

const depositPresets = [50, 100, 250, 500];
const withdrawalPresets = [100, 300, 500, 1000];

export function AccountSection({ onRequireLogin }: AccountSectionProps) {
  const [active, setActive] = useState<RequestType | null>(null);

  const openCard = (type: RequestType) => setActive(type);

  return (
    <section id="account" className="py-20 sm:py-24">
      <div className="container-app">
        <div className="max-w-2xl mb-9">
          <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">Make moves, simply.</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">Your account</h2>
          <p className="text-muted mt-4 leading-relaxed">Need a new account or want to move funds? Pick a request below and we'll prepare a message for WhatsApp.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <RequestCard icon={UserPlus} title="Register" description="Request your Prematch.Bet username and get started." onClick={() => openCard('registration')} />
          <RequestCard icon={Banknote} title="Deposit" description="Request funds to be added to your account." onClick={() => openCard('deposit')} />
          <RequestCard icon={Banknote} title="Withdraw" description="Request a payout from your balance." onClick={() => openCard('withdrawal')} />
        </div>

      </div>
      {active && <RequestModal type={active} onClose={() => setActive(null)} onRequireLogin={onRequireLogin} />}
    </section>
  );
}

interface RequestCardProps { icon: typeof UserPlus; title: string; description: string; onClick: () => void; }
function RequestCard({ icon: Icon, title, description, onClick }: RequestCardProps) {
  return (
    <button onClick={onClick} className="group text-left card p-5 hover:border-gold/40 hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="w-11 h-11 rounded-md bg-royal/40 border border-royal/60 flex items-center justify-center">
          <Icon size={21} className="text-gold" />
        </div>
        <ArrowRight size={18} className="text-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white mt-7">{title}</h3>
      <p className="text-sm text-muted leading-relaxed mt-2">{description}</p>
    </button>
  );
}

interface RequestModalProps { type: RequestType; onClose: () => void; onRequireLogin: (mode?: 'login' | 'signup') => void; }
export function RequestModal({ type, onClose, onRequireLogin }: RequestModalProps) {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [username, setUsername] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const presets = type === 'deposit' ? depositPresets : withdrawalPresets;
  const currency = 'N$';

  const labels: Record<RequestType, { title: string; description: string; button: string }> = {
    registration: { title: 'Request registration', description: "We'll prepare your username request for WhatsApp.", button: 'Request registration' },
    deposit: { title: 'Request a deposit', description: 'Choose an amount, then confirm the prepared WhatsApp message.', button: 'Request deposit' },
    withdrawal: { title: 'Request a withdrawal', description: 'Choose an amount from your balance, then send the request.', button: 'Request withdrawal' },
  };
  const config = labels[type];

  const submit = async () => {
    if (!user) { onRequireLogin('signup'); return; }
    if (type === 'registration' && !username) return;
    if (type !== 'registration' && Number(amount) <= 0) return;
    const ref = generateRequestReference();
    const amountValue = type === 'registration' ? null : Number(amount);
    const message = type === 'registration'
      ? `Hi Prematch.Bet, I would like to register an account.\n\nName: ${profile?.name ?? ''}\nUsername requested: ${username}\nReference: ${ref}`
      : `Hi Prematch.Bet, I would like to request a ${type}.\n\nAmount: ${currency}${amountValue?.toFixed(2)}\nReference: ${ref}\nUsername: ${profile?.username ?? 'Not set'}\n\nPlease assist with my request.`;
    setSaving(true);
    const { error } = await supabase.from('requests').insert({ type, amount: amountValue, reference: ref, whatsapp_message: message, status: 'pending' });
    setSaving(false);
    if (error) { window.alert('We could not save this request. Please try again.'); return; }
    setReference(ref);
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-navy-700/90 backdrop-blur-sm" onClick={onClose} aria-label="Close request" />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-md shadow-2xl overflow-hidden animate-slide-up">
        <div className="h-1 bg-gradient-to-r from-royal via-gold to-royal" />
        <div className="p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white" aria-label="Close"><X size={20} /></button>
          <div className="w-12 h-12 rounded-md bg-royal/50 flex items-center justify-center mb-5"><MessageCircle className="text-gold" /></div>
          <h2 className="text-2xl font-bold text-white">{config.title}</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">{config.description}</p>
          {type === 'registration' ? (
            <div className="mt-6">
              <label className="label">Preferred username</label>
              <input className="input font-mono" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" />
            </div>
          ) : type !== 'registration' && (
            <div className="mt-6">
              <label className="label">Amount <span className="text-muted">(NAD)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gold font-mono">{currency}</span>
                <input className="input pl-9 font-mono" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {presets.map((value) => (
                  <button key={value} onClick={() => setAmount(String(value))} className="rounded-md py-2 text-xs font-mono border border-line text-muted hover:border-gold/40 hover:text-gold transition-colors">{currency}{value}</button>
                ))}
              </div>
              {type === 'withdrawal' && profile && <p className="text-xs text-muted mt-3">Available balance: <span className="font-mono text-[#F5F3EE]">{currency}{profile.balance.toFixed(2)}</span></p>}
            </div>
          )}
          {reference ? (
            <div className="mt-6 p-4 rounded-md bg-success/10 border border-success/25">
              <div className="flex items-center gap-2 text-success font-semibold"><Check size={17} /> Request saved</div>
              <p className="text-sm text-muted mt-2">Send the prepared WhatsApp message to finish.</p>
              <p className="font-mono text-gold text-sm mt-3">{reference}</p>
            </div>
          ) : (
            <button onClick={submit} disabled={saving || (type === 'registration' ? !username : Number(amount) <= 0)} className="btn-gold w-full mt-7">
              <MessageCircle size={18} />{saving ? 'Saving…' : config.button}
            </button>
          )}
          <p className="text-[11px] text-muted text-center mt-4">WhatsApp opens on your device. Nothing is sent automatically.</p>
        </div>
      </div>
    </div>
  );
}
