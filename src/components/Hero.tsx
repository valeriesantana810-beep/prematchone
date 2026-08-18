import { useEffect, useState } from 'react';
import { ArrowUpRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { PLATFORM_URL, whatsappLink } from '@/lib/constants';
import { supabase, type Fixture } from '@/lib/supabase';

export function Hero() {
  const [topFixtures, setTopFixtures] = useState<Fixture[]>([]);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('fixtures')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error('Failed to load fixtures:', error.message);
        const upcoming = ((data as Fixture[] | null) ?? []).filter(
          (f) => !f.commence_time || new Date(f.commence_time).getTime() > Date.now() - 3 * 3600000,
        );
        setTopFixtures(upcoming.slice(0, 2));
      });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="relative overflow-hidden hero-radial bg-grid">
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-royal/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-56 -left-40 w-[420px] h-[420px] rounded-full bg-gold/8 blur-3xl pointer-events-none" />
      <div className="container-app relative grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center min-h-[620px] py-16 lg:py-24">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-md border border-gold/25 bg-gold/8 px-3.5 py-2 text-xs font-semibold tracking-wide text-gold mb-7">
            <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
            Your front door to Prematch.Bet
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[.98] tracking-tight text-white text-balance">
            Your game.<br />
            <span className="text-gold">Your call.</span><br />
            <span className="text-gold">Your way in.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base sm:text-lg leading-relaxed text-muted">
            Build your picks, request account help, and get connected to sport and casino action — all through one simple WhatsApp-first experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <a href={whatsappLink('Hi Prematch.Bet, I would like to get started.')} target="_blank" rel="noopener noreferrer" className="btn-green">
              <MessageCircle size={19} /> Chat on WhatsApp <ArrowUpRight size={16} />
            </a>
            <a href={PLATFORM_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">
              Go to Prematch.Bet <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-9 text-xs text-muted">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-success" /> Trusted connection</span>
            <span className="flex items-center gap-1.5"><Sparkles size={15} className="text-gold" /> Fast payments on winnings</span>
          </div>
        </div>

        {topFixtures.length > 0 && (
          <div className="relative hidden lg:block animate-fade-in">
            <div className="absolute -inset-5 bg-royal/20 blur-3xl rounded-full" />
            <div className="relative card p-7 transition-transform duration-500">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <p className="font-display font-bold text-xl text-white">Live board</p>
                  <p className="text-xs text-muted mt-1">Today's featured odds</p>
                </div>
                <span className="badge bg-live/10 text-live">
                  <span className="w-1.5 h-1.5 bg-live rounded-full animate-pulse-live" /> Live
                </span>
              </div>
              <div className="space-y-3">
                {topFixtures.map((fixture) => (
                  <div key={fixture.id} className="rounded-md bg-navy-500/60 p-4 border border-line">
                    <div className="flex justify-between text-xs text-muted mb-3"><span>{fixture.league_name}</span><span>{fixture.kickoff_time}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-semibold text-white">{fixture.home_team}</span><span className="font-mono text-gold font-bold">{Number(fixture.home_odds).toFixed(2)}</span></div>
                    <div className="h-px bg-line my-2" />
                    <div className="flex justify-between items-center"><span className="text-sm font-semibold text-white">{fixture.away_team}</span><span className="font-mono text-gold font-bold">{Number(fixture.away_odds).toFixed(2)}</span></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-line">
                <span className="text-xs text-muted">Tap odds to build your slip</span>
                <a href="#odds" className="text-xs text-gold hover:text-gold-300">View all odds</a>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-7 card px-4 py-3 flex items-center gap-3 shadow-xl">
              <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center"><MessageCircle size={18} className="text-success" /></div>
              <div><p className="text-xs font-semibold text-white">WhatsApp-first</p><p className="text-[11px] text-muted">Fast &amp; personal</p></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
