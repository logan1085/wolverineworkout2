import Link from "next/link";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import "./confirmation.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Email confirmation — Wolverine",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ConfirmationPage({ searchParams }: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;
  let confirmed = false;
  let unavailable = result === "unavailable";
  if (result === "confirmed") {
    try {
      // Query parameters are not evidence of authentication.
      confirmed = !!(await getAuthenticatedUser());
    } catch { unavailable = true; }
  }
  return <main className="confirmation-page">
    <Link prefetch={false} className="confirmation-brand" href="/">wolverine<span>YOUR MARATHON TRAINER</span></Link>
    <section aria-labelledby="confirmation-title">
      <span className="confirmation-symbol" aria-hidden="true">{confirmed ? "✓" : "↗"}</span>
      <p className="confirmation-eyebrow">YOUR ACCOUNT</p>
      <h1 id="confirmation-title">{confirmed ? "You’re ready to get started." : unavailable ? "Let’s try again shortly." : "Let’s get you signed in."}</h1>
      <p>{confirmed ? "Your account is signed in. Head back to your race goal and training week." : unavailable ? "We couldn’t reach the account service to finish this step. Return to Connections to check its status, then try signing in." : "We couldn’t confirm a sign-in from this link. It may have expired, already been used, or opened in a different browser. Try signing in with your email and password."}</p>
      {!confirmed && <p className="confirmation-hint">For a new confirmation link, open it in the same browser where you created your account. Your local training records stay on their original device.</p>}
      <Link prefetch={false} className="confirmation-action" href={confirmed ? "/?tab=Today" : "/?tab=Connections"}>{confirmed ? "Open my training" : "Go to Connections"}<span aria-hidden="true">→</span></Link>
      {!confirmed && <Link prefetch={false} className="confirmation-back" href="/auth/forgot-password">Forgot your password?</Link>}
      <Link prefetch={false} className="confirmation-back" href="/">Back to Wolverine</Link>
    </section>
    <p className="confirmation-footer">Your personal trainer for your marathon.</p>
  </main>;
}
