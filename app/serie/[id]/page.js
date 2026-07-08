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
  const [assistidos, setAssistidos] = useState({})
  const [loading, setLoading] = useState(true)
  const [tempAberta, setTempAberta] = useState(null)

  useEffect(() => {
    buscarDados()
  }, [params.id])

  async function buscarDados() {
    const { data: serieData } = await supabase.from('series').select('*').eq('id', params.id).single()
    if (serieData) {
      setSerie(serieData)

      const { data: tempsData } = await supabase
      .from('temporadas')
      .select('*')
      .eq('serie_id', params.id)
      .order('numero', { ascending: true })
      if (tempsData) setTemporadas(tempsData)

      const { data: epsData } = await supabase
      .from('user_episodios')
      .select('*')
      .eq('serie_id', params.id)

      if (epsData) {
        const assistidosMap = {}
        epsData.forEach(ep => {
          assistidosMap[`${ep.temporada_numero}-${ep.episodio_numero}`] = true
        })
        setAssistidos(assistidosMap)
      }
    }
    setLoading(false)
  }

  async function toggleEpisodio(tempNumero, epNumero) {
    const key = `${tempNumero}-${epNumero}`
    const jaAssistido = assistidos[key]

    if (jaAssistido) {
      await supabase
      .from('user_episodios')
      .delete()
      .eq('serie_id', params.id)
      .eq('temporada_numero', tempNumero)
      .eq('episodio_numero', epNumero)

      const novos = {...assistidos}
      delete novos[key]
      setAssistidos(novos)
    } else {
      await supabase
      .from('user_episodios')
      .insert({
          serie_id: parseInt(params.id),
          temporada_numero: tempNumero,
          episodio_numero: epNumero
        })

      setAssistidos({...assistidos, [key]: true})
    }
  }

  async function marcarTemporadaCompleta(tempNumero, totalEps) {
    const episodiosParaMarcar = []
    for (let ep = 1; ep <= totalEps; ep++) {
      if (!assistidos[`${tempNumero}-${ep}`]) {
        episodiosParaMarcar.push({
          serie_id: parseInt(params.id),
          temporada_numero: tempNumero,
          episodio_numero: ep
        })
      }
    }

    if (episodiosParaMarcar.length > 0) {
      await supabase.from('user_episodios').insert(episodiosParaMarcar)
      const novos = {...assistidos}
      episodiosParaMarcar.forEach(ep => {
        novos[`${ep.temporada_numero}-${ep.episodio_numero}`] = true
      })
      setAssistidos(novos)
    }
  }

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
        <p style={{lineHeight: '1.6'}}>{serie.sinopse}</p>
      </div>

      <h3 style={{color: '#FACC15', marginTop: '24px', marginBottom: '12px'}}>Temporadas</h3>

      {temporadas.map(temp => {
        const epsAssistidos = Array.from({length: temp.episodios}, (_, i) => i + 1)
         .filter(ep => assistidos[`${temp.numero}-${ep}`]).length
        const completa = epsAssistidos === temp.episodios

        return (
          <div key={temp.id} className="card" style={{marginBottom: '12px'}}>
            <div
              style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}
              onClick={() => setTempAberta(tempAberta === temp.id? null : temp.id)}
            >
              <div>
                <strong>Temporada {temp.numero} {completa && '✓'}</strong>
                <p style={{color: '#94A3B8', fontSize: '14px', marginTop: '4px'}}>
                  {epsAssistidos}/{temp.episodios} episódios • {temp.ano}
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                style={{
                  width: '20px',
                  transform: tempAberta === temp.id? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {tempAberta === temp.id && (
              <div style={{marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px'}}>
                <button
                  onClick={() => marcarTemporadaCompleta(temp.numero, temp.episodios)}
                  disabled={completa}
                  style={{
                    width: '100%',
                    background: completa? '#1E293B' : '#FACC15',
                    color: completa? '#64748B' : '#000',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: completa? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}
                >
                  {completa? 'Temporada Completa ✓' : 'Marcar Temporada Inteira'}
                </button>

                {Array.from({length: temp.episodios}, (_, i) => i + 1).map(ep => {
                  const assistido = assistidos[`${temp.numero}-${ep}`]
                  return (
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
                      <span style={{color: assistido? '#FACC15' : '#fff'}}>
                        Episódio {ep} {assistido && '✓'}
                      </span>
                      <button
                        onClick={() => toggleEpisodio(temp.numero, ep)}
                        style={{
                          background: assistido? '#FACC15' : '#1E293B',
                          color: assistido? '#000' : '#94A3B8',
                          border: '1px solid #334155',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: assistido? 'bold' : 'normal'
                        }}
                      >
                        {assistido? 'Assistido' : 'Marcar'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </main>
  )
}
