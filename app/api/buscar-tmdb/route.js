export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q) {
    return Response.json({ error: 'Informe um termo para buscar.' }, { status: 400 })
  }

  if (q.length > 100) {
    return Response.json({ error: 'A busca deve ter no máximo 100 caracteres.' }, { status: 400 })
  }

  const tmdbKey = process.env.TMDB_API_KEY

  if (!tmdbKey) {
    return Response.json({ error: 'Serviço de busca temporariamente indisponível.' }, { status: 503 })
  }

  const url = new URL('https://api.themoviedb.org/3/search/multi')
  url.search = new URLSearchParams({
    api_key: tmdbKey,
    language: 'pt-BR',
    query: q,
  }).toString()

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      return Response.json(
        { error: 'Não foi possível concluir a busca no momento.' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json(
      { error: 'Não foi possível concluir a busca no momento.' },
      { status: 502 }
    )
  }
}
