import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  try {
    const item = await request.json()
    const tipo = item.media_type === 'movie'? 'movie' : 'tv'

    // Pega usuário logado automaticamente
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    const user_id = item.user_id || user?.id

    if (!user_id) return Response.json({ error: 'Usuário não logado' }, { status: 401 })

    const tmdbKey = process.env.TMDB_API_KEY
    const url = `https://api.themoviedb.org/3/${tipo}/${item.id}?api_key=${tmdbKey}&language=pt-BR`
    const detalhesRes = await fetch(url)
    const d = await detalhesRes.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const generosArray = d.genres?.length? d.genres.map((g:any)=>g.name) : ['Sem categoria']

    await supabase.from('series').upsert({
      id_tmdb: d.id,
      titulo: d.name || d.title,
      sinopse: d.overview,
      poster: d.poster_path,
      banner: d.backdrop_path,
      nota: d.vote_average,
      ano: (d.first_air_date || d.release_date || "")?.split('-')[0],
      generos: generosArray,
      tipo
    }, { onConflict: 'id_tmdb' })

    const { data: serieSalva } = await supabase.from('series').select('id').eq('id_tmdb', d.id).single()

    await supabase.from('watchlist').upsert({
      user_id,
      serie_id: serieSalva!.id
    }, { onConflict: 'user_id,serie_id' })

    return Response.json({ sucesso: true })

  } catch (e:any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
