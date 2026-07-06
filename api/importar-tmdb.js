export default async function handler(req, res) {
  const { id_tmdb, tipo } = req.query

  // LOG PRA DEBUG
  console.log('Tipo recebido:', tipo)
  const tipoTmdb = tipo === 'serie' ? 'tv' : tipo
  const urlTmdb = `https://api.themoviedb.org/3/${tipoTmdb}/${id_tmdb}?language=pt-BR`
  console.log('URL TMDB:', urlTmdb)
  console.log('Tem chave TMDB?', !!process.env.TMDB_API_KEY)

  if (!id_tmdb || !tipo) {
    return res.status(400).json({ ok: false, erro: "Faltou id_tmdb ou tipo" })
  }

  try {
    const respostaTmdb = await fetch(urlTmdb, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        accept: 'application/json'
      }
    })

    console.log('Status TMDB:', respostaTmdb.status)

    if (!respostaTmdb.ok) {
      const erroTexto = await respostaTmdb.text()
      console.log('Erro TMDB:', erroTexto)
      return res.status(404).json({ ok: false, erro: "Não achou na TMDB", status: respostaTmdb.status })
    }
