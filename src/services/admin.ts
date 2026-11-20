import { supabase } from '../lib/supabase';

/**
 * Check if the current authenticated user is an admin.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * Sign in with email and password (admin login).
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Verify user is an admin
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: 'You are not authorized to access the admin panel.' };
  }

  return { error: null };
}

/**
 * Sign out the current user.
 */
export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the current session.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
