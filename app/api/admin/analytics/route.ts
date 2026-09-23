import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!
  )

  const { data: series } = await supabase.from('series').select('id_tmdb, titulo, generos')

  const generoCount: Record<string, number> = {}
  series?.forEach((s: any) => {
    let generos = s.generos
    if (typeof generos === 'string') {
      try { generos = JSON.parse(generos) } catch { generos = [generos] }
    }
    if (Array.isArray(generos)) {
      generos.forEach((g: any) => {
        if (!g) return
        const nome = g.toString().replace(/[{}"]/g, '').trim()
        if (nome) generoCount[nome] = (generoCount[nome] || 0) + 1
      })
    }
  })

  const generosMaisVistos = Object.entries(generoCount)
  .map(([genero, total]) => ({ genero, total: total as number }))
  .sort((a, b) => (a.total as number) - (b.total as number))
  .reverse()

  const { data: watchlist } = await supabase.from('watchlist').select('serie_id')

  const topMap: Record<string, number> = {}
  watchlist?.forEach((w: any) => {
    const id = String(w.serie_id)
    topMap[id] = (topMap[id] || 0) + 1
  })

  const topSeries = Object.entries(topMap)
  .map(([id, total]) => {
      const serie = series?.find((s: any) => String(s.id_tmdb) === id)
      return { titulo: serie?.titulo || `ID ${id}`, total: total as number }
    })
  .sort((a, b) => (b.total as number) - (a.total as number))
  .slice(0, 5)

  return Response.json({
    generosMaisVistos,
    topSeries,
    totalSeries: series?.length || 0,
    totalWatchlist: watchlist?.length || 0
  })
}
