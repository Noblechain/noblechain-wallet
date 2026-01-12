import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase project URL and anon/public key (replace if needed)
export const SUPABASE_URL = 'https://hslfrufymvfwluctmsdg.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbGZydWZ5bXZmd2x1Y3Rtc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTU3MzgsImV4cCI6MjA4MzYzMTczOH0.vKRrN64v2cTo4SpU9g8GWP6csSLSjWuAGWyoBmET0pM'

export function isAnonKeyConfigured() {
  return SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('REPLACE') && !SUPABASE_ANON_KEY.includes('process.env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
