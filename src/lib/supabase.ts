import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type RequestType = 'registration' | 'deposit' | 'withdrawal';
export type RequestStatus = 'pending' | 'confirmed' | 'paid' | 'rejected';
export type AccountStatus = 'pending' | 'confirmed' | 'suspended';
export type UserRole = 'user' | 'admin';
export type PickStatus = 'pending' | 'sent';

export interface Profile {
  id: string;
  name: string;
  phone: string;
  username: string | null;
  account_status: AccountStatus;
  role: UserRole;
  balance: number;
  created_at: string;
}

export interface BetRequest {
  id: string;
  user_id: string;
  type: RequestType;
  amount: number | null;
  status: RequestStatus;
  reference: string;
  whatsapp_message: string;
  created_at: string;
  updated_at: string;
}

export interface PickItem {
  match: string;
  market: string;
  selection: string;
  odds: number;
}

export interface Pick {
  id: string;
  user_id: string | null;
  items: PickItem[];
  stake: number | null;
  status: PickStatus;
  reference: string;
  created_at: string;
}

export interface Fixture {
  id: string;
  league: string;
  league_name: string;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  commence_time: string | null;
  market: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  sort_order: number;
  is_active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}
