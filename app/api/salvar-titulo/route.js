import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const item = await request.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // LOG do que chegou
    console.log('ITEM RECEBIDO:', item)

    const tipo = item.media_type === 'movie' ? 'movie' : 'tv'
    const tmdbKey = process.env.TMDB_API_KEY
    const d = await fetch(`https://api.themoviedb.org/3/${tipo}/${item.id}?api_key=${tmdbKey}&language=pt-BR`).then(r=>r.json())

    await supabase.from('series').upsert({
      id_tmdb: d.id,
      titulo: d.name || d.title,
      generos: d.genres?.map(g=>g.name) || ['Sem categoria'],
      poster: d.poster_path,
      tipo: tipo
    }, { onConflict: 'id_tmdb' })

    const { data: serie } = await supabase.from('series').select('id').eq('id_tmdb', d.id).single()

    // SE não veio user_id, usa o seu pra TESTE
    let user_id = item.user_id
    if (!user_id) {
      const { data: perfil } = await supabase.from('profiles').select('id').ilike('nome','%Paulo%').limit(1).single()
      user_id = perfil?.id
      console.log('Usando fallback user_id:', user_id)
    }

    const { error } = await supabase.from('watchlist').upsert({
      user_id: user_id,
      serie_id: serie.id
    }, { onConflict: 'user_id,serie_id' })

    if (error) return Response.json({ error: 'WATCHLIST ERRO: ' + error.message, user_id_usado: user_id }, { status: 500 })

    return Response.json({ sucesso: true, user_id_usado: user_id, serie_id: serie.id })

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
