import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const item = await request.json()
    if (item.media_type!== 'tv') {
      return Response.json({ error: 'Essa tabela é só pra séries' }, { status: 400 })
    }

    const tmdbKey = process.env.TMDB_API_KEY
    const detalhesRes = await fetch(
      `https://api.themoviedb.org/3/tv/${item.id}?api_key=${tmdbKey}&language=pt-BR`
    )

    if (!detalhesRes.ok) {
      return Response.json({ error: 'TMDB recusou a requisição' }, { status: 500 })
    }

    const d = await detalhesRes.json()

    // MUDEI AQUI: usando SUPABASE_URL e SUPABASE_KEY que você já tem
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    const { error } = await supabase.from('series').upsert({
      id_tmdb: d.id,
      titulo: d.name,
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path,
      nota: d.vote_average,
      ano: d.first_air_date?.split('-')[0],
      generos: d.genres?.map(g => g.name) || [],
      temporadas: d.number_of_seasons,
      episodios: d.number_of_episodes,
      status: d.status
    }, { onConflict: 'id_tmdb' })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ sucesso: true })

  } catch (e) {
    return Response.json({ error: 'Erro interno: ' + e.message }, { status: 500 })
  }
}
