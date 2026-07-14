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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const key = `progress-${id}`
    const salvo = localStorage.getItem(key)
    if(salvo) setAssistidos(JSON.parse(salvo))
    init()
  }, [])

  useEffect(() => {
    if(assistidos.length >= 0 &&!loading){
      localStorage.setItem(`progress-${id}`, JSON.stringify(assistidos))
    }
  }, [assistidos])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')
    const { data: serieData } = await supabase.from('series').select('*').eq('id', id).single()
    if (!serieData) return router.push('/')
    setSerie(serieData)
    if (serieData.tmdb_id) {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${serieData.tmdb_id}?api_key=${TMDB_KEY}&language=pt-BR`)
      const data = await res.json()
      setTmdbData(data)
      const primeira = data.seasons?.find(s => s.season_number > 0) || data.seasons?.[0]
      if(primeira) carregarEpisodios(primeira.season_number, serieData.tmdb_id)
    }
    setLoading(false)
  }

  async function carregarEpisodios(numTemp, tmdbId) {
    const tid = tmdbId || serie?.tmdb_id
    if (!tid) return
    setTempAberta(numTemp)
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tid}/season/${numTemp}?api_key=${TMDB_KEY}&language=pt-BR`)
    const data = await res.json()
    setEpisodiosTemp(data.episodes || [])
  }

  function toggleEp(temp, epNum) {
    const existe = assistidos.find(a => a.temporada === temp && a.episodio === epNum)
    let novo
    if (existe) {
      novo = assistidos.filter(a =>!(a.temporada === temp && a.episodio === epNum))
    } else {
      novo = [...assistidos, { temporada: temp, episodio: epNum }]
    }
    setAssistidos(novo)
    // tenta salvar no supabase em segundo plano, mas não desfaz se falhar
    supabase.from('user_episodios').insert({ user_id: '00000000-0000-0000-0000-000000000000', serie_id: id, temporada: temp, episodio: epNum }).then(()=>{})
  }

  if (loading ||!serie) return <main style={{background:'#0F172A',minHeight:'100vh',padding:'20px',color:'#fff'}}>Carregando...</main>

  const temporadas = tmdbData?.seasons?.filter(s => s.season_number > 0) || []
  const totalEps = tmdbData?.number_of_episodes || 0
  const pct = totalEps > 0? Math.round((assistidos.length / totalEps) * 100) : 0

  return (
    <main style={{maxWidth:'800px', margin:'0 auto', padding:'0 16px 40px', background:'#0F172A', minHeight:'100vh'}}>
      <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#FACC15',cursor:'pointer',margin:'16px 0'}}>← Voltar</button>
      <div style={{height:'260px', borderRadius:'16px', overflow:'hidden', marginBottom:'16px'}}>
        <img src={`https://image.tmdb.org/t/p/w780${serie.poster}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
      </div>
      <h1 style={{color:'#FACC15', fontSize:'26px', fontWeight:'900'}}>{serie.titulo}</h1>
      <div style={{background:'#1E293B', height:'10px', borderRadius:'5px', overflow:'hidden', margin:'12px 0 8px'}}>
        <div style={{width:`${pct}%`, height:'100%', background:'#FACC15'}} />
      </div>
      <div style={{color:'#94A3B8', fontSize:'13px', marginBottom:'18px', display:'flex', justifyContent:'space-between'}}>
        <span>{assistidos.length}/{totalEps} vistos</span><b style={{color:'#FACC15'}}>{pct}%</b>
      </div>
      <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'12px', marginBottom:'16px'}}>
        {temporadas.map(t => (
          <button key={t.id} onClick={()=>carregarEpisodios(t.season_number)} style={{padding:'8px 14px', borderRadius:'20px', border: tempAberta===t.season_number?'2px solid #FACC15':'1px solid #334155', background: tempAberta===t.season_number?'#FACC15':'#1E293B', color: tempAberta===t.season_number?'#000':'#fff', cursor:'pointer', fontWeight:'700'}}>
            T{t.season_number}
          </button>
        ))}
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
        {episodiosTemp.map(ep => {
          const visto = assistidos.some(a=>a.temporada===tempAberta && a.episodio===ep.episode_number)
          return (
            <div key={ep.id} onClick={()=>toggleEp(tempAberta, ep.episode_number)} style={{display:'flex', gap:'12px', padding:'14px', borderRadius:'12px', cursor:'pointer', background: visto?'#FACC15':'#1E293B', color: visto?'#000':'#fff', border:'1px solid transparent'}}>
              <div style={{width:'22px',height:'22px',borderRadius:'6px',border:'2px solid #000',background:visto?'#000':'transparent',color:visto?'#FACC15':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'900'}}>✓</div>
              <div><b>{ep.episode_number}. {ep.name}</b><div style={{opacity:0.7,fontSize:'13px',marginTop:'4px'}}>{ep.overview?.slice(0,90) || 'Sem descricao'}</div></div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
