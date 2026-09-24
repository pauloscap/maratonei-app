import { createClient } from '@supabase/supabase-js'

export async function POST(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const tmdb = process.env.TMDB_API_KEY

  const { data: series } = await supabase.from('series').select('id,id_tmdb,generos').or('generos.cs.{"Sem categoria"},generos.is.null')

  let ok = 0
  for(const s of series||[]){
    try{
      let d = await fetch(`https://api.themoviedb.org/3/movie/${s.id_tmdb}?api_key=${tmdb}&language=pt-BR`).then(r=>r.json())
      if(!d.genres) d = await fetch(`https://api.themoviedb.org/3/tv/${s.id_tmdb}?api_key=${tmdb}&language=pt-BR`).then(r=>r.json())
      if(d.genres?.length){
        await supabase.from('series').update({ generos: d.genres.map((g:any)=>g.name) }).eq('id', s.id)
        ok++
      }
    }catch{}
  }
  return Response.json({ corrigidos: ok, total: series?.length })
}
