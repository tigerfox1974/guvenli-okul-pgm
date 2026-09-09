// Supabase project URL and anon key values are safe to expose on the client side.
// Fill these values from your Supabase project settings.
export const SUPABASE_CONFIG = Object.freeze({
  url: '',
  anonKey: '',
  schema: 'public',
  reportsTable: 'anonymous_reports',
  requestTimeoutMs: 10000
});
