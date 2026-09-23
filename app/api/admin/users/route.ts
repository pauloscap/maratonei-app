import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(url!, key!)
    const { data } = await supabase.from('profiles').select('id, nome, email, avatar_url, criado_em').order('criado_em', {ascending:false}).limit(50)
    return Response.json(data || [])
  }catch(e:any){
    return Response.json({ error: e.message }, { status: 500 })
  }
}
