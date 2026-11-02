import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return Response.json({ error: 'Configuração de autenticação indisponível' }, { status: 500 })

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admins = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (!admins.includes(authData.user.id)) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return Response.json({ error: 'Serviço administrativo indisponível' }, { status: 500 })

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase
    .from('profiles')
    .select('id,nome,username,avatar_url,criado_em')
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[admin/users] Falha ao consultar usuários:', error.message)
    return Response.json({ error: 'Falha ao consultar usuários' }, { status: 500 })
  }
  return Response.json(data || [], { headers: { 'Cache-Control': 'no-store' } })
}
