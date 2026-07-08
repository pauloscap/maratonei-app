'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [series, setSeries] = useState([])
  const [progresso, setProgresso] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {
    const { data: seriesData } = await supabase.from('series').select('*')
    if (seriesData) {
      setSeries(seriesData)
      
      const progressoMap = {}
      
      for (const serie of seriesData) {
        const { data: temps } = await supabase
         .from('temporadas')
         .select('episodios')
         .eq('serie_id', serie.id)
        
        const totalEps = temps?.reduce((acc, t) => acc + t.episodios, 0) || 0
        
        const { data: assistidos } = await supabase
         .from('user_episodios')
         .select('id')
         .eq('serie_id', serie.id)
        
        const assistidosCount = assistidos?.length || 0
        const percentual = totalEps > 0 ? Math.round((assistidosCount / totalEps) * 100) : 0
        
        progressoMap[serie.id] = { totalEps, assistidosCount, percentual }
      }
      
      setProgresso(progressoMap)
    }
    setLoading(false)
  }

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>

  return (
    <main className="main">
      <h1 style={{color: '#FACC15', marginBottom: '16px'}}>Maratonei</h1>
      
      {series.map(serie => {
        const prog = progresso[serie.id] || { totalEps: 0, assistidosCount: 0, percentual: 0 }
        
        return (
          <Link key={serie.id} href={`/serie/${serie.id}`} style={{textDecoration: 'none'}}>
            <div className="card" style={{marginBottom: '16px'}}>
              <img
                src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
                alt={serie.titulo}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              />
              <h3 style={{color: '#FACC15', marginBottom: '4px'}}>{serie.titulo}</h3>
              <div style={{color: '#94A3B8', fontSize: '14px', marginBottom: '12px'}}>
                <span>⭐ {serie.nota?.toFixed(1)}</span>
                <span style={{margin: '0 8px'}}>•</span>
                <span>{serie.ano}</span>
              </div>
              
              {prog.totalEps > 0 && (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '6px'}}>
                    <span>{prog.assistidosCount}/{prog.totalEps} episódios</span>
                    <span style={{color: '#FACC15', fontWeight: 'bold'}}>{prog.percentual}%</span>
                  </div>
                  <div style={{width: '100%', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden'}}>
                    <div style={{
                      width: `${prog.percentual}%`,
                      height: '100%',
                      background: '#FACC15',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </main>
  )
}
