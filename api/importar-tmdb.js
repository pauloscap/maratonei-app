import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    // 1. VERIFICA SE AS CHAVES EXISTEM
    if (!process.env.SUPABASE_URL) {
      return res.status(500).json({ ok: false, erro: "SUPABASE_URL faltando na Vercel" })
    }
    if (!process.env.SUPABASE_KEY) {
      return res.status(500).json({ ok: false, erro: "SUPABASE_KEY faltando na Vercel" })
    }
    if (!process.env.TMDB_API_KEY) {
      return res.status(500).json({ ok: false, erro: "TMDB_API_KEY faltando na Vercel" })
    }

    // 2. CONECTA NO SUPABASE
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // 3. PEGA OS PARÂMETROS DA URL
    const { id_tmdb, tipo } = req.query

    if (!id_tmdb || !tipo) {
      return res.status(400).json({ ok: false, erro: "Faltou id_tmdb ou tipo na URL" })
    }

    // 4. CONVERTE 'serie' PRA 'tv' QUE É O QUE A TMDB USA
    const tipoTmdb = tipo === 'serie' ? 'tv' : 'movie'
    const urlTmdb = `https://api.themoviedb.org/3/${tipoTmdb}/${id_tmdb}?language=pt-BR`

    // 5. CHAMA A TMDB COM TOKEN V4
    const respostaTmdb = await fetch(urlTmdb, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        accept: 'application/json'
      }
    })

    if (!respostaTmdb.ok) {
      const erroTmdb = await respostaTmdb.text()
      return res.status(respostaTmdb.status).json({ 
        ok: false, 
        erro: "TMDB recusou a requisição",
        status_tmdb: respostaTmdb.status,
        detalhes: erroTmdb
      })
    }

    const dadosTmdb = await respostaTmdb.json()

    // 6. MONTA O OBJETO PRA SALVAR NO BANCO
    const novoTitulo = {
      id_tmdb: dadosTmdb.id,
      tipo: tipo,
      titulo: dadosTmdb.name || dadosTmdb.title || null,
      titulo_original: dadosTmdb.original_name || dadosTmdb.original_title || null,
      sinopse: dadosTmdb.overview || null,
      poster: dadosTmdb.poster_path ? `https://image.tmdb.org/t/p/w500${dadosTmdb.poster_path}` : null,
      backdrop: dadosTmdb.backdrop_path ? `https://image.tmdb.org/t/p/w1280${dadosTmdb.backdrop_path}` : null,
      ano: parseInt((dadosTmdb.first_air_date || dadosTmdb.release_date || '').substring(0, 4)) || null,
      nota_tmdb: dadosTmdb.vote_average || null
    }

    // 7. SALVA NO SUPABASE - UPSERT PRA NÃO DUPLICAR
    const { data, error } = await supabase
      .from('titulos')
      .upsert(novoTitulo, { onConflict: 'id_tmdb' })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        ok: false, 
        erro: "Erro ao salvar no Supabase",
        detalhes: error.message 
      })
    }

    // 8. SUCESSO
    res.status(200).json({ ok: true, titulo: data })

  } catch (e) {
    res.status(500).json({ ok: false, erro: "Erro geral", detalhes: e.message })
  }
}
