import { createClient } from "@supabase/supabase-js"

let client

// Shared browser client: one persisted session across all app pages.
export function getSupa() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error("Variáveis públicas do Supabase não configuradas.")
    }

    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
        // The callback exchanges the returned code explicitly.
        detectSessionInUrl: false,
      },
    })
  }

  return client
}
