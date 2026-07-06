if (!respostaTmdb.ok) {
  const erroTmdb = await respostaTmdb.text()
  return res.status(404).json({ 
    ok: false, 
    erro: "TMDB recusou",
    status: respostaTmdb.status,
    detalhes: erroTmdb
  })
}
  }
}
