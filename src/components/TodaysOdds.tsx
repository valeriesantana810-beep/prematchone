import { useEffect, useState } from 'react';
import { Clock3, Plus, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { LEAGUES } from '@/lib/odds-data';
import { usePicks } from '@/context/PicksContext';
import { supabase, type Fixture, type PickItem } from '@/lib/supabase';

interface OddSelection {
  label: string;
  odds: number;
}

interface OddEvent {
  id: string;
  match: string;
  league: string;
  startTime: string;
  dayLabel: string;
  market: string;
  selections: OddSelection[];
}

function getDayLabel(commenceTime: string | null): string {
  if (!commenceTime) return 'Today';
  const now = new Date();
  const match = new Date(commenceTime);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDay = new Date(match.getFullYear(), match.getMonth(), match.getDate());
  const diffDays = Math.round((matchDay.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return match.toLocaleDateString('en-GB', { weekday: 'long' });
  return match.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isFixtureUpcoming(commenceTime: string | null): boolean {
  if (!commenceTime) return true;
  return new Date(commenceTime).getTime() > Date.now() - 3 * 3600000;
}

function fixturesToEvents(fixtures: Fixture[]): OddEvent[] {
  return fixtures
    .filter((f) => f.is_active && isFixtureUpcoming(f.commence_time))
    .sort((a, b) => {
      const aTime = a.commence_time ? new Date(a.commence_time).getTime() : 0;
      const bTime = b.commence_time ? new Date(b.commence_time).getTime() : 0;
      return aTime - bTime;
    })
    .map((f) => ({
      id: f.id,
      match: `${f.home_team} vs ${f.away_team}`,
      league: f.league,
      startTime: f.kickoff_time,
      dayLabel: getDayLabel(f.commence_time),
      market: f.market,
      selections: [
        { label: f.home_team, odds: Number(f.home_odds) },
        { label: 'Draw', odds: Number(f.draw_odds) },
        { label: f.away_team, odds: Number(f.away_odds) },
      ],
    }));
}

function formatLastSynced(updatedAt: string | null): string {
  if (!updatedAt) return '';
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function TodaysOdds() {
  const [activeLeague, setActiveLeague] = useState(LEAGUES[0].id);
  const [allEvents, setAllEvents] = useState<OddEvent[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, items, count } = usePicks();

  const loadFixtures = () => {
    setLoading(true);
    supabase
      .from('fixtures')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load fixtures:', error.message);
        const fixtures = (data as Fixture[] | null) ?? [];
        setAllEvents(fixturesToEvents(fixtures));
        const latestUpdate = fixtures.reduce<string | null>((latest, f) => {
          if (!latest) return f.updated_at;
          return f.updated_at > latest ? f.updated_at : latest;
        }, null);
        setLastSynced(latestUpdate);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFixtures();
  }, []);

  const events = allEvents.filter((e) => e.league === activeLeague);

  return (
    <section id="odds" className="py-20 sm:py-24 bg-navy-500/40 border-y border-line">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">Today's odds</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Shortlist your picks</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            {lastSynced && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-live" />
                Last synced: {formatLastSynced(lastSynced)}
              </span>
            )}
            <button onClick={loadFixtures} className="flex items-center gap-1.5 text-gold hover:text-gold-300 transition-colors">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
          {LEAGUES.map((league) => (
            <button key={league.id} onClick={() => setActiveLeague(league.id)} className={`shrink-0 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${activeLeague === league.id ? 'tab-active' : 'tab-inactive'}`}>
              <span className="mr-2">{league.flag}</span>{league.name}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading today's odds…
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-muted">
            No upcoming fixtures for this league. Check back soon.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <OddsCard key={event.id} event={event} selectedItems={items} onAdd={addItem} />
            ))}
          </div>
        )}
        <p className="text-xs text-muted mt-6 text-center">Odds are indicative values. Confirm all picks and prices on Prematch.Bet before placing a bet.</p>
      </div>
    </section>
  );
}

interface OddsCardProps {
  event: OddEvent;
  selectedItems: PickItem[];
  onAdd: (item: PickItem) => void;
}

function OddsCard({ event, selectedItems, onAdd }: OddsCardProps) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted"><Clock3 size={13} className="text-gold" /> {event.dayLabel}, {event.startTime}</div>
          <h3 className="text-base sm:text-lg font-bold text-white mt-1">{event.match}</h3>
        </div>
        <span className="hidden sm:inline-flex badge bg-white/5 text-muted">{event.market}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {event.selections.map((selection) => {
          const selected = selectedItems.some((item) => item.match === event.match && item.selection === selection.label);
          return (
            <OddsButton
              key={selection.label}
              label={selection.label}
              odds={selection.odds}
              selected={selected}
              onClick={() => onAdd({ match: event.match, market: event.market, selection: selection.label, odds: selection.odds })}
            />
          );
        })}
      </div>
    </div>
  );
}

interface OddsButtonProps {
  label: string;
  odds: number;
  selected: boolean;
  onClick: () => void;
}

function OddsButton({ label, odds, selected, onClick }: OddsButtonProps) {
  const [bounce, setBounce] = useState(false);

  const handleClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 400);
    onClick();
  };

  const baseClass = selected
    ? 'bg-gold/15 border-gold text-gold'
    : 'bg-navy-500/50 border-line text-[#F5F3EE] hover:border-gold/50 hover:bg-gold/5';

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-center gap-1 rounded-md border px-2 py-3 transition-all ${baseClass} ${bounce ? 'animate-count-bounce' : ''}`}
    >
      <span className="text-xs truncate max-w-full">{label}</span>
      <span className="font-mono font-semibold text-sm">{odds.toFixed(2)}</span>
      {selected ? (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold text-navy flex items-center justify-center"><Plus size={12} className="rotate-45" /></span>
      ) : (
        <span className="text-[10px] text-muted">tap to add</span>
      )}
    </button>
  );
}
