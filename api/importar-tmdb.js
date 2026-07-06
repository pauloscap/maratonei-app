const tipoTmdb = tipo === 'serie' ? 'tv' : tipo
const urlTmdb = `https://api.themoviedb.org/3/${tipoTmdb}/${id_tmdb}?language=pt-BR`
