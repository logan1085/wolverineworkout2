import type { SupabaseClient } from '@supabase/supabase-js';
type RecoveryAuth = Pick<SupabaseClient['auth'], 'resetPasswordForEmail' | 'getUser' | 'updateUser'>;
export type RecoveryResult = { ok: boolean; message: string };
export const RESET_REQUESTED = 'If an account uses that address, you’ll receive a reset link. Check your inbox and spam folder, then open the link in this browser.';
export async function requestPasswordReset(auth: RecoveryAuth, email: string, origin: string): Promise<RecoveryResult> {
  try {
    const redirect = new URL('/auth/callback', origin);
    redirect.searchParams.set('flow', 'recovery');
    const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect.toString() });
    if (!error || error.code === 'user_not_found') return { ok: true, message: RESET_REQUESTED };
    return { ok: false, message: error.status === 429 ? 'Too many requests. Wait a few minutes before asking for another link.' : 'We couldn’t request a reset link. Check the account connection and try again.' };
  } catch { return { ok: false, message: 'We couldn’t reach the account service. Try again when the connection returns.' }; }
}
export async function updateRecoveredPassword(auth: RecoveryAuth, expectedUserId: string, password: string, confirmation: string): Promise<RecoveryResult> {
  if (password.length < 8) return { ok: false, message: 'Use at least 8 characters for your new password.' };
  if (password !== confirmation) return { ok: false, message: 'The passwords don’t match. Enter the same password in both fields.' };
  try {
    const verified = await auth.getUser();
    if (verified.error || !expectedUserId || verified.data.user?.id !== expectedUserId) return { ok: false, message: 'Your sign-in changed or expired. Open a fresh reset link before updating your password.' };
    const { data, error } = await auth.updateUser({ password });
    if (!error && data.user?.id === expectedUserId) return { ok: true, message: 'Your password has been updated.' };
    return { ok: false, message: error?.code === 'same_password' ? 'Choose a different password from your current one.' : error?.code === 'weak_password' ? 'Choose a stronger password. Your account may require more characters or a mix of letters, numbers and symbols.' : 'We couldn’t confirm the password update. Try signing in with your new password, or request a fresh reset link.' };
  } catch { return { ok: false, message: 'We couldn’t confirm the password update. Check your connection, then try signing in or request a fresh reset link.' }; }
}
