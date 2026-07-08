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
      <h1 style={{color: '#FACC15', marginBottom: '20px', fontSize: '28px'}}>Maratonei</h1>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px'}}>
        {series.map(serie => {
          const prog = progresso[serie.id] || { totalEps: 0, assistidosCount: 0, percentual: 0 }
          
          return (
            <Link key={serie.id} href={`/serie/${serie.id}`} style={{textDecoration: 'none'}}>
              <div className="card" style={{padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column'}}>
                <img
                  src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
                  alt={serie.titulo}
                  style={{
                    width: '100%',
                    height: '240px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{padding: '12px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <h3 style={{color: '#FACC15', fontSize: '14px', marginBottom: '6px', lineHeight: '1.3'}}>
                    {serie.titulo}
                  </h3>
                  <div style={{color: '#64748B', fontSize: '12px', marginBottom: '8px'}}>
                    <span>⭐ {serie.nota?.toFixed(1)}</span>
                    <span style={{margin: '0 4px'}}>•</span>
                    <span>{serie.ano}</span>
                  </div>
                  
                  {prog.totalEps > 0 && (
                    <div style={{marginTop: 'auto'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginBottom: '4px'}}>
                        <span>{prog.assistidosCount}/{prog.totalEps}</span>
                        <span style={{color: '#FACC15', fontWeight: 'bold'}}>{prog.percentual}%</span>
                      </div>
                      <div style={{width: '100%', height: '4px', background: '#1E293B', borderRadius: '2px', overflow: 'hidden'}}>
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
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
