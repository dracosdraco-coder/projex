import { createBrowserClient } from '@supabase/ssr'

// Fallback placeholders prevent crash during static prerender when env vars
// aren't available at build time. Real credentials are always present at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
