import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: watchlist } = await supabase.from('watchlist').select('serie_id')
  const { data: series } = await supabase.from('series').select('id, titulo, genero').limit(200)
  const map = new Map((series||[]).map((s:any)=>[String(s.id), s]))
  
  const counts:any = {}
  const generos:any = {}
  ;(watchlist||[]).forEach((w:any)=>{
    const s = map.get(String(w.serie_id))
    if(!s) return
    counts[s.titulo] = (counts[s.titulo]||0)+1
    if(s.genero) generos[s.genero] = (generos[s.genero]||0)+1
  })

  return Response.json({
    totalWatchlist: watchlist?.length||0,
    topSeries: Object.entries(counts).map(([titulo,count])=>({titulo,count})).sort((a:any,b:any)=>b.count-a.count).slice(0,10),
    topGeneros: Object.entries(generos).map(([genero,count])=>({genero,count})).sort((a:any,b:any)=>b.count-a.count)
  })
}
