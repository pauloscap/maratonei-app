import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 1000

async function fetchAll(query: any) {
  const rows: any[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1)
    if (error) return { data: null, error }
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null }
  }
}

async function requireAdmin(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { user: null, status: 401 }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return { user: null, status: 500 }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return { user: null, status: 401 }

  const admins = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (!admins.includes(data.user.id)) return { user: null, status: 403 }
  return { user: data.user, status: 200 }
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.user) {
    const message = auth.status === 403 ? 'Acesso negado' : auth.status === 500 ? 'Configuração de autenticação indisponível' : 'Não autorizado'
    return Response.json({ error: message }, { status: auth.status })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return Response.json({ error: 'Serviço administrativo indisponível' }, { status: 500 })
  }
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [
    usersCount, watchCount, seriesCount,
    profilesResult, watchResult, allSeriesResult, filmsResult, userSeriesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('watchlist').select('serie_id', { count: 'exact', head: true }),
    supabase.from('series').select('id', { count: 'exact', head: true }),
    fetchAll(supabase.from('profiles').select('id,nome,username,avatar_url,criado_em').order('criado_em', { ascending: false })),
    fetchAll(supabase.from('watchlist').select('serie_id,user_id').order('user_id').order('serie_id')),
    fetchAll(supabase.from('series').select('id,id_tmdb,tmdb_id,titulo,generos').order('id')),
    fetchAll(supabase.from('user_filmes').select('user_id,titulo,filme_id').order('user_id').order('filme_id')),
    fetchAll(supabase.from('user_series').select('user_id,titulo,serie_id').order('user_id').order('serie_id')),
  ])

  const errors = [
    usersCount.error, watchCount.error, seriesCount.error,
    profilesResult.error, watchResult.error, allSeriesResult.error,
    filmsResult.error, userSeriesResult.error,
  ].filter(Boolean)
  if (errors.length) {
    console.error('[admin/analytics] Falha ao consultar estatísticas:', errors.map((e: any) => e.message))
    return Response.json({ error: 'Falha ao consultar estatísticas' }, { status: 500 })
  }

  const profiles = profilesResult.data || []
  const watch = watchResult.data || []
  const allSeries = allSeriesResult.data || []
  const filmes = filmsResult.data || []
  const seriesU = userSeriesResult.data || []

  const map = new Map<string, any>()
  allSeries.forEach((s: any) => {
    map.set(String(s.id), s)
    if (s.id_tmdb != null) map.set(String(s.id_tmdb), s)
    if (s.tmdb_id != null) map.set(String(s.tmdb_id), s)
  })
  const getSerie = (id: any) => map.get(String(id))

  const countTop: Record<string, number> = {}
  watch.forEach((w: any) => {
    const title = getSerie(w.serie_id)?.titulo
    if (title) countTop[title] = (countTop[title] || 0) + 1
  })
  if (!Object.keys(countTop).length) {
    filmes.forEach((f: any) => { if (f.titulo) countTop[f.titulo] = (countTop[f.titulo] || 0) + 1 })
    seriesU.forEach((s: any) => { if (s.titulo) countTop[s.titulo] = (countTop[s.titulo] || 0) + 1 })
  }
  const topSeries = Object.entries(countTop)
    .map(([titulo, total]) => ({ titulo, total }))
    .sort((a, b) => b.total - a.total).slice(0, 5)

  const genres: Record<string, number> = {}
  watch.forEach((w: any) => {
    const values = getSerie(w.serie_id)?.generos || []
    ;(Array.isArray(values) ? values : [values]).forEach((g: string) => {
      if (g) genres[g] = (genres[g] || 0) + 1
    })
  })
  const generosMaisVistos = Object.entries(genres)
    .map(([genero, total]) => ({ genero, total }))
    .sort((a, b) => b.total - a.total).slice(0, 8)

  const countTitles = (items: any[]) => {
    const counts: Record<string, number> = {}
    items.forEach((item: any) => {
      if (item.titulo) counts[item.titulo] = (counts[item.titulo] || 0) + 1
    })
    return Object.entries(counts).map(([titulo, total]) => ({ titulo, total }))
      .sort((a, b) => b.total - a.total)
  }
  const topFilmesTodos = countTitles(filmes)
  const topSeriesTodos = countTitles(seriesU)

  const filmCounts = new Map<string, number>()
  const seriesCounts = new Map<string, number>()
  filmes.forEach((f: any) => filmCounts.set(f.user_id, (filmCounts.get(f.user_id) || 0) + 1))
  seriesU.forEach((s: any) => seriesCounts.set(s.user_id, (seriesCounts.get(s.user_id) || 0) + 1))
  const usuariosDetalhado = profiles.map((p: any) => {
    const total_filmes = filmCounts.get(p.id) || 0
    const total_series = seriesCounts.get(p.id) || 0
    return { ...p, total_filmes, total_series, total_geral: total_filmes + total_series }
  }).sort((a: any, b: any) => b.total_geral - a.total_geral)

  return Response.json({
    totalUsuarios: usersCount.count || 0,
    totalWatchlist: watchCount.count || 0,
    totalSeries: seriesCount.count || 0,
    topSeries, generosMaisVistos, usuarios: profiles,
    topFilmesTodos, topSeriesTodos, usuariosDetalhado,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
