import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(){
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, key)

  // SUA TABELA É profiles, não users
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, avatar_url')
    .order('criado_em', { ascending: false })
    .limit(50)

  if(error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
