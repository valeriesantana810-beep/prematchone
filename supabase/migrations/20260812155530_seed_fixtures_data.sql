/*
# Prematch.Bet — seed fixtures with current demo odds

## Summary
Populates the `fixtures` table with the same fixtures and odds values that were
previously hardcoded in `src/lib/odds-data.ts`. This ensures the public odds page
shows data immediately after switching to live database reads.

## Data
12 fixtures across 4 leagues (EPL, La Liga, Serie A, Champions League), 3 per league.
All values match the previous hardcoded demo values exactly.

## Security
No schema changes. INSERT only — no policy or RLS modifications.
*/

INSERT INTO fixtures (league, league_name, home_team, away_team, kickoff_time, market, home_odds, draw_odds, away_odds, sort_order, is_active) VALUES
  ('epl', 'Premier League', 'Arsenal', 'Chelsea', '15:00', 'Match Result', 2.10, 3.40, 3.20, 1, true),
  ('epl', 'Premier League', 'Liverpool', 'Man City', '17:30', 'Match Result', 2.45, 3.50, 2.70, 2, true),
  ('epl', 'Premier League', 'Tottenham', 'Aston Villa', '20:00', 'Match Result', 1.95, 3.60, 3.80, 3, true),
  ('laliga', 'La Liga', 'Real Madrid', 'Barcelona', '16:00', 'Match Result', 2.20, 3.30, 3.00, 1, true),
  ('laliga', 'La Liga', 'Atletico Madrid', 'Sevilla', '18:30', 'Match Result', 1.85, 3.40, 4.20, 2, true),
  ('laliga', 'La Liga', 'Real Sociedad', 'Valencia', '21:00', 'Match Result', 2.30, 3.20, 3.10, 3, true),
  ('seriea', 'Serie A', 'Inter', 'Juventus', '17:00', 'Match Result', 2.05, 3.25, 3.35, 1, true),
  ('seriea', 'Serie A', 'AC Milan', 'Napoli', '19:45', 'Match Result', 2.40, 3.30, 2.80, 2, true),
  ('seriea', 'Serie A', 'Roma', 'Lazio', '20:00', 'Match Result', 2.55, 3.20, 2.75, 3, true),
  ('ucl', 'Champions League', 'Bay Munich', 'PSG', '20:00', 'Match Result', 1.90, 3.50, 3.80, 1, true),
  ('ucl', 'Champions League', 'Borussia Dortmund', 'Atletico Madrid', '20:00', 'Match Result', 2.50, 3.30, 2.85, 2, true),
  ('ucl', 'Champions League', 'PSV', 'Arsenal', '17:45', 'Match Result', 3.90, 3.40, 2.00, 3, true)
ON CONFLICT DO NOTHING;