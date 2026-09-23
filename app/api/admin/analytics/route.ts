import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!
  )

  const { data: series } = await supabase.from('series').select('id, id_tmdb, titulo, generos')
  const { data: watchlist } = await supabase.from('watchlist').select('serie_id')

  const serieMap: Record<string, any> = {}
  series?.forEach((s: any) => {
    serieMap[String(s.id)] = s
    if (s.id_tmdb) serieMap[String(s.id_tmdb)] = s
  })

  const generoCount: Record<string, number> = {}
  const topMap: Record<string, number> = {}

  watchlist?.forEach((w: any) => {
    const sid = String(w.serie_id)
    topMap[sid] = (topMap[sid] || 0) + 1
    const serie = serieMap[sid]
    let generos: any = serie?.generos
    if (typeof generos === 'string') {
      try { generos = JSON.parse(generos) } catch {}
    }
    if (Array.isArray(generos)) {
      generos.forEach((g: any) => {
        const nome = g?.toString().replace(/[{}"\[\]]/g, '').trim()
        if (nome && nome!== 'NULL') {
          generoCount[nome] = (generoCount[nome] || 0) + 1
        }
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

  // Se watchlist vazia, mostra gêneros do catálogo pra não ficar vazio
  let finalGeneros = generosMaisVistos
  if (finalGeneros.length === 0 && series) {
    const catCount: Record<string, number> = {}
    series.forEach((s: any) => {
      let g = s.generos
      if (typeof g === 'string') try { g = JSON.parse(g) } catch {}
      if (Array.isArray(g)) g.forEach((x: any) => {
        const nome = x?.toString().replace(/[{}"\[\]]/g, '').trim()
        if (nome) catCount[nome] = (catCount[nome] || 0) + 1
      })
    })
    finalGeneros = Object.entries(catCount).map(([genero, total]) => ({ genero, total: total as number })).sort((a,b)=>(b.total as number)-(a.total as number))
  }

  return Response.json({
    generosMaisVistos: finalGeneros,
    topSeries: topSeries.length? topSeries : series?.slice(0,5).map((s:any)=>({ titulo: s.titulo, total: 1 })) || [],
    totalSeries: series?.length || 0,
    totalWatchlist: watchlist?.length || 0
  })
}
