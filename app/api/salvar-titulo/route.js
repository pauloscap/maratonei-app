import { createClient } from '@supabase/supabase-js'

function jsonError(message, status) {
  return Response.json({ ok: false, error: message }, { status })
}

export async function POST(req) {
  try {
    const authorization = req.headers.get('authorization') || ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)
    if (!match) return jsonError('Autenticação obrigatória.', 401)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const tmdbKey = process.env.TMDB_API_KEY

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !tmdbKey) {
      return jsonError('Serviço temporariamente indisponível.', 500)
    }

    // Valida o token com o Auth antes de usar qualquer privilégio administrativo.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: authData, error: authError } = await authClient.auth.getUser(match[1])
    if (authError || !authData?.user?.id) {
      return jsonError('Sessão inválida ou expirada.', 401)
    }
    const userId = authData.user.id

    let item
    try {
      item = await req.json()
    } catch {
      return jsonError('Corpo da requisição inválido.', 400)
    }

    const tipo = item?.media_type
    const tmdbId = Number(item?.id)
    if (!['movie', 'tv'].includes(tipo) || !Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
      return jsonError('Informe um filme ou série válido.', 400)
    }

    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/${tipo}/${tmdbId}?api_key=${tmdbKey}&language=pt-BR`,
      { cache: 'no-store', signal: AbortSignal.timeout(10000) }
    )
    if (!tmdbResponse.ok) {
      return jsonError(tmdbResponse.status === 404 ? 'Título não encontrado no catálogo.' : 'Não foi possível consultar o catálogo.', tmdbResponse.status === 404 ? 404 : 502)
    }
    const details = await tmdbResponse.json()
    if (Number(details?.id) !== tmdbId || (tipo === 'movie' ? !details?.title : !details?.name)) {
      return jsonError('Resposta inválida do catálogo.', 502)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: catalogTitle, error: catalogError } = await admin
      .from('series')
      .upsert({
        id_tmdb: details.id,
        tmdb_id: details.id,
        titulo: details.title || details.name,
        poster: details.poster_path,
        generos: details.genres?.map((genre) => genre.name) || ['Sem categoria']
      }, { onConflict: 'id_tmdb' })
      .select('id')
      .single()

    if (catalogError || !catalogTitle?.id) {
      console.error('[salvar-titulo] Falha ao atualizar catálogo:', catalogError?.message)
      return jsonError('Não foi possível salvar o título no catálogo.', 500)
    }

    const { error: watchlistError } = await admin
      .from('watchlist')
      .upsert({ user_id: userId, serie_id: catalogTitle.id }, { onConflict: 'user_id,serie_id' })

    if (watchlistError) {
      console.error('[salvar-titulo] Falha ao atualizar watchlist:', watchlistError.message)
      return jsonError('Não foi possível atualizar sua lista.', 500)
    }

    const isMovie = tipo === 'movie'
    const userTable = isMovie ? 'user_filmes' : 'user_series'
    const userPayload = isMovie
      ? {
          user_id: userId,
          filme_id: String(details.id),
          titulo: details.title,
          img: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
          status: 'ja_assisti'
        }
      : {
          user_id: userId,
          serie_id: String(details.id),
          titulo: details.name,
          img: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
          status: 'ja_assisti'
        }

    const conflictTarget = isMovie ? 'user_id,filme_id' : 'user_id,serie_id'
    const { error: userListError } = await admin
      .from(userTable)
      .upsert(userPayload, { onConflict: conflictTarget })

    if (userListError) {
      console.error('[salvar-titulo] Falha ao atualizar lista do usuário:', userListError.message)
      return jsonError('O título entrou no catálogo, mas não foi possível atualizar sua lista.', 500)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[salvar-titulo] Erro inesperado:', error?.message || error)
    return jsonError('Não foi possível concluir a operação.', 500)
  }
}
