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
      return Response.json({ error: `TMDB recusou. Status: ${detalhesRes.status}. ${erroTMDB}` }, { status: 500 })
    }

    const d = await detalhesRes.json()
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

    const { error } = await supabase.from('series').upsert({
      id_tmdb: d.id,
      titulo: d.name || d.title || "Sem título",
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path,
      nota: d.vote_average,
      ano: (d.first_air_date || d.release_date || "")?.split('-')[0],
      generos: d.genres?.map(g => g.name) || [],
      temporadas: d.number_of_seasons || 1,
      episodios: d.number_of_episodes || 1,
      status: d.status,
      tipo: tipo
    }, { onConflict: 'id_tmdb' })

    if (error) return Response.json({ error: 'Erro Supabase: ' + error.message }, { status: 500 })
    return Response.json({ sucesso: true, titulo: d.name || d.title, generos: d.genres?.map(g=>g.name) })

  } catch (e) {
    return Response.json({ error: 'Erro interno: ' + e.message }, { status: 500 })
  }
}
