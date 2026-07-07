export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  if (!q) {
    return Response.json({ resultados: [] })
  }

  const TMDB_API_KEY = process.env.TMDB_API_KEY
  if (!TMDB_API_KEY) {
    return Response.json({ erro: 'TMDB_API_KEY faltando na Vercel' }, { status: 500 })
  }

  try {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=pt-BR&api_key=${TMDB_API_KEY}`
    
    const resposta = await fetch(url)
    const dados = await resposta.json()

    // Filtra só filmes e séries
    const resultados = dados.results?.filter(r => r.media_type === 'movie' || r.media_type === 'tv') || []

    return Response.json({ resultados })
  } catch (erro) {
    return Response.json({ erro: 'Erro ao buscar na TMDB' }, { status: 500 })
  }
}
