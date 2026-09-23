import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

  const { data: profiles } = await supabase.from('profiles').select('id, criado_em')
  const { data: watchlist } = await supabase.from('watchlist').select('serie_id')
  const { data: series } = await supabase.from('series').select('id, id_tmdb, titulo, generos').limit(500)

  const map = new Map()
  ;(series||[]).forEach((s:any)=>{
    map.set(String(s.id), s)
    map.set(String(s.id_tmdb), s)
  })

  const counts: any = {}
  const generosCount: any = {}

  ;(watchlist||[]).forEach((w:any)=>{
    const s = map.get(String(w.serie_id))
    const nome = s?.titulo || `ID ${w.serie_id}`
    counts[nome] = (counts[nome]||0)+1
    const gens = s?.generos || []
    gens.forEach((g:string)=>{ generosCount[g] = (generosCount[g]||0)+1 })
  })

  return Response.json({
    totalUsuarios: profiles?.length||0,
    totalWatchlist: watchlist?.length||0,
    mediaPorUsuario: watchlist?.length? (watchlist.length/(profiles?.length||1)).toFixed(1):0,
    topSeries: Object.entries(counts).map(([titulo,count])=>({titulo,count})).sort((a:any,b:any)=>b.count-a.count).slice(0,10),
    topGeneros: Object.entries(generosCount).map(([genero,count])=>({genero,count})).sort((a:any,b:any)=>b.count-a.count),
  })
}
