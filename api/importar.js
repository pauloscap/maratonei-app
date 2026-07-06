import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const TMDB_KEY = process.env.TMDB_KEY
const BASE = 'https://api.themoviedb.org/3'

async function salvaTitulo(tmdbId, tipo) {
  const url = `${BASE}/${tipo}/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR&append_to_response=external_ids`
  const res = await fetch(url)
  const d = await res.json()

  const titulo = {
    id_tmdb: d.id,
    id_imdb: d.external_ids?.imdb_id,
    tipo: tipo === 'tv'? 'serie' : 'filme',
    titulo: d.name || d.title,
    titulo_original: d.original_name || d.original_title,
    sinopse: d.overview,
    poster: d.poster_path? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
    banner: d.backdrop_path? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : null,
    nota: d.vote_average,
    ano: (d.first_air_date || d.release_date)?.split('-')[0],
    generos: d.genres?.map(g => g.name),
    duracao: d.runtime || null,
    temporadas: d.number_of_seasons || null,
    episodios: d.number_of_episodes || null,
    status: d.status
  }

  await supabase.from('series').upsert(titulo, { onConflict: 'id_tmdb' })
}

export default async function handler(req, res) {
  try {
    const series = await fetch(`${BASE}/tv/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`).then(r => r.json())
    for (const s of series.results.slice(0, 20)) {
      await salvaTitulo(s.id, 'tv')
    }

    const filmes = await fetch(`${BASE}/movie/popular?api_key=${TMDB_KEY}&language=pt-BR&page=1`).then(r => r.json())
    for (const f of filmes.results.slice(0, 20)) {
      await salvaTitulo(f.id, 'movie')
    }

    res.status(200).json({ ok: true, series_importadas: 20, filmes_importados: 20, total: 40 })
  } catch (e) {
    res.status(500).json({ erro: e.message })
  }
}
