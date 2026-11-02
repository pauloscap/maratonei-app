import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
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
  const [
    { data: profiles, error: profilesError },
    { data: watchlist, error: watchError },
    { data: series, error: seriesError },
  ] = await Promise.all([
    supabase.from('profiles').select('id'),
    supabase.from('watchlist').select('serie_id'),
    supabase.from('series').select('id,titulo,genero').limit(200),
  ])
  if ([profilesError, watchError, seriesError].some(Boolean)) {
    return Response.json({ error: 'Falha ao consultar estatísticas' }, { status: 500 })
  }

  const map = new Map((series || []).map((s: any) => [String(s.id), s]))
  const counts: Record<string, number> = {}
  const genres: Record<string, number> = {}
  ;(watchlist || []).forEach((w: any) => {
    const s: any = map.get(String(w.serie_id))
    if (!s) return
    const title = s.titulo || `Série ${w.serie_id}`
    counts[title] = (counts[title] || 0) + 1
    if (s.genero) genres[s.genero] = (genres[s.genero] || 0) + 1
  })

  return Response.json({
    totalUsuarios: profiles?.length || 0,
    totalWatchlist: watchlist?.length || 0,
    topSeries: Object.entries(counts).map(([titulo, count]) => ({ titulo, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    topGeneros: Object.entries(genres).map(([genero, count]) => ({ genero, count }))
      .sort((a, b) => b.count - a.count),
  })
}
