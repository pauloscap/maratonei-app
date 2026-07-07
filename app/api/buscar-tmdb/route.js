export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  
  if (!q) {
    return Response.json({ error: 'Query vazia' }, { status: 400 })
  }

  const tmdbKey = process.env.TMDB_API_KEY
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&language=pt-BR&query=${encodeURIComponent(q)}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: 'Erro TMDB: ' + e.message }, { status: 500 })
  }
}
