import { ArrowUpRight, MessageCircle, MousePointerClick, Send } from 'lucide-react';
import { whatsappLink } from '@/lib/constants';

const steps = [
  { number: '01', icon: MousePointerClick, title: 'Choose your move', description: 'Browse categories, check today’s odds, or choose an account request.' },
  { number: '02', icon: Send, title: 'Build your request', description: 'Add picks or choose an amount. We’ll prepare everything with a clear reference.' },
  { number: '03', icon: MessageCircle, title: 'Chat on WhatsApp', description: 'Tap send to open WhatsApp, then confirm directly with the Prematch team.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-royal/10 border-y border-line">
      <div className="container-app">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-12 items-start">
          <div>
            <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white text-balance">One simple way in.</h2>
            <p className="text-muted mt-5 leading-relaxed max-w-sm">No hunting through menus. No complicated forms. Prematch.Bet keeps the route from your idea to your game clear.</p>
            <a href={whatsappLink('Hi Prematch.Bet, I need help getting started.')} target="_blank" rel="noreferrer" className="btn-outline mt-7">Need help? Chat with us <ArrowUpRight size={16} /></a>
          </div>
          <div className="space-y-4">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="flex gap-5 card p-5 sm:p-6 hover:border-gold/30 transition-colors">
                <span className="font-mono text-sm text-gold/70 pt-1">{number}</span>
                <div className="w-11 h-11 shrink-0 rounded-md bg-navy/60 border border-line flex items-center justify-center">
                  <Icon size={20} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
