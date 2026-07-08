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
  const [temporadaAberta, setTemporadaAberta] = useState(null)
  const [episodiosAssistidos, setEpisodiosAssistidos] = useState({})
  const [avaliacoes, setAvaliacoes] = useState({})
  const [comentarios, setComentarios] = useState({})
  const [comentarioAtivo, setComentarioAtivo] = useState(null)
  const [textoComentario, setTextoComentario] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarDados()
  }, [params.id, user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
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

      if (temps) {
        setTemporadas(temps)
        if (temps.length > 0) setTemporadaAberta(temps[0].numero)
      }

      if (user) {
        const { data: assistidos } = await supabase
     .from('user_episodios')
     .select('*')
     .eq('user_id', user.id)
     .eq('serie_id', params.id)

        const assistidosObj = {}
        assistidos?.forEach(a => {
          assistidosObj[`${a.temporada_numero}-${a.episodio_numero}`] = true
        })
        setEpisodiosAssistidos(assistidosObj)

        const { data: avals } = await supabase
     .from('user_avaliacoes')
     .select('*')
     .eq('user_id', user.id)
     .eq('serie_id', params.id)

        const avalsObj = {}
        avals?.forEach(a => {
          avalsObj[`${a.temporada_numero}-${a.episodio_numero}`] = a
        })
        setAvaliacoes(avalsObj)
      }

      // Busca comentários públicos
      const { data: coments } = await supabase
   .from('comentarios_episodios')
   .select('*, profiles(nome, avatar_url)')
   .eq('serie_id', params.id)
   .order('created_at', { ascending: false })

      const comentsObj = {}
      coments?.forEach(c => {
        const key = `${c.temporada_numero}-${c.episodio_numero}`
        if (!comentsObj[key]) comentsObj[key] = []
        comentsObj[key].push(c)
      })
      setComentarios(comentsObj)
    }
    setLoading(false)
  }

  async function toggleEpisodio(tempNum, epNum) {
    const key = `${tempNum}-${epNum}`
    const jaAssistiu = episodiosAssistidos[key]

    if (jaAssistiu) {
      await supabase
   .from('user_episodios')
   .delete()
   .eq('user_id', user.id)
   .eq('serie_id', params.id)
   .eq('temporada_numero', tempNum)
   .eq('episodio_numero', epNum)

      setEpisodiosAssistidos(prev => {
        const novo = {...prev }
        delete novo[key]
        return novo
      })
    } else {
      await supabase
   .from('user_episodios')
   .insert({
      user_id: user.id,
      serie_id: params.id,
      temporada_numero: tempNum,
      episodio_numero: epNum
    })

      setEpisodiosAssistidos(prev => ({...prev, [key]: true }))
    }
  }

  async function salvarAvaliacao(tempNum, epNum, nota, comentario) {
    const key = `${tempNum}-${epNum}`

    await supabase
 .from('user_avaliacoes')
 .upsert({
    user_id: user.id,
    serie_id: params.id,
    temporada_numero: tempNum,
    episodio_numero: epNum,
    nota,
    comentario
  })

    setAvaliacoes(prev => ({
     ...prev,
      [key]: { nota, comentario }
    }))
  }

  async function enviarComentario(tempNum, epNum) {
    if (!textoComentario.trim()) return

    await supabase
 .from('comentarios_episodios')
 .insert({
    user_id: user.id,
    serie_id: params.id,
    temporada_numero: tempNum,
    episodio_numero: epNum,
    comentario: textoComentario
  })

    setTextoComentario('')
    setComentarioAtivo(null)
    buscarDados()
  }

  function tempoAtras(data) {
    const agora = new Date()
    const diff = agora - new Date(data)
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (dias > 0) return `${dias}d`
    if (horas > 0) return `${horas}h`
    if (minutos > 0) return `${minutos}min`
    return 'agora'
  }

  if (loading) return <main className="main"><div className="card">Carregando...</div></main>
  if (!serie) return <main className="main"><div className="card">Série não encontrada</div></main>

  const EpisodioItem = ({ tempNum, epNum }) => {
    const key = `${tempNum}-${epNum}`
    const assistido = episodiosAssistidos[key]
    const avaliacao = avaliacoes[key]
    const coments = comentarios[key] || []
    const mostrandoComents = comentarioAtivo === key

    return (
      <div style={{
        background: assistido? '#1E293B' : 'transparent',
        border: '1px solid #334155',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px'
        }}>
          <div
            onClick={() => toggleEpisodio(tempNum, epNum)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid #FACC15',
              background: assistido? '#FACC15' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
          >
            {assistido && '✓'}
          </div>

          <div style={{flex: 1}}>
            <p style={{color: '#fff', fontSize: '14px'}}>Episódio {epNum}</p>
          </div>

          {assistido && (
            <div style={{display: 'flex', gap: '4px'}}>
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  onClick={() => salvarAvaliacao(tempNum, epNum, i + 1, avaliacao?.comentario || '')}
                  style={{
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: i < (avaliacao?.nota || 0)? '#FACC15' : '#334155'
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setComentarioAtivo(mostrandoComents? null : key)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FACC15',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            💬 {coments.length}
          </button>
        </div>

        {mostrandoComents && (
          <div style={{padding: '0 12px 12px'}}>
            {user && (
              <div style={{marginBottom: '12px', display: 'flex', gap: '8px'}}>
                <input
                  type="text"
                  value={textoComentario}
                  onChange={(e) => setTextoComentario(e.target.value)}
                  placeholder="Comente sobre esse episódio..."
                  style={{
                    flex: 1,
                    background: '#0F172A',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && enviarComentario(tempNum, epNum)}
                />
                <button
                  onClick={() => enviarComentario(tempNum, epNum)}
                  style={{
                    background: '#FACC15',
                    color: '#000',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Enviar
                </button>
              </div>
            )}

            {coments.map((c, i) => (
              <div key={i} style={{
                background: '#0F172A',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '8px'
              }}>
                <div style={{display: 'flex', gap: '8px', marginBottom: '6px'}}>
                  <img
                    src={c.profiles?.avatar_url || 'https://via.placeholder.com/24'}
                    alt={c.profiles?.nome}
                    style={{width: '24px', height: '24px', borderRadius: '50%'}}
                  />
                  <div style={{flex: 1}}>
                    <p style={{color: '#FACC15', fontSize: '12px', fontWeight: 'bold'}}>
                      {c.profiles?.nome || 'Anônimo'}
                    </p>
                    <p style={{color: '#64748B', fontSize: '11px'}}>
                      {tempoAtras(c.created_at)}
                    </p>
                  </div>
                </div>
                <p style={{color: '#94A3B8', fontSize: '13px', lineHeight: '1.5'}}>
                  {c.comentario}
                </p>
              </div>
            ))}

            {coments.length === 0 && (
              <p style={{color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '8px'}}>
                Seja o primeiro a comentar!
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

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
        </div>
        <p style={{color: '#94A3B8', fontSize: '14px', lineHeight: '1.6'}}>
          {serie.sinopse}
        </p>
      </div>

      {temporadas.map(temp => (
        <div key={temp.id} style={{marginBottom: '16px'}}>
          <button
            onClick={() => setTemporadaAberta(temporadaAberta === temp.numero? null : temp.numero)}
            style={{
              width: '100%',
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Temporada {temp.numero}</span>
            <span>{temporadaAberta === temp.numero? '▼' : '▶'}</span>
          </button>

          {temporadaAberta === temp.numero && (
            <div style={{padding: '12px 0'}}>
              {Array.from({ length: temp.episodios }, (_, i) => (
                <EpisodioItem
                  key={i}
                  tempNum={temp.numero}
                  epNum={i + 1}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  )
}
