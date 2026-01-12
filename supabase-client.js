import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase project URL and anon/public key (replace if needed)
export const SUPABASE_URL = 'https://httzzsenwnniqqitrdoo.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dHp6c2Vud25uaXFxaXRyZG9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzNjI3MCwiZXhwIjoyMDgzODEyMjcwfQ.esa1ulhK_jIhrEwpJlIvy6PEhSQ48rXofquzY-Z52iY'

export function isAnonKeyConfigured() {
  return SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('REPLACE') && !SUPABASE_ANON_KEY.includes('process.env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
