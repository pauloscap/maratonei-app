import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!
    )

    const generosArray = (d.genres && d.genres.length > 0)
     ? d.genres.map((g: any) => g.name)
      : ['Sem categoria']

    // 1. Salva no catálogo (series)
    const { error: seriesError } = await supabase.from('series').upsert({
      id_tmdb: d.id,
      titulo: d.name || d.title || "Sem título",
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path,
      nota: d.vote_average,
      ano: (d.first_air_date || d.release_date || "")?.split('-')[0],
      generos: generosArray,
      temporadas: d.number_of_seasons || 1,
      episodios: d.number_of_episodes || 1,
      status: d.status,
      tipo: tipo
    }, { onConflict: 'id_tmdb' })

    if (seriesError) return Response.json({ error: 'Erro Supabase series: ' + seriesError.message }, { status: 500 })

    // Pega o id real da série que acabou de salvar
    const { data: serieSalva } = await supabase.from('series').select('id').eq('id_tmdb', d.id).single()
    if (!serieSalva) return Response.json({ error: 'Não achou série depois de salvar' }, { status: 500 })

    // 2. Salva na watchlist do usuário - AQUI QUE FALTAVA
    // O front precisa mandar user_id
    if (!item.user_id) {
      return Response.json({ error: 'Falta user_id - manda do front: { id, media_type, user_id }' }, { status: 400 })
    }

    const { error: watchError } = await supabase.from('watchlist').upsert({
      user_id: item.user_id,
      serie_id: serieSalva.id
    }, { onConflict: 'user_id,serie_id' })

    if (watchError) return Response.json({ error: 'Erro watchlist: ' + watchError.message }, { status: 500 })

    return Response.json({ sucesso: true, titulo: d.name || d.title, generos: generosArray, watchlist: true })

  } catch (e: any) {
    return Response.json({ error: 'Erro interno: ' + e.message }, { status: 500 })
  }
}
