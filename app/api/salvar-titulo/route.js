import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const item = await request.json()
    const tipo = item.media_type === 'movie'? 'movie' : 'tv'
    const tmdbKey = process.env.TMDB_API_KEY
    const url = `https://api.themoviedb.org/3/${tipo}/${item.id}?api_key=${tmdbKey}&language=pt-BR`

    const detalhesRes = await fetch(url)
    if (!detalhesRes.ok) {
      const erro = await detalhesRes.text()
      return Response.json({ error: 'TMDB: ' + erro }, { status: 500 })
    }
    const d = await detalhesRes.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const generosArray = d.genres && d.genres.length > 0? d.genres.map(g => g.name) : ['Sem categoria']

    await supabase.from('series').upsert({
      id_tmdb: d.id,
      titulo: d.name || d.title || 'Sem título',
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path,
      nota: d.vote_average,
      ano: (d.first_air_date || d.release_date || '').split('-')[0],
      generos: generosArray,
      tipo: tipo
    }, { onConflict: 'id_tmdb' })

    const { data: serieSalva } = await supabase.from('series').select('id').eq('id_tmdb', d.id).single()

    // pega user_id que vem do front - se não vier, avisa
    const user_id = item.user_id
    if (!user_id) {
      return Response.json({ error: 'Falta user_id no body' }, { status: 400 })
    }

    await supabase.from('watchlist').upsert({
      user_id: user_id,
      serie_id: serieSalva.id
    }, { onConflict: 'user_id,serie_id' })

    return Response.json({ sucesso: true })

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
