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

async function authorize(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { status: 401, user: null }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return { status: 500, user: null }
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return { status: 401, user: null }
  const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean)
  if (!admins.includes(data.user.id)) return { status: 403, user: null }
  return { status: 200, user: data.user }
}

export async function GET(req: Request) {
  const auth = await authorize(req)
  if (!auth.user) return Response.json({ error: auth.status === 403 ? 'Acesso negado' : auth.status === 500 ? 'Configuração de autenticação indisponível' : 'Não autorizado' }, { status: auth.status })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return Response.json({ error: 'Serviço administrativo indisponível' }, { status: 500 })
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const [profilesResult, watchResult, seriesResult] = await Promise.all([
    fetchAll(supabase.from('profiles').select('id')),
    fetchAll(supabase.from('watchlist').select('serie_id')),
    fetchAll(supabase.from('series').select('id,titulo,generos')),
  ])
  if ([profilesResult.error, watchResult.error, seriesResult.error].some(Boolean)) {
    return Response.json({ error: 'Falha ao consultar estatísticas' }, { status: 500 })
  }

  const profiles = profilesResult.data || []
  const watchlist = watchResult.data || []
  const series = seriesResult.data || []
  const map = new Map(series.map((s: any) => [String(s.id), s]))
  const counts: Record<string, number> = {}
  const genres: Record<string, number> = {}
  watchlist.forEach((w: any) => {
    const s: any = map.get(String(w.serie_id))
    if (!s) return
    const title = s.titulo || `Série ${w.serie_id}`
    counts[title] = (counts[title] || 0) + 1
    const values = s.generos || []
    ;(Array.isArray(values) ? values : [values]).forEach((g: string) => { if (g) genres[g] = (genres[g] || 0) + 1 })
  })

  return Response.json({
    totalUsuarios: profiles.length,
    totalWatchlist: watchlist.length,
    topSeries: Object.entries(counts).map(([titulo, count]) => ({ titulo, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
    topGeneros: Object.entries(genres).map(([genero, count]) => ({ genero, count }))
      .sort((a, b) => b.count - a.count),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
