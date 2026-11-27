import { createClient } from "@supabase/supabase-js"

let client

export function getSupa() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY,
      {
        auth: {
          // Keep the browser session between visits and refresh expired access tokens.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return client
}
