import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  )
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase
    .from('profiles')
    .select('id,nome,username,avatar_url,criado_em')
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) return Response.json({ error: 'Falha ao consultar usuários' }, { status: 500 })
  return Response.json(data)
}
