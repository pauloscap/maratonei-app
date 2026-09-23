import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [{ data: profiles }, { data: watchlist }, { data: series }] = await Promise.all([
    supabase.from('profiles').select('id, nome, criado_em'),
    supabase.from('watchlist').select('*'),
    supabase.from('series').select('*').limit(100) // pega suas séries
  ])

  // Junta watchlist com nome da série
  const seriesMap = new Map((series||[]).map((s:any)=>[String(s.id), s]))

  const topSeries = (watchlist||[]).reduce((acc:any, w:any)=>{
    const key = String(w.serie_id)
    const serie = seriesMap.get(key)
    const titulo = serie?.titulo || serie?.nome || `Série ${key}`
    acc[titulo] = (acc[titulo]||0)+1
    return acc
  }, {})

  const topList = Object.entries(topSeries).map(([titulo,count])=>({titulo,count})).sort((a:any,b:any)=>b.count-a.count)

  // Gêneros
  const generos: any = {}
  ;(watchlist||[]).forEach((w:any)=>{
    const serie = seriesMap.get(String(w.serie_id))
    const g = serie?.genero || serie?.generos || serie?.genre
    if(g){
      const arr = Array.isArray(g)? g : [g]
      arr.forEach((gen:string)=> generos[gen]=(generos[gen]||0)+1 )
    }
  })

  return Response.json({
    totalUsuarios: profiles?.length||0,
    totalWatchlist: watchlist?.length||0,
    topSeries: topList.slice(0,10),
    topGeneros: Object.entries(generos).map(([genero,count])=>({genero,count})).sort((a:any,b:any)=>b.count-a.count),
    debug: { seriesCount: series?.length||0, watchlistSample: watchlist?.slice(0,2) }
  })
}
