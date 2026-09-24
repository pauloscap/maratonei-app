import { createClient } from '@supabase/supabase-js'

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const tmdb = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY

  const { data: series } = await supabase.from('series').select('id,id_tmdb,titulo,generos').limit(5)
  const sample = series?.[0]

  if(!tmdb) return Response.json({ erro: 'TMDB_API_KEY não está na Vercel', sample })

  let test:any = {}
  try{
    const r = await fetch(`https://api.themoviedb.org/3/movie/${sample?.id_tmdb}?api_key=${tmdb}&language=pt-BR`)
    test = await r.json()
  }catch(e:any){ test = { erro_fetch: String(e) } }

  return Response.json({
    tem_tmdb_key:!!tmdb,
    sample_serie: sample,
    teste_tmdb_resposta: test,
    dica: 'Se id_tmdb for null, a migração não salvou o ID'
  })
}
