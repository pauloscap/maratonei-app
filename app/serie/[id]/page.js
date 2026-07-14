"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY

export default function SeriePage(){
  const { id } = useParams()
  const router = useRouter()
  const [serie,setSerie]=useState(null)
  const [tmdb,setTmdb]=useState(null)
  const [temp,setTemp]=useState(1)
  const [eps,setEps]=useState([])
  const [vistos,setVistos]=useState([])
  const [status,setStatus]=useState('quero_assistir')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    try{
      const p=localStorage.getItem('progress-'+id)
      if(p) setVistos(JSON.parse(p))
      const s=localStorage.getItem('status-'+id)
      if(s) setStatus(s)
    }catch(e){}
    init()
  },[])

  useEffect(()=>{ if(!loading) localStorage.setItem('progress-'+id, JSON.stringify(vistos)) },[vistos])
  useEffect(()=>{ if(!loading) localStorage.setItem('status-'+id, status) },[status])

  async function init(){
    const ses = await supabase.auth.getSession()
    if(!ses.data.session) return router.push('/login')
    const res = await supabase.from('series').select('*').eq('id',id).single()
    if(!res.data) return router.push('/')
    setSerie(res.data)
    if(res.data.tmdb_id){
      const r = await fetch('https://api.themoviedb.org/3/tv/'+res.data.tmdb_id+'?api_key='+TMDB_KEY+'&language=pt-BR')
      const j = await r.json()
      setTmdb(j)
      const primeira = j.seasons ? j.seasons.find(function(x){return x.season_number>0}) : null
      const alvo = primeira || (j.seasons ? j.seasons[0] : null)
      if(alvo) loadEp(alvo.season_number, res.data.tmdb_id)
    }
    setLoading(false)
  }

  async function loadEp(n,tid){
    const t = tid || (serie ? serie.tmdb_id : null)
    if(!t) return
    setTemp(n)
    const r = await fetch('https://api.themoviedb.org/3/tv/'+t+'/season/'+n+'?api_key='+TMDB_KEY+'&language=pt-BR')
    const j = await r.json()
    setEps(j.episodes||[])
  }

  function toggle(t,e){
    const ex = vistos.find(function(a){return a.temporada===t && a.episodio===e})
    if(ex){
      setVistos(vistos.filter(function(a){return !(a.temporada===t && a.episodio===e)}))
    } else {
      const novo = vistos.concat([{temporada:t,episodio:e}])
      setVistos(novo)
      if(novo.length===1) setStatus('assistindo')
    }
  }

  function trocarStatus(){
    const novo = status==='assistindo' ? 'quero_assistir' : 'assistindo'
    setStatus(novo)
  }

  if(loading || !serie){
    return <main style={{background:'#0F172A',minHeight:'100vh',padding:'20px',color:'#fff'}}>Carregando...</main>
  }

  const temporadas = tmdb && tmdb.seasons ? tmdb.seasons.filter(function(s){return s.season_number>0}) : []
  const total = tmdb && tmdb.number_of_episodes ? tmdb.number_of_episodes : 0
  const pct = total>0 ? Math.round(vistos.length/total*100) : 0

  return (
    <main style={{maxWidth:'800px',margin:'0 auto',padding:'0 16px 40px',background:'#0F172A',minHeight:'100vh'}}>
      <button onClick={function(){router.push('/')}} style={{background:'none',border:'none',color:'#FACC15',margin:'16px 0',cursor:'pointer'}}>Voltar</button>
      <div style={{height:'260px',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}>
        <img src={'https://image.tmdb.org/t/p/w780'+serie.poster} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
      </div>
      <h1 style={{color:'#FACC15',fontSize:'26px',fontWeight:900,margin:'0 0 10px'}}>{serie.titulo}</h1>

      <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'14px'}}>
        <button onClick={trocarStatus} style={{padding:'10px 18px',borderRadius:'24px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'13px',background:status==='assistindo'?'#FACC15':'#334155',color:status==='assistindo'?'#000':'#fff'}}>
          {status==='assistindo' ? 'Assistindo' : 'Quero Assistir'}
        </button>
        <span style={{color:'#64748B',fontSize:'12px'}}>{status==='assistindo' ? 'Na aba Assistindo' : 'Na aba Quero Assistir'}</span>
      </div>

      <div style={{background:'#1E293B',height:'8px',borderRadius:'4px',overflow:'hidden',margin:'12px 0 6px'}}>
        <div style={{width:pct+'%',height:'100%',background:'#FACC15'}} />
      </div>
      <div style={{display:'flex',justifyContent:'space-between',color:'#94A3B8',fontSize:'13px',marginBottom:'16px'}}>
        <span>{vistos.length}/{total}</span>
        <b style={{color:'#FACC15'}}>{pct}%</b>
      </div>

      <div style={{display:'flex',gap:'8px',overflowX:'auto',marginBottom:'16px',paddingBottom:'4px'}}>
        {temporadas.map(function(s){
          const qtd = vistos.filter(function(a){return a.temporada===s.season_number}).length
          return (
            <button key={s.id} onClick={function(){loadEp(s.season_number)}} style={{padding:'8px 14px',borderRadius:'20px',border:temp===s.season_number?'2px solid #FACC15':'1px solid #334155',background:temp===s.season_number?'#FACC15':'#1E293B',color:temp===s.season_number?'#000':'#fff',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
              {'T'+s.season_number+' - '+qtd+'/'+s.episode_count}
            </button>
          )
        })}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
        {eps.map(function(ep){
          const ok = vistos.some(function(a){return a.temporada===temp && a.episodio===ep.episode_number})
          return (
            <div key={ep.id} onClick={function(){toggle(temp,ep.episode_number)}} style={{display:'flex',gap:'12px',padding:'14px',borderRadius:'12px',cursor:'pointer',background:ok?'#FACC15':'#1E293B',color:ok?'#000':'#fff'}}>
              <div style={{width:'22px',height:'22px',borderRadius:'6px',border:'2px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,flexShrink:0}}>{ok?'✓':''}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>{ep.episode_number+'. '+(ep.name||'Episodio '+ep.episode_number)}</div>
                <div style={{opacity:0.7,fontSize:'13px',marginTop:'4px'}}>{ep.overview ? ep.overview.slice(0,90) : 'Sem descricao'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
