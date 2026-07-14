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
  const [status,setStatus]=useState('quero_assistir')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    const p=localStorage.getItem(`progress-${id}`); if(p) setVistos(JSON.parse(p))
    const s=localStorage.getItem(`status-${id}`); if(s) setStatus(s)
    init()
  },[])

  useEffect(()=>{ if(!loading) localStorage.setItem(`progress-${id}`,JSON.stringify(vistos)) },[vistos])
  useEffect(()=>{ if(!loading) localStorage.setItem(`status-${id}`,status) },[status])

  async function init(){
    const { data:{session} }=await supabase.auth.getSession(); if(!session) return router.push('/login')
    const { data }=await supabase.from('series').select('*').eq('id',id).single(); if(!data) return router.push('/'); setSerie(data)
    if(data.tmdb_id){ const r=await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${TMDB_KEY}&language=pt-BR`); const j=await r.json(); setTmdb(j); const prim=j.seasons?.find(x=>x.season_number>0)||j.seasons?.[0]; if(prim) loadEp(prim.season_number,data.tmdb_id) }
    setLoading(false)
  }

  async function loadEp(n,tid){ const t=tid||serie?.tmdb_id; if(!t) return; setTemp(n); const r=await fetch(`https://api.themoviedb.org/3/tv/${t}/season/${n}?api_key=${TMDB_KEY}&language=pt-BR`); const j=await r.json(); setEps(j.episodes||[]) }

  function toggle(t,e){
    const ex=vistos.find(a=>a.temporada===t&&a.episodio===e)
    if(ex){ setVistos(vistos.filter(a=>!(a.temporada===t&&a.episodio===e))) }
    else { const novo=[...vistos,{temporada:t,episodio:e}]; setVistos(novo); if(novo.length===1) setStatus('assistindo') }
  }

  function trocarStatus(){
    const novo = status==='assistindo'? 'quero_assistir' : 'assistindo'
    setStatus(novo)
  }

  if(loading||!serie) return <main style={{background:'#0F172A',minHeight:'100vh',padding:'20px',color:'#fff'}}>Carregando...</main>
  const temporadas=tmdb?.seasons?.filter(s=>s.season_number>0)||[]; const total=tmdb?.number_of_episodes||0; const pct=total>0?Math.round(vistos.length/total*100):0

  return(
    <main style={{maxWidth:'800px',margin:'0 auto',padding:'0 16px 40px',background:'#0F172A',minHeight:'100vh'}}>
      <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#FACC15',margin:'16px 0',cursor:'pointer'}}>← Voltar</button>
      <div style={{height:'260px',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}><img src={`https://image.tmdb.org/t/p/w780${serie.poster}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
      <h1 style={{color:'#FACC15',fontSize:'26px',fontWeight:900,margin:'0 0 10px'}}>{serie.titulo}</h1>

      {/* BOTÃO QUE LEVA PRA HOME */}
      <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'14px'}}>
        <button onClick={trocarStatus} style={{padding:'10px 18px',borderRadius:'24px',border:'none',cursor:'pointer',fontWeight:900,fontSize:'13px',background:status==='assistindo'?'#FACC15':'#334155',color:
