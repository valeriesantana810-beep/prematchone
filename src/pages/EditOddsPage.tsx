import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Lock, Loader2, Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, type Fixture } from '@/lib/supabase';
import { LEAGUES } from '@/lib/odds-data';

interface EditOddsPageProps {
  onBack: () => void;
}

interface EditableFixture extends Fixture {
  _changed?: boolean;
}

export function EditOddsPage({ onBack }: EditOddsPageProps) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checking, setChecking] = useState(false);

  const [fixtures, setFixtures] = useState<EditableFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadFixtures = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fixtures')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Failed to load fixtures:', error.message);
    }
    setFixtures((data as Fixture[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) void loadFixtures();
  }, [authed, loadFixtures]);

  const checkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setPasswordError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-update-fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, fixtures: [] }),
      });
      const data = await response.json();

      if (response.status === 401) {
        setPasswordError('Wrong password. Try again.');
        setChecking(false);
        return;
      }
      if (response.ok) {
        setAuthed(true);
        setChecking(false);
        return;
      }
      setPasswordError(data.error || 'Something went wrong.');
      setChecking(false);
    } catch {
      setPasswordError('Network error. Please try again.');
      setChecking(false);
    }
  };

  const updateFixture = (id: string, field: keyof EditableFixture, value: string | number | boolean) => {
    setFixtures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value, _changed: true } : f)),
    );
  };

  const addFixture = () => {
    const newFixture: EditableFixture = {
      id: crypto.randomUUID(),
      league: 'epl',
      league_name: 'Premier League',
      home_team: '',
      away_team: '',
      kickoff_time: '15:00',
      commence_time: null,
      market: 'Match Result',
      home_odds: 2.0,
      draw_odds: 3.0,
      away_odds: 3.0,
      sort_order: fixtures.length + 1,
      is_active: true,
      source: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _changed: true,
    };
    setFixtures((prev) => [...prev, newFixture]);
  };

  const removeFixture = (id: string) => {
    setFixtures((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const payload = fixtures.map((f, index) => ({
        id: f.id,
        league: f.league,
        league_name: f.league_name,
        home_team: f.home_team,
        away_team: f.away_team,
        kickoff_time: f.kickoff_time,
        commence_time: f.commence_time ?? null,
        market: f.market,
        home_odds: Number(f.home_odds),
        draw_odds: Number(f.draw_odds),
        away_odds: Number(f.away_odds),
        sort_order: index + 1,
        is_active: f.is_active,
      }));

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-update-fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, fixtures: payload }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveResult({ type: 'error', message: data.error || 'Save failed.' });
        setSaving(false);
        return;
      }

      setSaveResult({ type: 'success', message: `Saved ${payload.length} fixtures.` });
      void loadFixtures();
      setSaving(false);
    } catch {
      setSaveResult({ type: 'error', message: 'Network error. Please try again.' });
      setSaving(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} /> Back to front door
          </button>
          <form onSubmit={checkPassword} className="card p-7">
            <div className="w-12 h-12 rounded-md bg-royal/50 border border-royal/60 flex items-center justify-center mb-5">
              <Lock size={22} className="text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white">Edit Odds</h1>
            <p className="text-sm text-muted mt-2 mb-6">Enter the shared password to manage today's fixtures and odds.</p>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            {passwordError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-error-200">
                <AlertCircle size={15} /> {passwordError}
              </div>
            )}
            <button type="submit" disabled={checking || !password} className="btn-gold w-full mt-5">
              {checking ? <Loader2 size={18} className="animate-spin" /> : <Lock size={17} />} Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <div className="border-b border-line bg-navy/85 backdrop-blur-xl sticky top-0 z-20">
        <div className="container-app h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
              <ArrowLeft size={17} /> Front door
            </button>
            <span className="hidden sm:block h-5 w-px bg-line" />
            <span className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold">
              <Lock size={14} /> Edit Odds
            </span>
          </div>
          <button onClick={onBack} className="text-sm text-muted hover:text-white transition-colors">Done editing</button>
        </div>
      </div>

      <main className="container-app py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <p className="text-gold text-xs uppercase tracking-[.22em] font-semibold mb-3">Admin tools</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">Edit Odds</h1>
            <p className="text-muted mt-2">Update fixtures and odds. Changes go live on the public page after saving.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={addFixture} className="btn-ghost !px-4 !py-2.5 text-sm">
              <Plus size={16} /> Add fixture
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-gold !px-5 !py-2.5 text-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
            </button>
          </div>
        </div>

        {saveResult && (
          <div className={`flex items-center gap-2 mb-5 px-4 py-3 rounded-md border text-sm ${saveResult.type === 'success' ? 'bg-success/10 border-success/25 text-success-300' : 'bg-error/10 border-error/30 text-error-200'}`}>
            {saveResult.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {saveResult.message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading fixtures…
          </div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#F5F3EE] font-semibold">No fixtures yet</p>
            <p className="text-sm text-muted mt-2 mb-4">Add your first fixture to get started.</p>
            <button onClick={addFixture} className="btn-gold !px-5 !py-2.5 text-sm">
              <Plus size={16} /> Add fixture
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fixtures.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture} onChange={updateFixture} onRemove={removeFixture} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <button onClick={addFixture} className="btn-ghost !px-4 !py-2.5 text-sm">
            <Plus size={16} /> Add fixture
          </button>
        </div>
      </main>
    </div>
  );
}

interface FixtureRowProps {
  fixture: EditableFixture;
  onChange: (id: string, field: keyof EditableFixture, value: string | number | boolean) => void;
  onRemove: (id: string) => void;
}

function FixtureRow({ fixture, onChange, onRemove }: FixtureRowProps) {
  const league = LEAGUES.find((l) => l.id === fixture.league) ?? LEAGUES[0];

  return (
    <div className={`card p-4 ${fixture._changed ? 'border-gold/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">League</label>
            <select
              className="input !py-2 text-sm mt-1"
              value={fixture.league}
              onChange={(e) => {
                const selected = LEAGUES.find((l) => l.id === e.target.value);
                onChange(fixture.id, 'league', e.target.value);
                if (selected) onChange(fixture.id, 'league_name', selected.name);
              }}
            >
              {LEAGUES.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">Kickoff</label>
            <input
              className="input !py-2 text-sm mt-1 font-mono"
              value={fixture.kickoff_time}
              onChange={(e) => onChange(fixture.id, 'kickoff_time', e.target.value)}
              placeholder="15:00"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">Home team</label>
            <input
              className="input !py-2 text-sm mt-1"
              value={fixture.home_team}
              onChange={(e) => onChange(fixture.id, 'home_team', e.target.value)}
              placeholder="Home team"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">Away team</label>
            <input
              className="input !py-2 text-sm mt-1"
              value={fixture.away_team}
              onChange={(e) => onChange(fixture.id, 'away_team', e.target.value)}
              placeholder="Away team"
            />
          </div>
        </div>
        <button
          onClick={() => onRemove(fixture.id)}
          className="mt-6 p-2 rounded-md text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
          aria-label="Remove fixture"
        >
          <Trash2 size={17} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-line">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted">Home odds</label>
          <input
            type="number"
            step="0.01"
            className="input !py-2 text-sm mt-1 font-mono"
            value={fixture.home_odds}
            onChange={(e) => onChange(fixture.id, 'home_odds', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted">Draw odds</label>
          <input
            type="number"
            step="0.01"
            className="input !py-2 text-sm mt-1 font-mono"
            value={fixture.draw_odds}
            onChange={(e) => onChange(fixture.id, 'draw_odds', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted">Away odds</label>
          <input
            type="number"
            step="0.01"
            className="input !py-2 text-sm mt-1 font-mono"
            value={fixture.away_odds}
            onChange={(e) => onChange(fixture.id, 'away_odds', e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={fixture.is_active}
            onChange={(e) => onChange(fixture.id, 'is_active', e.target.checked)}
            className="accent-gold"
          />
          Show on public page
        </label>
      </div>
    </div>
  );
}
