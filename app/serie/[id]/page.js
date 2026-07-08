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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buscarSerie() {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (data) setSerie(data)
      if (error) console.log('Erro:', error)
      setLoading(false)
    }
    buscarSerie()
  }, [params.id])

  if (loading) {
    return <main className="main"><div className="card">Carregando...</div></main>
  }

  if (!serie) {
    return <main className="main"><div className="card">Série não encontrada</div></main>
  }

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

        <button 
          style={{
            width: '100%',
            background: '#FACC15',
            color: '#000',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Marcar como Assistido
        </button>
      </div>
    </main>
  )
}
