'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Serie() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [serie, setSerie] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [episodiosAssistidos, setEpisodiosAssistidos] = useState({})
  const [avaliacoes, setAvaliacoes] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [epSelecionado, setEpSelecionado] = useState(null)
  const [notaTemp, setNotaTemp] = useState(5)
  const [comentarioTemp, setComentarioTemp] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarDados()
  }, [user, params.id])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
    }
  }

  async function buscarDados() {
    const { data: serieData } = await supabase
     .from('series')
     .select('*')
     .eq('id', params.id)
     .single()

    if (serieData) {
      setSerie(serieData)

      const { data: temps } = await supabase
       .from('temporadas')
       .select('*')
       .eq('serie_id', params.id)
       .order('numero')

      setTemporadas(temps || [])

      const { data: assistidos } = await supabase
       .from('user_episodios')
       .select('temporada_numero, episodio_numero')
       .eq('serie_id', params.id)

      const assistidosMap = {}
      assistidos?.forEach(e => {
        const key = `${e.temporada_numero}-${e.episodio_numero}`
        assistidosMap[key] = true
      })
      setEpisodiosAssistidos(assistidosMap)

      const { data: avaliacoesData } = await supabase
       .from('user_avaliacoes')
       .select('*')
       .eq('serie_id', params.id)

      const avaliacoesMap = {}
      avaliacoesData?.forEach(a => {
        const key = `${a.temporada_numero}-${a.episodio_numero}`
        avaliacoesMap[key] = a
      })
      setAvaliacoes(avaliacoesMap)
    }
    setLoading(false)
  }

  async function toggleEpisodio(temporada, episodio) {
    const key = `${temporada}-${episodio}`
    const jaAssistido = episodiosAssistidos[key]

    if (jaAssistido) {
      await supabase
       .from('user_episodios')
       .delete()
       .eq('serie_id', params.id)
       .eq('temporada_numero', temporada)
       .eq('episodio_numero', episodio)

      setEpisodiosAssistidos(prev => {
        const novo = {...prev }
        delete novo[key]
        return novo
      })
    } else {
      await supabase
       .from('user_episodios')
       .insert({
          serie_id: params.id,
          temporada_numero: temporada,
          episodio_numero: episodio
        })

      setEpisodiosAssistidos(prev => ({
       ...prev,
        [key]: true
      }))
    }
  }

  async function marcarTemporada(temporadaNumero, totalEps) {
    const todosMarcados = Array.from({ length: totalEps }, (_, i) => i + 1)
     .every(ep => episodiosAssistidos[`${temporadaNumero}-${ep}`])

    if (todosMarcados) {
      // Desmarca todos
      for (let ep = 1; ep <= totalEps; ep++) {
        await supabase
         .from('user_episodios')
         .delete()
         .eq('serie_id', params.id)
         .eq('temporada_numero', temporadaNumero)
         .eq('episodio_numero', ep)
      }
      setEpisodiosAssistidos(prev => {
        const novo = {...prev }
        for (let ep = 1; ep <= totalEps; ep++) {
          delete novo[`${temporadaNumero}-${ep}`]
        }
        return novo
      })
    } else {
      // Marca todos
      const inserts = Array.from({ length: totalEps }, (_, i) => ({
        serie_id: params.id,
        temporada_numero: temporadaNumero,
        episodio_numero: i + 1
      }))
      await supabase.from('user_episodios').insert(inserts)

      setEpisodiosAssistidos(prev => {
        const novo = {...prev }
        for (let ep = 1; ep <= totalEps; ep++) {
          novo[`${temporadaNumero}-${ep}`] = true
        }
        return novo
      })
    }
  }

  function abrirModalAvaliacao(temporada, episodio) {
    const key = `${temporada}-${episodio}`
    const avaliacaoExistente = avaliacoes[key]

    setEpSelecionado({ temporada, episodio })
    setNotaTemp(avaliacaoExistente?.nota || 5)
    setComentarioTemp(avaliacaoExistente?.comentario || '')
    setModalAberto(true)
  }

  async function salvarAvaliacao() {
    if (!epSelecionado) return
    setSalvando(true)

    const { temporada, episodio } = epSelecionado
    const key = `${temporada}-${episodio}`

    try {
      const { error } = await supabase
       .from('user_avaliacoes')
       .upsert({
          serie_id: params.id,
          temporada_numero: temporada,
          episodio_numero: episodio,
          nota: notaTemp,
          comentario: comentarioTemp
        }, {
          onConflict: 'user_id,serie_id,temporada_numero,episodio_numero'
        })

      if (error) throw error

      setAvaliacoes(prev => ({
       ...prev,
        [key]: {
          nota: notaTemp,
          comentario: comentarioTemp
        }
      }))

      setModalAberto(false)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar avaliação')
    }
    setSalvando(false)
  }

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>
  if (!serie) return <main className="main"><div className="card">Série não encontrada</div></main>

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <div className="card" style={{marginBottom: '24px'}}>
        <img
          src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
          alt={serie.titulo}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '16px'
          }}
        />
        <h1 style={{color: '#FACC15', marginBottom: '8px'}}>{serie.titulo}</h1>
        <div style={{color: '#94A3B8', fontSize: '14px', marginBottom: '12px'}}>
          <span>⭐ {serie.nota?.toFixed(1)}</span>
          <span style={{margin: '0 8px'}}>•</span>
          <span>{serie.ano}</span>
          {serie.generos && (
            <>
              <span style={{margin: '0 8px'}}>•</span>
              <span>{serie.generos}</span>
            </>
          )}
        </div>
        <p style={{color: '#94A3B8', fontSize: '14px', lineHeight: '1.6'}}>
          {serie.sinopse}
        </p>
      </div>

      {temporadas.map(temp => {
        const totalEps = temp.episodios
        const marcados = Array.from({ length: totalEps }, (_, i) => i + 1)
         .filter(ep => episodiosAssistidos[`${temp.numero}-${ep}`]).length
        const percentual = totalEps > 0? Math.round((marcados / totalEps) * 100) : 0
        const todosMarcados = marcados === totalEps

        return (
          <div key={temp.numero} className="card" style={{marginBottom: '16px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h3 style={{color: '#FACC15', margin: 0}}>
                Temporada {temp.numero}
              </h3>
              <button
                onClick={() => marcarTemporada(temp.numero, totalEps)}
                style={{
                  background: todosMarcados? '#22C55E' : '#1E293B',
                  color: todosMarcados? '#fff' : '#94A3B8',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {todosMarcados? '✓ Completa' : 'Marcar todos'}
              </button>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '8px'}}>
              <span>{marcados}/{totalEps} episódios</span>
              <span style={{color: '#FACC15', fontWeight: 'bold'}}>{percentual}%</span>
            </div>
            <div style={{width: '100%', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px'}}>
              <div style={{
                width: `${percentual}%`,
                height: '100%',
                background: '#FACC15',
                transition: 'width 0.3s'
              }} />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '8px'}}>
              {Array.from({ length: totalEps }, (_, i) => i + 1).map(ep => {
                const key = `${temp.numero}-${ep}`
                const assistido = episodiosAssistidos[key]
                const avaliacao = avaliacoes[key]

                return (
                  <div key={ep} style={{position: 'relative'}}>
                    <button
                      onClick={() => toggleEpisodio(temp.numero, ep)}
                      style={{
                        width: '100%',
                        background: assistido? '#22C55E' : '#1E293B',
                        color: assistido? '#fff' : '#94A3B8',
                        border: 'none',
                        padding: '10px 0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: assistido? 'bold' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      {ep}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        abrirModalAvaliacao(temp.numero, ep)
                      }}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: avaliacao? '#FACC15' : '#334155',
                        color: avaliacao? '#000' : '#94A3B8',
                        border: 'none',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {avaliacao? '⭐' : '+'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Modal de Avaliação */}
      {modalAberto && epSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{maxWidth: '400px', width: '100%'}}>
            <h3 style={{color: '#FACC15', marginBottom: '16px'}}>
              Avaliar T{epSelecionado.temporada}E{epSelecionado.episodio}
            </h3>

            <div style={{marginBottom: '16px'}}>
              <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '8px'}}>Nota:</p>
              <div style={{display: 'flex', gap: '8px'}}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setNotaTemp(n)}
                    style={{
                      background: n <= notaTemp? '#FACC15' : '#1E293B',
                      color: n <= notaTemp? '#000' : '#94A3B8',
                      border: 'none',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      fontSize: '18px',
                      cursor: 'pointer'
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom: '20px'}}>
              <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '8px'}}>Comentário:</p>
              <textarea
                value={comentarioTemp}
                onChange={(e) => setComentarioTemp(e.target.value)}
                placeholder="O que achou do episódio?"
                rows={4}
                style={{
                  width: '100%',
                  background: '#1E293B',
                  border: '1px solid #334155',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={() => setModalAberto(false)}
                style={{
                  flex: 1,
                  background: '#1E293B',
                  color: '#94A3B8',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarAvaliacao}
                disabled={salvando}
                style={{
                  flex: 1,
                  background: '#FACC15',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: salvando? 'not-allowed' : 'pointer',
                  opacity: salvando? 0.5 : 1
                }}
              >
                {salvando? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
