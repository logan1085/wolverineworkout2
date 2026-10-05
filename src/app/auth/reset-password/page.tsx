import type { Metadata } from 'next';
import Link from 'next/link';
import PasswordRecoveryForm from '@/components/PasswordRecoveryForm';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import '../confirmed/confirmation.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title:'Choose a new password — Wolverine', robots:{index:false,follow:false}, referrer:'no-referrer' };
export default async function ResetPasswordPage() {
  let user = null;
  try { user = await getAuthenticatedUser(); } catch { /* Show recovery without leaking service details. */ }
  return <main className="confirmation-page"><Link className="confirmation-brand" href="/">wolverine<span>YOUR MARATHON TRAINER</span></Link><section><span className="confirmation-symbol" aria-hidden="true">↗</span><p className="confirmation-eyebrow">YOUR ACCOUNT</p><h1>{user ? 'Choose your new password.' : 'Your reset link needs a fresh start.'}</h1>{user ? <PasswordRecoveryForm userId={user.id}/> : <><p>We couldn’t verify your sign-in. The link may have expired, or the account service may be unavailable. Request a new link and open it in the same browser.</p><Link className="confirmation-action" href="/auth/forgot-password">Request a reset link <span aria-hidden="true">→</span></Link></>}<Link className="confirmation-back" href="/?tab=Connections">Back to Connections</Link></section><p className="confirmation-footer">Your personal trainer for your marathon.</p></main>;
}
