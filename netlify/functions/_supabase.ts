import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

type Database = any; // Use Supabase generated types if available

let client: SupabaseClient<Database> | null = null;

export const getServiceSupabase = (): SupabaseClient<Database> => {
  if (client) {
    return client;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceRole) {
    throw new Error('Supabase environment variables are missing.');
  }

  client = createClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'netlify-functions' } },
  });

  return client;
};
