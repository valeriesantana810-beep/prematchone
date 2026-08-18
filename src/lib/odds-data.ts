export interface League {
  id: string;
  name: string;
  country: string;
  flag: string;
}

export const LEAGUES: League[] = [
  { id: 'epl', name: 'Premier League', country: 'England', flag: '🏴' },
  { id: 'laliga', name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
  { id: 'seriea', name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
  { id: 'ucl', name: 'Champions League', country: 'Europe', flag: '🏆' },
  { id: 'npl', name: 'Namibia PL', country: 'Namibia', flag: '🇳🇦' },
];
