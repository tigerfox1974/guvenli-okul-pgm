// Supabase project URL and anon key values are safe to expose on the client side.
// Fill these values from your Supabase project settings.
export const SUPABASE_CONFIG = Object.freeze({
  serverSubmitEndpoint: '/api/report',
  url: 'https://yexfzeywnxmottvtrvmp.supabase.co/rest/v1/',
  anonKey: 'sb_publishable_5EngZ0rUKUlolB5qK7gaWA_jVg6zNQF',
  schema: 'public',
  reportsTable: 'anonymous_reports',
  requestTimeoutMs: 10000,
  adminUsers: [
    {
      username: 'operator',
      email: 'operator@kurum.gov.ct.tr',
      allowedRoles: ['operator']
    },
    {
      username: 'supervisor',
      email: 'supervisor@kurum.gov.ct.tr',
      allowedRoles: ['supervisor']
    }
  ]
});
