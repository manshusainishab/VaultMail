import { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle2, Mail } from 'lucide-react';

const ENDPOINT = 'https://quick-send-mail.vercel.app/api/send-email';
const ADMIN_EMAIL = 'manshupallav@gmail.com';

export default function RequestAccessModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state on open
  useEffect(() => {
    if (open) {
      setEmail('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ADMIN_EMAIL,
          subject: 'VaultMail — Test user access request',
          text: `New test user access request from: ${email}\n\nAdd this email to Google Cloud Console > APIs & Services > OAuth consent screen > Test users.`,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message?.includes('Failed to fetch')
        ? 'Network blocked the request. Try emailing manshupallav@gmail.com directly.'
        : 'Could not send the request. Try again or email manshupallav@gmail.com directly.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md card p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-300 hover:text-ink-900 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {status !== 'success' ? (
          <>
            <p className="font-mono text-xs text-flame uppercase tracking-widest mb-2">
              test user access
            </p>
            <h2 className="font-display text-2xl tracking-tight">Become a test user</h2>
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">
              VaultMail is in Google's Test mode, so you need to be approved before signing in. Drop your Gmail and we'll add you within minutes.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white ring-1 ring-ink-100 rounded-md focus:ring-flame focus:outline-none"
                  disabled={status === 'sending'}
                />
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-700 leading-relaxed">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending' || !email}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-wait"
              >
                {status === 'sending'
                  ? <><Loader2 size={14} className="animate-spin" /> sending…</>
                  : <>request access</>}
              </button>
            </form>

            <p className="mt-4 font-mono text-[10px] text-ink-300 leading-relaxed">
              Only your email is shared. No marketing, no list, no follow-ups. Approval is manual and usually within a few hours.
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-sage/10 grid place-items-center mx-auto">
              <CheckCircle2 size={22} className="text-sage" />
            </div>
            <h2 className="font-display text-2xl tracking-tight mt-4">Admin notified</h2>
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">
              Your request has been sent. You'll receive an email when access is granted, usually within a few hours.
            </p>
            <button onClick={onClose} className="btn-ghost mt-5">
              close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
