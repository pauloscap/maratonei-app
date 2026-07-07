import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const item = await request.json()

    // Só aceita série nessa tabela
    if (item.media_type!== 'tv') {
      return Response.json({ error: 'Essa tabela é só pra séries' }, { status: 400 })
    }

    // Pega detalhes completos do TMDB
    const tmdbKey = process.env.TMDB_API_KEY
    const detalhesRes = await fetch(
      `https://api.themoviedb.org/3/tv/${item.id}?api_key=${tmdbKey}&language=pt-BR`
    )

    if (!detalhesRes.ok) {
      return Response.json({ error: 'TMDB recusou a requisição' }, { status: 500 })
    }

    const d = await detalhesRes.json()

    // Conecta no Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Salva na tabela 'series' com os nomes de colunas que você já tem
    const { error } = await supabase.from('series').upsert({
      id_tmdb: d.id, // sua coluna é id_tmdb
      id_imdb: d.external_ids?.imdb_id || null, // TMDB não traz, deixamos null
      titulo: d.name,
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path, // sua coluna chama banner
      nota: d.vote_average,
      ano: d.first_air_date?.split('-')[0],
      generos: d.genres?.map(g => g.name) || [], // array de texto
      temporadas: d.number_of_seasons,
      episodios: d.number_of_episodes,
      status: d.status
    }, { onConflict: 'id_tmdb' }) // Se já existir, atualiza

    if (error) {
      console.log(error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ sucesso: true })

  } catch (e) {
    return Response.json({ error: 'Erro interno: ' + e.message }, { status: 500 })
  }
}
