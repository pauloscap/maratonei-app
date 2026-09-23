import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: profiles } = await supabase.from('profiles').select('id, criado_em')
  const { data: watchlist } = await supabase.from('watchlist').select('serie_id, user_id')
  const { data: series } = await supabase.from('series').select('id, titulo, genero').limit(500)

  const map = new Map((series || []).map((s: any) => [String(s.id), s]))
  const counts: any = {}
  const generos: any = {}
  const porUsuario: any = {}

  ;(watchlist || []).forEach((w: any) => {
    const s = map.get(String(w.serie_id))
    const nome = s?.titulo || `ID ${w.serie_id}`
    counts[nome] = (counts[nome] || 0) + 1
    if (s?.genero) generos[s.genero] = (generos[s.genero] || 0) + 1
    if (w.user_id) porUsuario[w.user_id] = (porUsuario[w.user_id] || 0) + 1
  })

  return Response.json({
    totalUsuarios: profiles?.length || 0,
    totalWatchlist: watchlist?.length || 0,
    mediaPorUsuario: watchlist?.length? (watchlist.length / (profiles?.length || 1)).toFixed(1) : 0,
    topSeries: Object.entries(counts).map(([titulo, count]) => ({ titulo, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 10),
    topGeneros: Object.entries(generos).map(([genero, count]) => ({ genero, count })).sort((a: any, b: any) => b.count - a.count),
    topUsuarios: Object.entries(porUsuario).map(([user_id, count]) => ({ user_id, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 5),
    ultimosCadastros: (profiles || []).slice(-5).reverse()
  })
}
