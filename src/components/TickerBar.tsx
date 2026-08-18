import { useEffect, useRef, useState } from 'react';
import { supabase, type Fixture } from '@/lib/supabase';

const LEAGUE_LABEL: Record<string, string> = {
  epl: 'EPL',
  laliga: 'La Liga',
  seriea: 'Serie A',
  ucl: 'UCL',
  npl: 'NPL',
};

interface TickerItem {
  league: string;
  match: string;
  odds: string;
}

function fixturesToTicker(fixtures: Fixture[]): TickerItem[] {
  return fixtures
    .filter((f) => f.is_active && (!f.commence_time || new Date(f.commence_time).getTime() > Date.now() - 3 * 3600000))
    .map((f) => ({
      league: LEAGUE_LABEL[f.league] ?? f.league_name,
      match: `${f.home_team} vs ${f.away_team}`,
      odds: Number(f.home_odds).toFixed(2),
    }));
}

export function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('fixtures')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error('Failed to load ticker fixtures:', error.message);
        setItems(fixturesToTicker((data as Fixture[] | null) ?? []));
      });
    return () => { mounted = false; };
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="relative border-b border-line bg-navy-600/60 overflow-hidden">
      <div ref={ref} className="flex items-center gap-6 py-2.5 animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-live" />
            <span className="text-muted font-medium">{item.league}</span>
            <span className="text-[#F5F3EE] font-semibold">{item.match}</span>
            <span className="font-mono font-bold text-gold">{item.odds}</span>
            <span className="text-line">|</span>
          </div>
        ))}
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-navy to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-navy to-transparent pointer-events-none" />
    </div>
  );
}
