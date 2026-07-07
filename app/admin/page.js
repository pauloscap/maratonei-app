'use client'
import { useState } from 'react'

export default function Admin() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [importados, setImportados] = useState([])

  async function buscarTMDB() {
    if (!busca) return
    setCarregando(true)
    const res = await fetch(`/api/buscar-tmdb?q=${busca}`)
    const data = await res.json()
    setResultados(data.resultados || [])
    setCarregando(false)
  }

  async function importarTitulo(id_tmdb, tipo) {
    setCarregando(true)
    const res = await fetch(`/api/importar-tmdb?id_tmdb=${id_tmdb}&tipo=${tipo}`)
    const data = await res.json()
    
    if (data.ok) {
      alert(`✅ ${data.titulo.titulo} importado!`)
      setImportados([data.titulo, ...importados])
    } else {
      alert(`❌ Erro: ${data.erro}`)
    }
    setCarregando(false)
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 800, margin: '0 auto' }}>
      <h1>Painel Admin - Maratonei</h1>
      
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarTMDB()}
          placeholder="Digite o nome do filme ou série"
          style={{ padding: 10, width: 300, marginRight: 10 }}
        />
        <button 
          onClick={buscarTMDB} 
          disabled={carregando}
          style={{ padding: 10 }}
        >
          {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <h2>Resultados da busca</h2>
      {resultados.length === 0 && <p>Nenhum resultado. Busca algo aí 👆</p>}
      
      {resultados.map((item) => (
        <div key={item.id} style={{ 
          border: '1px solid #ccc', 
          padding: 10, 
          marginBottom: 10,
          display: 'flex',
          gap: 10
        }}>
          {item.poster_path && (
            <img 
              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
              alt={item.title || item.name}
              width={92}
            />
          )}
          <div>
            <strong>{item.title || item.name}</strong> 
            <span> ({(item.release_date || item.first_air_date || '').substring(0,4)})</span>
            <br/>
            <small>{item.media_type === 'movie' ? 'Filme' : 'Série'}</small>
            <br/>
            <button 
              onClick={() => importarTitulo(item.id, item.media_type === 'movie' ? 'filme' : 'serie')}
              disabled={carregando}
              style={{ marginTop: 10, padding: '5px 10px' }}
            >
              Importar
            </button>
          </div>
        </div>
      ))}

      <h2 style={{ marginTop: 40 }}>Últimos importados</h2>
      {importados.map((titulo) => (
        <div key={titulo.id} style={{ padding: 5 }}>
          ✅ {titulo.titulo} - {titulo.ano}
        </div>
      ))}
    </div>
  )
}
