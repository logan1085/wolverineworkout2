'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase';
import { requestPasswordReset, updateRecoveredPassword, type RecoveryResult } from '@/lib/password-recovery';

export default function PasswordRecoveryForm({ available = true, userId }: { available?: boolean; userId?: string }) {
  const updating = userId !== undefined;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const pending = useRef(false);
  const message = useRef<HTMLParagraphElement>(null);
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  useEffect(() => { if (result) message.current?.focus(); }, [result]);
  if (!available) return <><p role="status">Password reset is temporarily unavailable because the account service is not connected. Your local training records are still on this device.</p><button className="confirmation-action" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>{refreshing ? "Checking…" : "Check again"} <span aria-hidden="true">↻</span></button></>;
  return <>
    {result && <p ref={message} tabIndex={-1} role={result.ok ? 'status' : 'alert'} className="recovery-message">{result.message}</p>}
    {result?.ok ? <Link className="confirmation-action" href={updating ? '/?tab=Today' : '/?tab=Connections'}>{updating ? 'Open my training' : 'Back to sign in'} <span aria-hidden="true">→</span></Link> : <form className="recovery-form" aria-busy={busy} onSubmit={async e => {
      e.preventDefault();
      if (pending.current) return;
      pending.current = true; setBusy(true); setResult(null);
      const form = e.currentTarget;
      const values = new FormData(form);
      try {
        const auth = createClient().auth;
        const outcome = updating
          ? await updateRecoveredPassword(auth, userId, String(values.get('password') ?? ''), String(values.get('confirmation') ?? ''))
          : await requestPasswordReset(auth, String(values.get('email') ?? ''), window.location.origin);
        setResult(outcome);
        if (outcome.ok) form.reset();
      } catch { setResult({ok:false,message:'The account service is unavailable. Check Connections and try again.'}); }
      finally { pending.current = false; setBusy(false); }
    }}>
      <fieldset disabled={busy}>
        {updating ? <><label htmlFor="recovery-password">New password</label><input id="recovery-password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="recovery-hint"/><p id="recovery-hint">Use at least 8 characters. A unique passphrase works well.</p><label htmlFor="recovery-confirmation">Confirm new password</label><input id="recovery-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required/></> : <><label htmlFor="recovery-email">Your account email</label><input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254}/><p>Open the reset link in this same browser.</p></>}
        <button type="submit" className="confirmation-action">{busy ? (updating ? 'Updating…' : 'Requesting…') : updating ? 'Update my password' : 'Send reset link'}<span aria-hidden="true">→</span></button>
      </fieldset>
    </form>}
    {updating && !result?.ok && <Link className="confirmation-back" href="/auth/forgot-password">Request a fresh reset link</Link>}
  </>;
}
