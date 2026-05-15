import { getSupabaseClient } from './supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeEmail(email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_RE.test(trimmed)) {
    throw new Error('Please enter a valid email address.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Database not configured. Please try again later.');
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: trimmed });

  if (error) {
    // Unique violation — already subscribed
    if ((error as { code?: string }).code === '23505') {
      throw new Error('This email is already subscribed!');
    }
    throw new Error('Could not subscribe right now. Please try again later.');
  }
}
