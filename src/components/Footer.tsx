import { ArrowUpRight, MessageCircle, MapPin, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { PLATFORM_URL, WHATSAPP_NUMBER, whatsappLink } from '@/lib/constants';

export function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-navy-600/50">
      <div className="container-app py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <Logo withTagline />
            <p className="text-sm text-muted leading-relaxed max-w-xs mt-5">Your WhatsApp-first front door to sport and casino action on Prematch.Bet.</p>
            <a href={whatsappLink('Hi Prematch.Bet, I have a question.')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-300 mt-5">
              <MessageCircle size={16} /> Chat with the team
            </a>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-4">Explore</p>
            <div className="space-y-3 text-sm">
              <a href="#categories" className="block text-muted hover:text-white">Sport &amp; Casino</a>
              <a href="#odds" className="block text-muted hover:text-white">Today’s odds</a>
              <a href="#account" className="block text-muted hover:text-white">Account requests</a>
              <a href="#how-it-works" className="block text-muted hover:text-white">How it works</a>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-4">Find us</p>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-1.5 text-muted"><MapPin size={14} className="text-gold/70" /> Windhoek, Namibia</p>
              <a href={`tel:+${WHATSAPP_NUMBER}`} className="block text-muted hover:text-white">+264 81 443 5774</a>
              <a href={PLATFORM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-white">Prematch.Bet <ArrowUpRight size={14} /></a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <p className="flex items-start gap-2 text-xs text-muted max-w-xl">
            <ShieldAlert size={15} className="text-gold/70 shrink-0 mt-0.5" />
            <span>18+ only. Gambling can be addictive. Please play responsibly and within your limits. If you need help, speak to a qualified support service.</span>
          </p>
          <p className="text-xs text-muted shrink-0">© {new Date().getFullYear()} Prematch.Bet</p>
        </div>
      </div>
    </footer>
  );
}
