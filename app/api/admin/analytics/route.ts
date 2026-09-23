import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!
  )

  const { data: series } = await supabase.from('series').select('id_tmdb, titulo, generos')
  const { data: watchlist } = await supabase.from('watchlist').select('serie_id')

  // MAPA id_tmdb -> generos e titulo
  const serieMap: Record<string, any> = {}
  series?.forEach((s: any) => { serieMap[String(s.id_tmdb)] = s })

  const generoCount: Record<string, number> = {}
  const topMap: Record<string, number> = {}

  // AGORA CONTA BASEADO NA WATCHLIST REAL (16 usuários)
  watchlist?.forEach((w: any) => {
    const id = String(w.serie_id)
    topMap[id] = (topMap[id] || 0) + 1

    const serie = serieMap[id]
    let generos = serie?.generos
    if (typeof generos === 'string') {
      try { generos = JSON.parse(generos) } catch { generos = [generos] }
    }
    if (Array.isArray(generos)) {
      generos.forEach((g: any) => {
        const nome = g?.toString().replace(/[{}"]/g, '').trim()
        if (nome) generoCount[nome] = (generoCount[nome] || 0) + 1
      })
    }
  })

  const generosMaisVistos = Object.entries(generoCount)
   .map(([genero, total]) => ({ genero, total: total as number }))
   .sort((a, b) => (b.total as number) - (a.total as number))

  const topSeries = Object.entries(topMap)
   .map(([id, total]) => ({
      titulo: serieMap[id]?.titulo || `ID ${id}`,
      total: total as number
    }))
   .sort((a, b) => (b.total as number) - (a.total as number))
   .slice(0, 5)

  return Response.json({
    generosMaisVistos, // <- já é consumo real dos 16 usuários
    topSeries, // <- já é ranking real dos 16 usuários
    totalSeries: series?.length || 0,
    totalWatchlist: watchlist?.length || 0 // <- tem que dar 16+ já
  })
}
