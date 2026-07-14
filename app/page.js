'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY

export default function Home() {
  const router = useRouter()
  const [series, setSeries] = useState([])
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [progressos, setProgressos] = useState({})

  useEffect(() => { carregar() }, [])

  async function carregar(){
    const { data: { session } } = await supabase.auth.getSession()
    if(!session) return router.push('/login')
    const { data } = await supabase.from('series').select('*').order('created_at', {ascending:false})
    setSeries(data || [])
    // lê progressos do localStorage
    const prog = {}
    data?.forEach(s => {
      const salvo = localStorage.getItem(`progress-${s.id}`)
      if(salvo){ prog[s.id] = JSON.parse(salvo).length }
    })
    setProgressos(prog)
  }

  async function buscarTMDB(){
    if(!busca) return
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=pt-BR&query=${busca}`)
    const d = await res.json()
    setResultados(d.results || [])
  }

  async function adicionar(serieTMDB){
    const { data: existe } = await supabase.from('series').select('id').eq('tmdb_id', serieTMDB.id).single()
    if(existe) return router.push(`/serie/${existe.id}`)
    const { data } = await supabase.from('series').insert({
      tmdb_id: serieTMDB.id,
      titulo: serieTMDB.name,
      ano: serieTMDB.first_air_date?.split('-')[0] || '',
      sinopse: serieTMDB.overview,
      poster: serieTMDB.poster_path,
      nota: serieTMDB.vote_average
    }).select().single()
    if(data) router.push(`/serie/${data.id}`)
  }

  const assistindo = series.filter(s => (progressos[s.id] || 0) > 0)
  const queroAssistir = series.filter(s =>!progressos[s.id] || progressos[s.id] === 0)

  function Card({ s }){
    const vistos = progressos[s.id] || 0
    return (
      <div onClick={()=>router.push(`/serie/${s.id}`)} style={{minWidth:'140px', width:'140px', cursor:'pointer'}}>
        <div style={{height:'210px', borderRadius:'12px', overflow:'hidden', background:'#1E293B', position:'relative'}}>
          <img src={`https://image.tmdb.org/t/p/w300${s.poster}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          {vistos > 0 && <div style={{position:'absolute', bottom:0, left:0, right:0, height:'4px', background:'#334155'}}><div style={{width:`${Math.min(vistos*5,100)}%`, height:'100%', background:'#FACC15'}}/></div>}
        </div>
        <div style={{color:'#fff', fontSize:'13px', fontWeight:'600', marginTop:'6px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{s.titulo}</div>
        <div style={{color:'#94A3B8', fontSize:'11px'}}>{vistos > 0? `${vistos} eps vistos` : 'Quero assistir'}</div>
      </div>
    )
  }

  return (
    <main style={{background:'#0F172A', minHeight:'100vh', paddingBottom:'80px'}}>
      {/* HEADER BUSCA */}
      <div style={{padding:'16px', position:'sticky', top:0, background:'#0F172A', zIndex:10}}>
        <div style={{display:'flex', gap:'8px'}}>
          <input value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarTMDB()} placeholder="Buscar série..." style={{flex:1, background:'#1E293B', border:'1px solid #334155', borderRadius:'10px', padding:'12px', color:'#fff', outline:'none'}} />
          <button onClick={buscarTMDB} style={{background:'#FACC15', border:'none', borderRadius:'10px', padding:'0 16px', fontWeight:'800', cursor:'pointer'}}>Buscar</button>
        </div>
        {resultados.length > 0 && (
          <div style={{display:'flex', gap:'10px', overflowX:'auto', marginTop:'12px', paddingBottom:'8px'}}>
            {resultados.map(r=>(
              <div key={r.id} onClick={()=>adicionar(r)} style={{minWidth:'100px', cursor:'pointer', textAlign:'center'}}>
                <img src={r.poster_path?`https://image.tmdb.org/t/p/w200${r.poster_path}`:''} style={{width:'100px', height:'150px', borderRadius:'8px', objectFit:'cover', background:'#1E293B'}}/>
                <div style={{color:'#fff', fontSize:'11px', marginTop:'4px'}}>{r.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{padding:'0 16px'}}>
        {assistindo.length > 0 && (
          <>
            <h2 style={{color:'#fff', fontSize:'18px', fontWeight:'800', margin:'16px 0 12px'}}>▶️ Assistindo</h2>
            <div style={{display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'12px'}}>{assistindo.map(s=><Card key={s.id} s={s}/>)}</div>
          </>
        )}
        <h2 style={{color:'#fff', fontSize:'18px', fontWeight:'800', margin:'16px 0 12px'}}>⭐ Quero Assistir</h2>
        <div style={{display:'flex', gap:'12px', overflowX:'auto', flexWrap:'wrap'}}>{queroAssistir.map(s=><Card key={s.id} s={s}/>)}</div>
        {series.length===0 && <div style={{color:'#64748B', textAlign:'center', marginTop:'40px'}}>Busque e adicione sua primeira série acima 👆</div>}
      </div>

      {/* NAVBAR RODAPÉ */}
      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#1E293B', borderTop:'1px solid #334155', display:'flex', justifyContent:'space-around', padding:'10px 0'}}>
        <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#FACC15',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',fontSize:'11px',fontWeight:'700'}}><span style={{fontSize:'20px'}}>📺</span>Séries</button>
        <button onClick={()=>router.push('/filmes')} style={{background:'none',border:'none',color:'#64748B',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',fontSize:'11px'}}><span style={{fontSize:'20px'}}>🎬</span>Filmes</button>
        <button onClick={()=>document.querySelector('input').focus()} style={{background:'none',border:'none',color:'#64748B',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',fontSize:'11px'}}><span style={{fontSize:'20px'}}>🔍</span>Busca</button>
        <button onClick={()=>router.push('/perfil')} style={{background:'none',border:'none',color:'#64748B',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',fontSize:'11px'}}><span style={{fontSize:'20px'}}>👤</span>Perfil</button>
      </div>
    </main>
  )
}
