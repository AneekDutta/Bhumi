import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && typeof window !== 'undefined') {
    console.error('Supabase browser authentication is not configured.');
  }
  
  return createBrowserClient(url, anonKey);
}