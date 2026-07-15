"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home(){
  const [userId,setUserId]=useState("anon")
  const [busca,setBusca]=useState("")
  const [series,setSeries]=useState([])

  // MOCK igual ao seu print original
  const baseSeries = [
    { id:101, titulo:"Abbott Elementary", img:"https://image.tmdb.org/t/p/w500/kE3W7Xg6oE4FyQhJ6lQ9A1.jpg", status:"assistindo" },
    { id:102, titulo:"X-Men '97", img:"https://image.tmdb.org/t/p/w500/8A7K8E.jpg", status:"assistindo" },
    { id:103, titulo:"Off Campus: Amore...", img:"https://image.tmdb.org/t/p/w500/sample3.jpg", status:"assistindo" },
    { id:104, titulo:"The Walking Dead", img:"https://image.tmdb.org/t/p/w500/sf4aFGS8gr1o9pM8vR4V.jpg", status:"assistindo" },
    { id:201, titulo:"Elle: Legalmente Loira", img:"https://image.tmdb.org/t/p/w500/q3dT9c.jpg", status:"ja_assisti" },
    { id:301, titulo:"Stranger Things", img:"https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", status:"maratonei" },
    { id:302, titulo:"The Last of Us", img:"https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", status:"maratonei" },
  ]

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const uid = session.user.id
      setUserId(uid)
      
      // Carrega o que VOCÊ salvou, isolado por UID
      // Se outra pessoa logar, o UID dela é diferente e não acha suas chaves
      const carregadas = baseSeries.map(s=>{
        const salvo = localStorage.getItem(`${uid}:status-${s.id}`)
        return salvo ? {...s, status:salvo} : s
      })

      // Se já tem coisas salvas no formato antigo (sem UID), migra pro novo
      const migradas = carregadas.map(s=>{
        if(!localStorage.getItem(`${uid}:status-${s.id}`)){
          const antigo = localStorage.getItem(`status-${s.id}`)
          if(antigo) localStorage.setItem(`${uid}:status-${s.id}`, antigo)
        }
        return s
      })

      setSeries(migradas)
    })()
  },[])

  const filtradas = useMemo(()=>{
    if(!busca) return series
    return series.filter(s=> s.titulo.toLowerCase().includes(busca.toLowerCase()))
  },[series,busca])

  const assistindo = filtradas.filter(s=>s.status==="assistindo")
  const jaAssisti = filtradas.filter(s=>s.status==="ja_assisti")
  const maratonei = filtradas.filter(s=>s.status==="maratonei")

  const Card = ({s})=>(
    <div style={{width:124}}>
      <div style={{width:124, height:184, borderRadius:12, overflow:"hidden", background:"#12182F", border:"1px solid #FFD400", position:"relative"}}>
        <img src={s.img} alt={s.titulo} style={{width:"100%", height:"100%", objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
        <div style={{position:"absolute", top:6, left:6, background:"#FFD400", color:"#000", fontSize:8, fontWeight:900, padding:"2px 6px", borderRadius:6, textTransform:"uppercase"}}>{s.status}</div>
        {s.status!=="assistindo" && <div style={{position:"absolute", bottom:0, left:0, right:0, height:4, background:s.status==="maratonei"?"#22c55e":"#3b82f6"}}/>}
        {s.status==="assistindo" && <div style={{position:"absolute", bottom:0, left:0, right:0, height:4, background:"#FFD400"}}/>}
      </div>
      <div style={{fontSize:12, fontWeight:700, marginTop:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"#fff"}}>{s.titulo}</div>
    </div>
  )

  const Secao = ({titulo, cor, qtd, children})=>(
    <div style={{marginTop:22}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
        <div style={{width:3, height:14, background:cor, borderRadius:99}}/>
        <b style={{fontSize:14}}>{titulo}</b>
        <span style={{fontSize:11, opacity:.4}}>• {qtd}</span>
      </div>
      <div style={{display:"flex", gap:12, overflowX:"auto", paddingBottom:6}}>{children}</div>
    </div>
  )

  return(
    <div style={{minHeight:"100vh", background:"#0A0F2A", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", borderBottom:"1px solid #ffffff0f", position:"sticky", top:0, background:"#0A0F2A", zIndex:10}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}><div style={{width:28,height:28,borderRadius:8,background:"#FFD400",color:"#000",display:"grid",placeItems:"center",fontWeight:900}}>M</div><b style={{letterSpacing:.2}}>maratonei</b></div>
        <div onClick={()=>location.href="/perfil"} style={{width:30,height:30,borderRadius:999,background:"#FFD400",color:"#000",display:"grid",placeItems:"center",fontWeight:900,fontSize:12,cursor:"pointer"}}>P</div>
      </header>

      <div style={{maxWidth:900, margin:"0 auto", padding:"14px"}}>
        <div style={{background:"#121A3A", border:"1px solid #ffffff12", borderRadius:999, display:"flex", alignItems:"center", padding:"0 14px", height:42, maxWidth:420, margin:"0 auto"}}>
          <span style={{opacity:.4, marginRight:8}}>🔍</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar série para adicionar..." style={{flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13}}/>
        </div>

        <Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length}>
          {assistindo.map(s=><Card key={s.id} s={s}/>)}
        </Secao>

        <Secao titulo="Já Assisti" cor="#3B82F680" qtd={jaAssisti.length}>
          {jaAssisti.map(s=><Card key={s.id} s={s}/>)}
        </Secao>

        <Secao titulo="Já Maratonei" cor="#22c55e" qtd={maratonei.length}>
          {maratonei.map(s=><Card key={s.id} s={{...s, titulo:s.titulo}}/>)}
        </Secao>
      </div>
      <BottomNav/>
    </div>
  )
}
