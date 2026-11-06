import { createClient } from '@supabase/supabase-js'

// Publishable key is intended for browser use. Database access remains protected
// by Supabase Auth and the Row Level Security policies in the migration.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  || 'https://bispnfwbfmcmpplyzeme.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  || 'sb_publishable_5ljSWWflv7852T74wzqmOQ_7meiD7Nb'

export const isSupabaseConfigured = Boolean(url && key)
export const supabase = isSupabaseConfigured ? createClient(url, key) : null
