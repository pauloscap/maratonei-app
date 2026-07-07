'use client'
import { useState } from 'react'

export default function Admin() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [importando, setImportando] = useState(null)

  async function buscarTMDB() {
    if (!busca) return
    setCarregando(true)
    setResultados([])
    try {
      const res = await fetch(`/api/buscar-tmdb?q=${encodeURIComponent(busca)}`)
      const data = await res.json()
      setResultados(data.results || [])
    } catch (e) {
      alert('Erro ao buscar')
    } finally {
      setCarregando(false)
    }
  }

  async function importarTitulo(item) {
    setImportando(item.id)
    try {
      const res = await fetch('/api/salvar-titulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert('Importado!')
    } catch (e) {
      alert('❌ Erro: ' + e.message)
    } finally {
      setImportando(null)
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Admin - Importar do TMDB</h1>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscarTMDB()}
          placeholder="Buscar série ou filme..."
          style={{ flex: 1, padding: 10, fontSize: 16 }}
        />
        <button onClick={buscarTMDB} disabled={carregando} style={{ padding: '10px 20px' }}>
          {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <div>
        {resultados.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 15, marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 15 }}>
            {item.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                alt={item.title || item.name}
                width={100}
                style={{ borderRadius: 4 }}
              />
            )}
            <div>
              <h3>{item.title || item.name}</h3>
              <p>{item.media_type === 'tv' ? 'Série' : 'Filme'} - {item.first_air_date || item.release_date || 'Sem data'}</p>
              <button
                onClick={() => importarTitulo(item)}
                disabled={importando === item.id}
                style={{ marginTop: 10 }}
              >
                {importando === item.id ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
