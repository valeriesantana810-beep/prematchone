import { Trophy } from 'lucide-react';

interface LogoProps {
  compact?: boolean;
  withTagline?: boolean;
}

export function Logo({ compact = false, withTagline = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-md bg-royal border-2 border-gold/50 shadow-lg shadow-royal/20">
        <Trophy className="w-5 h-5 text-gold" strokeWidth={2} />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="font-display text-xl font-bold tracking-tight leading-none text-white">
            Prematch<span className="text-gold">.Bet</span>
          </span>
          {withTagline && (
            <span className="text-[10px] text-muted font-body font-medium tracking-wide mt-0.5">Fast payments on winnings</span>
          )}
        </div>
      )}
    </div>
  );
}
