import { Clock3, Gamepad2, ShieldCheck } from 'lucide-react';

const trustItems = [
  { icon: Clock3, label: 'Fast & clear' },
  { icon: Gamepad2, label: 'Thousands of games' },
  { icon: ShieldCheck, label: '18+ only' },
];

export function TrustRow() {
  return (
    <section className="border-b border-line bg-navy-600/40">
      <div className="container-app grid grid-cols-3 divide-x divide-line py-3">
        {trustItems.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2.5 text-sm text-muted">
            <Icon size={16} className="text-gold" />
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
