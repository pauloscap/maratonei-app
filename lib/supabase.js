import { createClient } from "@supabase/supabase-js"
let client
export function getSupa(){
 if(!client){
  client = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL,
   process.env.NEXT_PUBLIC_SUPABASE_KEY,
   { auth: { persistSession: false, autoRefreshToken: false } }
  )
 }
 return client
}
