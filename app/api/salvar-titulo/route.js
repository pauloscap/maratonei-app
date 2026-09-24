import { createClient } from '@supabase/supabase-js'

export async function POST(req){
  const item = await req.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const tmdbKey = process.env.TMDB_API_KEY
  const tipo = item.media_type === 'movie' ? 'movie' : 'tv'
  const d = await fetch(`https://api.themoviedb.org/3/${tipo}/${item.id}?api_key=${tmdbKey}&language=pt-BR`).then(r=>r.json())
  
  await supabase.from('series').upsert({
    id_tmdb: d.id, tmdb_id: d.id, titulo: d.title||d.name,
    poster: d.poster_path, generos: d.genres?.map(g=>g.name)||['Sem categoria']
  }, { onConflict: 'id_tmdb' })
  
  const { data: serie } = await supabase.from('series').select('id').eq('id_tmdb', d.id).single()
  await supabase.from('watchlist').upsert({ user_id: item.user_id, serie_id: serie.id }, { onConflict: 'user_id,serie_id' })
  
  // mantém compatibilidade com sistema antigo também
  if(tipo==='movie'){
    await supabase.from('user_filmes').upsert({ user_id: item.user_id, filme_id: String(d.id), titulo: d.title, img: `https://image.tmdb.org/t/p/w500${d.poster_path}`, status: 'ja_assisti' }, { onConflict: 'user_id,filme_id' })
  } else {
    await supabase.from('user_series').upsert({ user_id: item.user_id, serie_id: String(d.id), titulo: d.name, img: `https://image.tmdb.org/t/p/w500${d.poster_path}`, status: 'ja_assisti' }, { onConflict: 'user_id,serie_id' })
  }
  
  return Response.json({ ok: true })
}
