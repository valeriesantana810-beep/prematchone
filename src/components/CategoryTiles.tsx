import { ArrowUpRight, CircleDollarSign, Dices, Flame, Trophy } from 'lucide-react';

const categories = [
  { title: 'Sportsbook', description: 'Prematch odds across the biggest leagues.', icon: Trophy, accent: 'from-royal/50 to-royal/10', tag: 'Pick your winners', emoji: '🏆', href: 'https://prematch.bet/sport/' },
  { title: 'Crash games', description: 'Quick rounds. Know when to cash out.', icon: Flame, accent: 'from-warning/35 to-warning/5', tag: 'Fast-paced action', emoji: '🔥', href: 'https://prematch.bet/casino/categories/Crashh' },
  { title: 'Casino', description: 'Classic tables and slots, your way.', icon: Dices, accent: 'from-gold/30 to-gold/5', tag: 'Play your favourites', emoji: '🎲', href: 'https://prematch.bet/casino' },
  { title: 'Live betting', description: 'Stay in the moment as games unfold.', icon: CircleDollarSign, accent: 'from-success/30 to-success/5', tag: 'In-play energy', emoji: '💰', href: 'https://prematch.bet/sport/live' },
];

const floatingMultipliers = ['x9.22', 'x1.36', 'x100'];

export function CategoryTiles() {
  return (
    <section id="categories" className="py-20 sm:py-24 border-t border-line">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-9">
          <div>
            <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">Pick your lane</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Everything you're here for.</h2>
          </div>
          <p className="text-muted text-sm max-w-xs leading-relaxed">Choose a category and we'll take you straight to the action on Prematch.Bet.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(({ title, description, icon: Icon, accent, tag, emoji, href }, idx) => (
            <a key={title} href={href} target="_blank" rel="noopener noreferrer" className={`group relative overflow-hidden rounded-md p-5 min-h-[200px] border border-line bg-gradient-to-br ${accent} hover:border-gold/40 transition-all duration-300 hover:-translate-y-1`}>
              {idx === 1 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {floatingMultipliers.map((mult, i) => (
                    <span key={i} className="absolute font-mono text-xs font-bold text-gold/70 animate-float-up" style={{ left: `${20 + i * 30}%`, bottom: '10px', animationDelay: `${i * 1.3}s`, animationDuration: `${3.5 + i * 0.5}s` }}>{mult}</span>
                  ))}
                </div>
              )}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full border border-white/10 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-md bg-navy/60 flex items-center justify-center border border-line text-2xl">{emoji}</div>
                  <ArrowUpRight size={18} className="text-muted group-hover:text-gold transition-colors" />
                </div>
                <div className="mt-auto">
                  <p className="text-[11px] text-gold uppercase tracking-wider font-semibold mb-1">{tag}</p>
                  <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
