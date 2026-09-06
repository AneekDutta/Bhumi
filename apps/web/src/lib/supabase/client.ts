import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://ykxcoihvfzgykrkabbdy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGNvaWh2ZnpneWtya2FiYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTEyNzEsImV4cCI6MjEwNDAyNzI3MX0.8-0CWlQjD-2IO3T0d5c5u6AJOWfKeHpCUMDYSzuDUCE';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return createBrowserClient(url, anonKey);
}

