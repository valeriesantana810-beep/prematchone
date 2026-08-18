import { useEffect, useState } from 'react';
import { X, Mail, LockKeyhole, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ open, onClose, initialMode = 'login' }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError('');
      setSuccess('');
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, name, phone, username);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signup') {
      setSuccess('Account created. Your profile is pending confirmation from the Prematch team.');
      setTimeout(onClose, 1800);
    } else {
      onClose();
    }
  };

  const switchMode = () => {
    setMode((current) => current === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-navy-700/90 backdrop-blur-sm" onClick={onClose} aria-label="Close modal" />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-md shadow-2xl shadow-black/50 animate-slide-up overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-royal via-gold to-royal" />
        <div className="p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors" aria-label="Close">
            <X size={20} />
          </button>
          <div className="flex justify-center mb-5"><Logo compact /></div>
          <h2 className="text-2xl font-bold text-center text-white">{mode === 'login' ? 'Welcome back' : 'Open your account'}</h2>
          <p className="text-center text-muted text-sm mt-1.5 mb-6">
            {mode === 'login' ? 'Sign in to view your picks and requests.' : 'Your account connects to Prematch.Bet through WhatsApp.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Full name</label>
                  <div className="relative"><User className="absolute left-3 top-3.5 text-muted" size={17} /><input className="input pl-10" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
                </div>
                <div>
                  <label className="label">WhatsApp number</label>
                  <div className="relative"><Phone className="absolute left-3 top-3.5 text-muted" size={17} /><input className="input pl-10" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+264 81 234 5678" /></div>
                </div>
                <div>
                  <label className="label">Preferred username</label>
                  <div className="relative"><User className="absolute left-3 top-3.5 text-muted" size={17} /><input className="input pl-10 font-mono" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" /></div>
                </div>
              </>
            )}
            <div>
              <label className="label">Email address</label>
              <div className="relative"><Mail className="absolute left-3 top-3.5 text-muted" size={17} /><input type="email" className="input pl-10" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative"><LockKeyhole className="absolute left-3 top-3.5 text-muted" size={17} /><input type="password" className="input pl-10" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
            </div>

            {error && <div className="bg-error/10 border border-error/30 text-error-200 rounded-md px-4 py-3 text-sm">{error}</div>}
            {success && <div className="bg-success/10 border border-success/30 text-success-300 rounded-md px-4 py-3 text-sm">{success}</div>}

            <button className="btn-gold w-full mt-2" type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="flex items-center gap-2 justify-center mt-6 text-xs text-muted"><ShieldCheck size={14} className="text-gold" /> Your account details are kept private</div>
          <p className="text-center text-sm text-muted mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button className="text-gold hover:text-gold-300 font-semibold" onClick={switchMode}>{mode === 'login' ? 'Create one' : 'Log in'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
