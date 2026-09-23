import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const item = await request.json()
    const tipo = item.media_type === 'movie'? 'movie' : 'tv'
    const tmdbKey = process.env.TMDB_API_KEY
    const url = `https://api.themoviedb.org/3/${tipo}/${item.id}?api_key=${tmdbKey}&language=pt-BR`

    const detalhesRes = await fetch(url)
    if (!detalhesRes.ok) {
      const erroTMDB = await detalhesRes.text()
      return Response.json({ error: `TMDB recusou: ${detalhesRes.status} ${erroTMDB}` }, { status: 500 })
    }

    const d = await detalhesRes.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    )

    // Seu generos é text[] -> precisa ser array JS puro
    const generosArray = (d.genres && d.genres.length > 0) 
  ? d.genres.map(g => g.name) 
  : ['Sem categoria']

    const { error } = await supabase.from('series').upsert({
      id_tmdb: d.id, // int - seu id_tmdb é int
      titulo: d.name || d.title || "Sem título",
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path,
      nota: d.vote_average,
      ano: (d.first_air_date || d.release_date || "")?.split('-')[0],
      generos: generosArray, // <- AGORA vai como text[] certo
      temporadas: d.number_of_seasons || 1,
      episodios: d.number_of_episodes || 1,
      status: d.status,
      tipo: tipo
    }, { onConflict: 'id_tmdb' })

    if (error) return Response.json({ error: 'Erro Supabase: ' + error.message }, { status: 500 })

    return Response.json({ sucesso: true, titulo: d.name || d.title, generos: generosArray })

  } catch (e) {
    return Response.json({ error: 'Erro interno: ' + e.message }, { status: 500 })
  }
}
