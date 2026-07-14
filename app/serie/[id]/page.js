'use client'
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
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    const s=localStorage.getItem(`progress-${id}`); if(s) setVistos(JSON.parse(s))
    init()
  },[])

  useEffect(()=>{ if(!loading) localStorage.setItem(`progress-${id}`,JSON.stringify(vistos)) },[vistos])

  async function init(){
    const { data:{session} }=await supabase.auth.getSession(); if(!session) return router.push('/login')
    const { data }=await supabase.from('series').select('*').eq('id',id).single(); if(!data) return router.push('/'); setSerie(data)
    if(data.tmdb_id){ const r=await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${TMDB_KEY}&language=pt-BR`); const j=await r.json(); setTmdb(j); const p=j.seasons?.find(s=>s.season_number>0)||j.seasons?.[0]; if(p) loadEp(p.season_number,data.tmdb_id) }
    setLoading(false)
  }

  async function loadEp(n,tmdbId){ const tid=tmdbId||serie?.tmdb_id; if(!tid) return; setTemp(n); const r=await fetch(`https://api.themoviedb.org/3/tv/${tid}/season/${n}?api_key=${TMDB_KEY}&language=pt-BR`); const j=await r.json(); setEps(j.episodes||[]) }

  function toggle(t,e){ const ex=vistos.find(a=>a.temporada===t&&a.episodio===e); if(ex) setVistos(vistos.filter(a=>!(a.temporada===t&&a.episodio===e))); else setVistos([...vistos,{temporada:t,episodio:e}]) }

  if(loading||!serie) return <main style={{background:'#0F172A',minHeight:'100vh',padding:'20px',color:'#fff'}}>Carregando...</main>
  const temporadas=tmdb?.seasons?.filter(s=>s.season_number>0)||[]; const total=tmdb?.number_of_episodes||0; const pct=total>0?Math.round(vistos.length/total*100):0

  return(
    <main style={{maxWidth:'800px',margin:'0 auto',padding:'0 16px 40px',background:'#0F172A',minHeight:'100vh'}}>
      <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#FACC15',margin:'16px 0',cursor:'pointer'}}>← Voltar</button>
      <div style={{height:'260px',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}><img src={`https://image.tmdb.org/t/p/w780${serie.poster}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
      <h1 style={{color:'#FACC15',fontSize:'26px',fontWeight:900,margin:'0'}}>{serie.titulo}</h1>
      <div style={{background:'#1E293B',height:'8px',borderRadius:'4px',overflow:'hidden',margin:'12px 0 6px'}}><div style={{width:`${pct}%`,height:'100%',background:'#FACC15'}}/></div>
      <div style={{display:'flex',justifyContent:'space-between',color:'#94A3B8',fontSize:'13px',marginBottom:'16px'}}><span>{vistos.length}/{total}</span><b style={{color:'#FACC15'}}>{pct}%</b></div>
      <div style={{display:'flex',gap:'8px',overflowX:'auto',marginBottom:'16px'}}>{temporadas.map(s=><button key={s.id} onClick={()=>loadEp(s.season_number)} style={{padding:'8px 14px',borderRadius:'20px',border:temp===s.season_number?'2px solid #FACC15':'1px solid #334155',background:temp===s.season_number?'#FACC15':'#1E293B',color:temp===s.season_number?'#000':'#fff',fontWeight:700,cursor:'pointer'}}>T{s.season_number} • {vistos.filter(a=>a.temporada===s.season_number).length}/{s.episode_count}</button>)}</div>
      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>{eps.map(ep=>{const ok=vistos.some(a=>a.temporada===temp&&a.episodio===ep.episode_number);return(<div key={ep.id} onClick={()=>toggle(temp,ep.episode_number)} style={{display:'flex',gap:'12px',padding:'14px',borderRadius:'12px',cursor:'pointer',background:ok?'#FACC15':'#1E293B',color:ok?'#000':'#fff'}}><div style={{width:'22px',height:'22px',borderRadius:'6px',border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,flexShrink:0}}>{ok?'✓':''}</div><div><b>{ep.episode_number}. {ep.name}</b><div style={{opacity:0.7,fontSize:'13px',marginTop:'4px'}}>{ep.overview||'Sem descricao'}</div></div></div>)})}</div>
    </main>
  )
}
