'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY

export default function SeriePage() {
  const { id } = useParams()
  const router = useRouter()
  const [serie, setSerie] = useState(null)
  const [tmdbData, setTmdbData] = useState(null)
  const [tempAberta, setTempAberta] = useState(1)
  const [episodiosTemp, setEpisodiosTemp] = useState([])
  const [assistidos, setAssistidos] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')
    setUser(session.user)
    const { data: serieData } = await supabase.from('series').select('*').eq('id', id).single()
    if (!serieData) return router.push('/')
    setSerie(serieData)
    if (serieData.tmdb_id) {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${serieData.tmdb_id}?api_key=${TMDB_KEY}&language=pt-BR`)
      const data = await res.json()
      setTmdbData(data)
      if (data.seasons && data.seasons.length > 0) {
        const primeira = data.seasons.find(function(s){return s.season_number > 0}) || data.seasons[0]
        carregarEpisodios(primeira.season_number, serieData.tmdb_id)
      }
    }
    const { data: prog } = await supabase.from('user_episodios').select('*').eq('user_id', session.user.id).eq('serie_id', id)
    setAssistidos(prog || [])
    setLoading(false)
  }

  async function carregarEpisodios(numTemp, tmdbId) {
    const tid = tmdbId || (serie ? serie.tmdb_id : null)
    if (!tid) return
    setTempAberta(numTemp)
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tid}/season/${numTemp}?api_key=${TMDB_KEY}&language=pt-BR`)
    const data = await res.json()
    setEpisodiosTemp(data.episodes || [])
  }

  async function toggleEp(temp, epNum) {
    const existe = assistidos.find(function(a){return a.temporada === temp && a.episodio === epNum})
    if (existe) {
      setAssistidos(function(prev){return prev.filter(function(a){return a.id !== existe.id})})
      await supabase.from('user_episodios').delete().eq('id', existe.id)
    } else {
      const tempId = 'temp-' + Date.now()
      const novo = { id: tempId, temporada: temp, episodio: epNum }
      setAssistidos(function(prev){return [].concat(prev, [novo])})
      const result = await supabase.from('user_episodios').insert({ user_id: user.id, serie_id: id, temporada: temp, episodio: epNum }).select().single()
      if (result.error) {
        setAssistidos(function(prev){return prev.filter(function(a){return a.id !== tempId})})
      } else if (result.data) {
        setAssistidos(function(prev){return prev.map(function(a){return a.id === tempId ? result.data : a})})
      }
    }
  }

  if (loading || !serie) {
    return <main className="main"><div style={{background:'#1E293B',padding:'20px',borderRadius:'12px',margin:'20px'}}>Carregando série...</div></main>
  }

  const temporadas = tmdbData && tmdbData.seasons ? tmdbData.seasons.filter(function(s){return s.season_number > 0}) : []
  const totalEps = tmdbData && tmdbData.number_of_episodes ? tmdbData.number_of_episodes : temporadas.reduce(function(acc, t){return acc + t.episode_count}, 0)
  const pct = totalEps > 0 ? Math.round((assistidos.length / totalEps) * 100) : 0

  return (
    <main className="main" style={{maxWidth:'800px', margin:'0 auto', padding:'0 16px 40px'}}>
      <button onClick={function(){router.push('/')}} style={{background:'none',border:'none',color:'#FACC15',cursor:'pointer',margin:'16px 0', fontSize:'15px'}}>Voltar</button>
      <div style={{height:'280px', borderRadius:'16px', overflow:'hidden', marginBottom:'16px', background:'#1E293B'}}>
        <img src={'https://image.tmdb.org/t/p/w780' + serie.poster} style={{width:'100%',height:'100%',objectFit:'cover'}} />
      </div>
      <h1 style={{color:'#FACC15', fontSize:'28px', margin:'0 0 8px', fontWeight:'900'}}>{serie.titulo}</h1>
      <p style={{color:'#94A3B8', fontSize:'14px', marginBottom:'12px'}}> {Number(serie.nota).toFixed(1)} - {serie.ano} - {totalEps} episodios</p>
      <div style={{background:'#1E293B', height:'10px', borderRadius:'5px', overflow:'hidden', marginBottom:'8px'}}>
        <div style={{width: pct + '%', height:'100%', background:'#FACC15'}} />
      </div>
      <div style={{display:'flex', justifyContent:'space-between', color:'#94A3B8', fontSize:'13px', marginBottom:'20px'}}>
        <span>{assistidos.length}/{totalEps} episodios</span><span style={{color:'#FACC15', fontWeight:'800'}}>{pct}%</span>
      </div>
      <p style={{color:'#CBD5E1', fontSize:'15px', lineHeight:'1.6', marginBottom:'24px'}}>{serie.sinopse}</p>
      <h3 style={{color:'#fff', marginBottom:'12px'}}>Temporadas</h3>
      <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'12px', marginBottom:'16px'}}>
        {temporadas.map(function(t){
          return (
            <button key={t.id} onClick={function(){carregarEpisodios(t.season_number)}} style={{padding:'8px 14px', borderRadius:'20px', border: tempAberta===t.season_number?'2px solid #FACC15':'1px solid #334155', background: tempAberta===t.season_number?'#FACC15':'#1E293B', color: tempAberta===t.season_number?'#000':'#fff', cursor:'pointer', whiteSpace:'nowrap', fontWeight:'700', fontSize:'13px'}}>
              T{t.season_number} - {assistidos.filter(function(a){return a.temporada===t.season_number}).length}/{t.episode_count}
            </button>
          )
        })}
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
        {episodiosTemp.map(function(ep){
          const visto = assistidos.some(function(a){return a.temporada===tempAberta && a.episodio===ep.episode_number})
          return (
            <div key={ep.id} onClick={function(){toggleEp(tempAberta, ep.episode_number)}} style={{display:'flex', gap:'12px', alignItems:'flex-start', background: visto?'#1a1a00':'#1E293B', padding:'14px', borderRadius:'12px', cursor:'pointer', border: visto?'1px solid #FACC15':'1px solid transparent'}}>
              <div style={{width:'20px', height:'20px', borderRadius:'4px', border: visto?'2px solid #FACC15':'2px solid #475569', background: visto?'#FACC15':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'900', flexShrink:0, marginTop:'1px', color:'#000'}}>
                {visto? 'OK' : ''}
              </div>
              <div style={{flex:1}}>
                <div style={{color: visto?'#FACC15':'#fff', fontSize:'15px', fontWeight: visto?'700':'500'}}>{ep.episode_number}. {ep.name || 'Episodio ' + ep.episode_number}</div>
                <div style={{color:'#64748B', fontSize:'13px', marginTop:'4px', lineHeight:'1.4'}}>{ep.overview || 'Sem descricao.'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
