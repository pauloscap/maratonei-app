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

  useEffect(()=>{ carregar() },[])

  function lerProgresso(){
    const prog={}
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)
        if(k?.startsWith('progress-')){
          const id=k.replace('progress-','')
          const v=JSON.parse(localStorage.getItem(k)||'[]')
          prog[id]=v.length
        }
      }
    }catch(e){}
    setProgressos(prog)
  }

  async function carregar(){
    const { data: { session } } = await supabase.auth.getSession()
    if(!session) return router.push('/login')
    const { data } = await supabase.from('series').select('*').order('created_at',{ascending:false})
    setSeries(data||[])
    lerProgresso()
  }

  async function buscarTMDB(){
    if(!busca) return
    const res=await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(busca)}`)
    const d=await res.json(); setResultados(d.results?.slice(0,10)||[])
  }

  async function adicionar(r){
    const { data: ex } = await supabase.from('series').select('id').eq('tmdb_id',r.id).single()
    if(ex?.id){
      localStorage.setItem(`status-${ex.id}`,'quero_assistir')
      return router.push(`/serie/${ex.id}`)
    }
    const { data, error } = await supabase.from('series').insert({
      tmdb_id:r.id, titulo:r.name, ano:r.first_air_date?.split('-')[0]||'',
      sinopse:r.overview, poster:r.poster_path, nota:r.vote_average
    }).select().single()
    if(error){ alert('Erro ao salvar: '+error.message); return }
    if(data){
      localStorage.setItem(`status-${data.id}`,'quero_assistir')
      localStorage.setItem(`progress-${data.id}`,'[]')
      router.push(`/serie/${data.id}`)
    }
  }

  const assistindo = series.filter(s=> (progressos[s.id]||0) > 0 )
  const quero = series.filter(s=> (progressos[s.id]||0) === 0 )

  function Card({s}){
    const v=progressos[s.id]||0
    return(
      <div onClick={()=>router.push(`/serie/${s.id}`)} style={{minWidth:'138px',width:'138px',cursor:'pointer'}}>
        <div style={{height:'208px',borderRadius:'12px',overflow:'hidden',background:'#1E293B',position:'relative'}}>
          <img src={`https://image.tmdb.org/t/p/w300${s.poster}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          {v>0&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:'5px',background:'#334155'}}><div style={{width:'100%',height:'100%',background:'#FACC15'}}/></div>}
        </div>
        <div style={{color:'#fff',fontSize:'13px',fontWeight:600,marginTop:'6px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.titulo}</div>
        <div style={{color:'#94A3B8',fontSize:'11px'}}>{v>0?`${v} eps • Assistindo`:'Quero assistir'}</div>
      </div>
    )
  }

  return(
    <main style={{background:'#0F172A',minHeight:'100vh',paddingBottom:'90px'}}>
      <div style={{padding:'16px',position:'sticky',top:0,background:'#0F172A',zIndex:10}}>
        <div style={{display:'flex',gap:'8px'}}>
          <input value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarTMDB()} placeholder="Buscar série..." style={{flex:1,background:'#1E293B',border:'1px solid #334155',borderRadius:'10px',padding:'12px',color:'#fff',outline:'none'}}/>
          <button onClick={buscarTMDB} style={{background:'#FACC15',border:'none',borderRadius:'10px',padding:'0 18px',fontWeight:800,cursor:'pointer'}}>Buscar</button>
        </div>
        {resultados.length>0&&
          <div style={{marginTop:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
            {resultados.map(r=>
              <div key={r.id} style={{display:'flex',gap:'10px',background:'#1E293B',padding:'10px',borderRadius:'12px',alignItems:'center'}}>
                <img src={r.poster_path?`https://image.tmdb.org/t/p/w200${r.poster_path}`:''} style={{width:'56px',height:'84px',borderRadius:'8px',objectFit:'cover',background:'#0F172A'}}/>
                <div style={{flex:1}}>
                  <div style={{color:'#fff',fontWeight:700,fontSize:'14px'}}>{r.name}</div>
                  <div style={{color:'#94A3B8',fontSize:'12px',marginTop:'2px'}}>{r.first_air_date?.split('-')[0]} • ⭐ {Number(r.vote_average).toFixed(1)}</div>
                  <div style={{color:'#64748B',fontSize:'11px',marginTop:'4px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{r.overview?.slice(0,90)||'Sem sinopse'}</div>
                </div>
                <button onClick={()=>adicionar(r)} style={{background:'#FACC15',border:'none',borderRadius:'20px',padding:'8px 12px',fontWeight:800,fontSize:'12px',cursor:'pointer',whiteSpace:'nowrap'}}>+ Quero assistir</button>
              </div>
            )}
          </div>
        }
      </div>

      <div style={{padding:'0 16px'}}>
        {assistindo.length>0&&<><h2 style={{color:'#fff',fontSize:'18px',fontWeight:800,margin:'12px 0'}}>▶️ Assistindo</h2><div style={{display:'flex',gap:'12px',overflowX:'auto',paddingBottom:'12px'}}>{assistindo.map(s=><Card key={s.id} s={s}/>)}</div></>}
        <h2 style={{color:'#fff',fontSize:'18px',fontWeight:800,margin:'16px 0 12px'}}>⭐ Quero Assistir</h2>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>{quero.map(s=><Card key={s.id} s={s}/>)}</div>
        {series.length===0&&<div style={{color:'#64748B',textAlign:'center',marginTop:'30px'}}>Nenhuma série ainda.<br/>Busque acima e clique em <b style={{color:'#FACC15'}}>+ Quero assistir</b> pra fincar na home</div>}
      </div>

      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'#1E293B',borderTop:'1px solid #334155',display:'flex',justifyContent:'space-around',padding:'10px 0',zIndex:20}}>
        <button style={{background:'none',border:'none',color:'#FACC15',fontSize:'11px',fontWeight:700,display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>📺</span>Séries</button>
        <button onClick={()=>router.push('/filmes')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>🎬</span>Filmes</button>
        <button onClick={()=>{window.scrollTo(0,0);document.querySelector('input')?.focus()}} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>🔍</span>Busca</button>
        <button onClick={()=>router.push('/perfil')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>👤</span>Perfil</button>
      </nav>
    </main>
  )
}
