"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const SERIES_MOCK = [
  { id: 1, titulo: "Breaking Bad", ano: "2008", img: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", status: "assistindo", progresso: 60 },
  { id: 2, titulo: "The Witcher", ano: "2019", img: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", status: "quero", progresso: 0 },
  { id: 3, titulo: "Stranger Things", ano: "2016", img: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", status: "maratonei", progresso: 100 },
  { id: 4, titulo: "The Last of Us", ano: "2023", img: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2FyJ78ED.jpg", status: "assistindo", progresso: 30 },
]

export default function HomeSeries(){
  const [busca,setBusca]=useState("")
  const [aba,setAba]=useState("todos") // todos | assistindo | quero | maratonei
  const [userId,setUserId]=useState("anon")
  const [lista,setLista]=useState(SERIES_MOCK)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(!data.session){ location.href="/login"; return }
      const uid = data.session.user.id
      setUserId(uid)
      // carrega status salvos DESSE usuário
      const nova = SERIES_MOCK.map(s=>{
        const st = localStorage.getItem(`${uid}:status-${s.id}`)
        return st ? {...s, status: st} : s
      })
      setLista(nova)
    })
  },[])

  const mudarStatus = (id, novoStatus)=>{
    const key = `${userId}:status-${id}`
    localStorage.setItem(key, novoStatus)
    setLista(prev=>prev.map(s=>s.id===id?{...s,status:novoStatus}:s))
  }

  const filtradas = useMemo(()=>{
    return lista.filter(s=>{
      const matchBusca = s.titulo.toLowerCase().includes(busca.toLowerCase())
      const matchAba = aba==="todos" ? true : s.status===aba
      return matchBusca && matchAba
    })
  },[lista,busca,aba])

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{padding:"16px 14px 8px", position:"sticky", top:0, background:"#080B1F", zIndex:10, borderBottom:"1px solid #ffffff0f"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
          <h1 style={{fontSize:22, fontWeight:900, color:"#FFD400", margin:0}}>Maratonei</h1>
          <div style={{width:32,height:32,borderRadius:999,background:"#ffffff12",display:"grid",placeItems:"center"}}>🔍</div>
        </div>
        {/* BARRA DE PESQUISA */}
        <div style={{position:"relative"}}>
          <span style={{position:"absolute", left:12, top:11, opacity:.4}}>🔍</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar série..." style={{width:"100%", background:"#12182F", border:"1px solid #ffffff12", borderRadius:12, padding:"11px 12px 11px 36px", color:"#fff", outline:"none", fontSize:14}}/>
        </div>
        {/* ABAS: ASSISTINDO | QUERO ASSISTIR | MARATONEI */}
        <div style={{display:"flex", gap:8, marginTop:12, overflowX:"auto"}}>
          {[
            {id:"todos", label:"Todos"},
            {id:"assistindo", label:"Assistindo"},
            {id:"quero", label:"Quero Assistir"},
            {id:"maratonei", label:"Maratonei"},
          ].map(t=>{
            const ativo = aba===t.id
            return <button key={t.id} onClick={()=>setAba(t.id)} style={{whiteSpace:"nowrap", padding:"8px 14px", borderRadius:999, fontSize:12, fontWeight:800, border: ativo?"1px solid #FFD400":"1px solid #ffffff15", background: ativo?"#FFD400":"#ffffff0a", color: ativo?"#000":"#fff", cursor:"pointer"}}>{t.label}</button>
          })}
        </div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        {filtradas.map(s=>(
          <div key={s.id} style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, overflow:"hidden"}}>
            <div style={{height:180, background:`url(${s.img}) center/cover`, position:"relative"}}>
              <div style={{position:"absolute", top:8, left:8, background:s.status==="maratonei"?"#22c55e":s.status==="assistindo"?"#FFD400":"#ffffff22", color:s.status==="assistindo"?"#000":"#fff", fontSize:10, fontWeight:800, padding:"3px 7px", borderRadius:99}}>{s.status}</div>
              {s.progresso>0 && s.progresso<100 && <div style={{position:"absolute", bottom:0, left:0, right:0, height:4, background:"#ffffff22"}}><div style={{width:s.progresso+"%", height:"100%", background:"#FFD400"}}/></div>}
            </div>
            <div style={{padding:10}}>
              <div style={{fontWeight:800, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{s.titulo}</div>
              <div style={{fontSize:11, opacity:.45}}>{s.ano}</div>
              <div style={{display:"flex", gap:6, marginTop:8}}>
                <button onClick={()=>mudarStatus(s.id,"assistindo")} style={{flex:1, fontSize:10, padding:"6px", borderRadius:8, border:"1px solid #ffffff15", background:s.status==="assistindo"?"#FFD40022":"#ffffff08", color:s.status==="assistindo"?"#FFD400":"#fff"}}>Assistindo</button>
                <button onClick={()=>mudarStatus(s.id,"maratonei")} style={{flex:1, fontSize:10, padding:"6px", borderRadius:8, border:0, background:s.status==="maratonei"?"#22c55e":"#fff", color:s.status==="maratonei"?"#fff":"#000", fontWeight:800}}>Maratonei</button>
              </div>
            </div>
          </div>
        ))}
      </main>
      <BottomNav/>
    </div>
  )
}
