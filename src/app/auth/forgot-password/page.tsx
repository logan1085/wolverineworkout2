import type { Metadata } from 'next';
import Link from 'next/link';
import PasswordRecoveryForm from '@/components/PasswordRecoveryForm';
import { accountStatus } from '@/lib/health/account-status';
import '../confirmed/confirmation.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title:'Reset your password — Wolverine', robots:{index:false,follow:false}, referrer:'no-referrer' };
export default async function ForgotPasswordPage() {
  const available = await accountStatus() === 'ready';
  return <main className="confirmation-page"><Link className="confirmation-brand" href="/">wolverine<span>YOUR MARATHON TRAINER</span></Link><section><span className="confirmation-symbol" aria-hidden="true">↗</span><p className="confirmation-eyebrow">YOUR ACCOUNT</p><h1>Let’s get you back in.</h1><p>Forgot your password? Request a link to choose a new one.</p><PasswordRecoveryForm available={available}/><Link className="confirmation-back" href="/?tab=Connections">Back to Connections</Link></section><p className="confirmation-footer">Your personal trainer for your marathon.</p></main>;
}
