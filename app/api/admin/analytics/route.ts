import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function requireAdmin(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  )
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null

  const admins = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (!admins.includes(data.user.id)) return null
  return data.user
}

export async function GET(req: Request) {
  const user = await requireAdmin(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { count: totalUsuarios, error: usersCountError },
    { count: totalWatchlist, error: watchCountError },
    { count: totalSeries, error: seriesCountError },
    { data: profiles, error: profilesError },
    { data: watch, error: watchError },
    { data: allSeries, error: allSeriesError },
    { data: filmes, error: filmesError },
    { data: seriesU, error: seriesUserError },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('watchlist').select('*', { count: 'exact', head: true }),
    supabase.from('series').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id,nome,username,avatar_url,criado_em'),
    supabase.from('watchlist').select('serie_id,user_id'),
    supabase.from('series').select('id,id_tmdb,tmdb_id,titulo,generos'),
    supabase.from('user_filmes').select('user_id,titulo,filme_id'),
    supabase.from('user_series').select('user_id,titulo,serie_id'),
  ])

  if ([usersCountError, watchCountError, seriesCountError, profilesError, watchError, allSeriesError, filmesError, seriesUserError].some(Boolean)) {
    return Response.json({ error: 'Falha ao consultar estatísticas' }, { status: 500 })
  }

  const map = new Map<string, any>()
  allSeries?.forEach((s: any) => {
    map.set(String(s.id), s)
    map.set(String(s.id_tmdb), s)
    if (s.tmdb_id) map.set(String(s.tmdb_id), s)
  })
  const getSerie = (id: any) => map.get(String(id))

  const countTop: Record<string, number> = {}
  watch?.forEach((w: any) => {
    const title = getSerie(w.serie_id)?.titulo
    if (title) countTop[title] = (countTop[title] || 0) + 1
  })
  if (!Object.keys(countTop).length) {
    filmes?.forEach((f: any) => { countTop[f.titulo] = (countTop[f.titulo] || 0) + 1 })
    seriesU?.forEach((s: any) => { countTop[s.titulo] = (countTop[s.titulo] || 0) + 1 })
  }

  const topSeries = Object.entries(countTop)
    .map(([titulo, total]) => ({ titulo, total }))
    .sort((a, b) => b.total - a.total).slice(0, 5)

  const genres: Record<string, number> = {}
  watch?.forEach((w: any) => {
    const values = getSerie(w.serie_id)?.generos || []
    values.forEach((g: string) => { if (g) genres[g] = (genres[g] || 0) + 1 })
  })
  const generosMaisVistos = Object.entries(genres)
    .map(([genero, total]) => ({ genero, total }))
    .sort((a, b) => b.total - a.total).slice(0, 8)

  const countTitles = (items: any[]) => {
    const counts: Record<string, number> = {}
    items?.forEach((item: any) => { counts[item.titulo] = (counts[item.titulo] || 0) + 1 })
    return Object.entries(counts).map(([titulo, total]) => ({ titulo, total }))
      .sort((a, b) => b.total - a.total)
  }
  const topFilmesTodos = countTitles(filmes || [])
  const topSeriesTodos = countTitles(seriesU || [])

  const usuariosDetalhado = profiles?.map((p: any) => {
    const total_filmes = filmes?.filter((f: any) => f.user_id === p.id).length || 0
    const total_series = seriesU?.filter((s: any) => s.user_id === p.id).length || 0
    return { ...p, total_filmes, total_series, total_geral: total_filmes + total_series }
  }).sort((a: any, b: any) => b.total_geral - a.total_geral)

  return Response.json({
    totalUsuarios, totalWatchlist, totalSeries, topSeries, generosMaisVistos,
    usuarios: profiles, topFilmesTodos, topSeriesTodos, usuariosDetalhado,
  })
}
