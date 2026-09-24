import { createClient } from '@supabase/supabase-js'

async function run(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const tmdb = process.env.TMDB_API_KEY
  const { data: series } = await supabase.from('series').select('id,id_tmdb,generos').limit(250)
  const paraCorrigir = series?.filter((s:any)=> !s.generos || s.generos.includes('Sem categoria')) || []
  let ok = 0
  for(const s of paraCorrigir){
    try{
      let d:any = await fetch(`https://api.themoviedb.org/3/movie/${s.id_tmdb}?api_key=${tmdb}&language=pt-BR`).then(r=>r.json())
      if(!d.genres?.length) d = await fetch(`https://api.themoviedb.org/3/tv/${s.id_tmdb}?api_key=${tmdb}&language=pt-BR`).then(r=>r.json())
      if(d.genres?.length){
        await supabase.from('series').update({ generos: d.genres.map((g:any)=>g.name) }).eq('id', s.id)
        ok++
      }
      await new Promise(r=>setTimeout(r,200))
    }catch{}
  }
  return { mensagem: 'Gêneros corrigidos!', corrigidos: ok, total: paraCorrigir.length }
}

export async function GET(){ return Response.json(await run()) }
export async function POST(){ return Response.json(await run()) }
