import { useState } from 'react';
import { X, Trash2, MessageCircle, FileDown, ReceiptText, Minus, Plus, CheckCircle2 } from 'lucide-react';
import { usePicks } from '@/context/PicksContext';
import { useAuth } from '@/context/AuthContext';
import { generatePickReference } from '@/lib/reference';
import { supabase, type PickItem } from '@/lib/supabase';
import { whatsappLink } from '@/lib/constants';
import { generatePdfSlip } from '@/components/ConfirmationSlip';

interface MyPicksPanelProps {
  onRequireLogin: () => void;
}

function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function MyPicksPanel({ onRequireLogin }: MyPicksPanelProps) {
  const { items, stake, setStake, isOpen, closePanel, removeItem, clearItems } = usePicks();
  const { user } = useAuth();
  const [reference, setReference] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalOdds = items.reduce((total, item) => total * item.odds, 1);
  const numericStake = Number(stake) || 0;
  const potentialReturn = numericStake * totalOdds;

  const buildMessage = (ref: string) => {
    const picks = items.map((item, index) => `${index + 1}. ${item.match} — ${item.selection} @ ${formatOdds(item.odds)}`).join('\n');
    return `Hi Prematch.Bet, I want to place my picks.\n\nReference: ${ref}\n\n${picks}\n\nCombined odds: ${formatOdds(totalOdds)}\nStake: N${numericStake.toFixed(2)}\nPotential return: N${potentialReturn.toFixed(2)}\n\nPlease confirm my picks.`;
  };

  const ensureReference = () => reference ?? generatePickReference();

  const savePick = async (ref: string) => {
    setSaving(true);
    const { error } = await supabase.from('picks').insert({
      user_id: user?.id ?? null,
      items,
      stake: numericStake || null,
      status: 'sent',
      reference: ref,
    });
    setSaving(false);
    if (error) console.error('Could not save pick:', error.message);
  };

  const handleWhatsApp = async () => {
    if (items.length === 0 || numericStake <= 0) return;
    const ref = ensureReference();
    setReference(ref);
    await savePick(ref);
    window.open(whatsappLink(buildMessage(ref)), '_blank', 'noopener,noreferrer');
    setSaved(true);
  };

  const handleSlip = () => {
    if (items.length === 0 || numericStake <= 0) return;
    const ref = ensureReference();
    setReference(ref);
    generatePdfSlip({ reference: ref, items, stake: numericStake, totalOdds });
  };

  const handleClose = () => {
    setSaved(false);
    closePanel();
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <button className="absolute inset-0 bg-navy-700/70 backdrop-blur-sm" onClick={handleClose} aria-label="Close picks" />
      </div>
      <aside className={`fixed z-50 top-0 right-0 h-full w-full max-w-md bg-surface border-l border-line shadow-2xl shadow-black/60 transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-label="My picks">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <p className="text-gold text-xs uppercase tracking-[0.2em] font-semibold">Your slip</p>
            <h2 className="text-2xl font-bold text-white">My picks <span className="font-mono text-sm text-muted">({items.length})</span></h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-md text-muted hover:text-white hover:bg-white/10" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-md bg-royal/30 border border-line flex items-center justify-center mb-4"><ReceiptText className="text-gold" size={28} /></div>
              <h3 className="text-lg font-bold text-white">Your slip is empty</h3>
              <p className="text-sm text-muted mt-2 max-w-[240px]">Tap any gold odd in Today's Odds to add it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider"><span>Match selections</span><button className="text-error hover:text-error-200 normal-case tracking-normal" onClick={clearItems}>Clear all</button></div>
              {items.map((item: PickItem, index: number) => (
                <div key={`${item.match}-${item.selection}`} className="card p-3.5 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-white text-sm font-semibold truncate">{item.match}</p><p className="text-xs text-muted mt-1">{item.market}: <span className="text-[#F5F3EE]">{item.selection}</span></p></div>
                    <div className="flex items-center gap-2 shrink-0"><span className="font-mono font-semibold text-gold">{formatOdds(item.odds)}</span><button onClick={() => removeItem(index)} className="text-muted hover:text-error transition-colors" aria-label={`Remove ${item.match}`}><Trash2 size={15} /></button></div>
                  </div>
                </div>
              ))}
              <div className="card p-4 mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-muted">Combined odds</span><span className="font-mono text-gold font-semibold">{formatOdds(totalOdds)}</span></div>
                <div className="h-px bg-line" />
                <label className="label mb-0">Your stake <span className="text-muted font-normal">(NAD)</span></label>
                <div className="relative"><span className="absolute left-4 top-3.5 text-gold font-mono">N$</span><input type="number" min="1" step="1" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="Enter stake" className="input pl-12 font-mono" /></div>
                <div className="flex items-center gap-2">
                  {[50, 100, 200].map((amount) => <button key={amount} onClick={() => setStake(String(amount))} className="flex-1 text-xs font-mono py-2 rounded-md bg-white/5 border border-line text-[#F5F3EE] hover:border-gold/40 hover:text-gold transition-colors">N${amount}</button>)}
                </div>
                <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-md px-3 py-2"><span className="text-xs text-muted">Potential return</span><span className="font-mono text-success font-semibold">N${potentialReturn.toFixed(2)}</span></div>
              </div>
              {saved && <div className="flex items-center gap-2 text-success text-sm px-1"><CheckCircle2 size={16} /> Sent to WhatsApp. Ref: <span className="font-mono">{reference}</span></div>}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-5 border-t border-line space-y-2">
            {!user && <p className="text-xs text-muted text-center mb-2">You can send picks without an account. <button onClick={onRequireLogin} className="text-gold hover:underline">Log in to save history.</button></p>}
            <button onClick={handleWhatsApp} disabled={numericStake <= 0 || saving} className="btn-gold w-full"><MessageCircle size={18} /> {saving ? 'Saving…' : 'Send picks on WhatsApp'}</button>
            <button onClick={handleSlip} disabled={numericStake <= 0} className="btn-ghost w-full"><FileDown size={17} /> Generate confirmation slip</button>
            <p className="text-[11px] text-muted text-center">WhatsApp opens on your device. Nothing is sent automatically.</p>
          </div>
        )}
      </aside>
    </>
  );
}
