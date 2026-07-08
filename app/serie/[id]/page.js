'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function SerieDetalhe({ params }) {
  const [serie, setSerie] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tempAberta, setTempAberta] = useState(null)

  useEffect(() => {
    async function buscarSerie() {
      // 1. Busca dados da série
      const { data: serieData } = await supabase
        .from('series')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (serieData) {
        setSerie(serieData)
        
        // 2. Busca temporadas dessa série
        const { data: tempsData } = await supabase
          .from('temporadas')
          .select('*')
          .eq('serie_id', params.id)
          .order('numero', { ascending: true })
        
        if (tempsData) setTemporadas(tempsData)
      }
      
      setLoading(false)
    }
    buscarSerie()
  }, [params.id])

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>
  if (!serie) return <main className="main"><div className="card">Série não encontrada</div></main>

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>
      
      <div className="card">
        <img 
          src={`https://image.tmdb.org/t/p/w500${serie.poster}`} 
          alt={serie.titulo}
          style={{width: '100%', borderRadius: '8px', marginBottom: '16px'}}
        />
        
        <h1 style={{color: '#FACC15', marginBottom: '8px'}}>{serie.titulo}</h1>
        
        <div style={{color: '#94A3B8', marginBottom: '16px'}}>
          <span>⭐ {serie.nota?.toFixed(1)}</span>
          <span style={{margin: '0 8px'}}>•</span>
          <span>{serie.ano}</span>
        </div>

        <p style={{lineHeight: '1.6', marginBottom: '20px'}}>{serie.sinopse}</p>
      </div>

      <h3 style={{color: '#FACC15', marginTop: '24px', marginBottom: '12px'}}>Temporadas</h3>
      
      {temporadas.length === 0 && (
        <div className="card">
          <p style={{color: '#94A3B8'}}>Nenhuma temporada cadastrada ainda</p>
        </div>
      )}

      {temporadas.map(temp => (
        <div key={temp.id} className="card" style={{marginBottom: '12px'}}>
          <div 
            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}
            onClick={() => setTempAberta(tempAberta === temp.id ? null : temp.id)}
          >
            <div>
              <strong>Temporada {temp.numero}</strong>
              <p style={{color: '#94A3B8', fontSize: '14px', marginTop: '4px'}}>
                {temp.episodios} episódios • {temp.ano}
              </p>
            </div>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              strokeWidth="2" 
              stroke="currentColor"
              style={{
                width: '20px', 
                transform: tempAberta === temp.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {tempAberta === temp.id && (
            <div style={{marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px'}}>
              {Array.from({length: temp.episodios}, (_, i) => i + 1).map(ep => (
                <div 
                  key={ep} 
                  style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #1E293B'
                  }}
                >
                  <span>Episódio {ep}</span>
                  <button 
                    style={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      color: '#94A3B8',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Marcar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  )
}
