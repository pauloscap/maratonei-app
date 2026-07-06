import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  const { id_tmdb, tipo } = req.query

  if (!id_tmdb ||!tipo) {
    return res.status(400).json({ ok: false, erro: "Faltou id_tmdb ou tipo" })
  }

  try {
    const urlTmdb = `https://api.themoviedb.org/3/${tipo}/${id_tmdb}?language=pt-BR`
    const respostaTmdb = await fetch(urlTmdb, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        accept: 'application/json'
      }
    })

    if (!respostaTmdb.ok) {
      return res.status(404).json({ ok: false, erro: "Não achou na TMDB" })
    }

    const dadosTmdb = await respostaTmdb.json()

    const novoTitulo = {
      id_tmdb: dadosTmdb.id,
      tipo: tipo,
      titulo: dadosTmdb.name || dadosTmdb.title,
      titulo_original: dadosTmdb.original_name || dadosTmdb.original_title,
      sinopse: dadosTmdb.overview,
      poster: dadosTmdb.poster_path? `https://image.tmdb.org/t/p/w500${dadosTmdb.poster_path}` : null,
      ano: parseInt((dadosTmdb.first_air_date || dadosTmdb.release_date || '').substring(0, 4)) || null
    }

    const { data, error } = await supabase
    .from('titulos')
    .upsert(novoTitulo, { onConflict: 'id_tmdb' })
    .select()

    if (error) {
      return res.status(500).json({ ok: false, erro_supabase: error.message })
    }

    res.status(200).json({ ok: true, titulo: data[0] })

  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message })
  }
}
