"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"
import { getMoldura, MOLDURAS } from "../../lib/moldurasLogic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)
const hojeISO = () => new Date().toISOString().slice(0,10)

export default function PerfilPage(){
  const [user,setUser] = useState(null)
  const [nome,setNome] = useState("Paulo Garcia")
  const [foto,setFoto] = useState("")
  const [stats,setStats] = useState({t:10,m:1,h:194,n:8,xp:1144})
  const [cks,setCks] = useState([])
  const [molduraId,setMolduraId] = useState("padrao")
  const [show,setShow] = useState(false)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(data?.session?.user){
        const u = data.session.user
        setUser(u)
        setNome(u.user_metadata?.full_name || localStorage.getItem("perfil-nome") || "Paulo Garcia")
        setFoto(u.user_metadata?.avatar_url || "")
      } else {
        setNome(localStorage.getItem("perfil-nome") || "Paulo Garcia")
      }
      const c = JSON.parse(localStorage.getItem("checkins")||"[]")
      setCks(c)
      const mid = localStorage.getItem("perfil-moldura") || "padrao"
      setMolduraId(mid)
      // calcula stats rapido
      let m=1, hr=194
      let mc=0
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k?.includes("status-")&&localStorage.getItem(k)=="ja_assisti") mc++ }
      const xp = mc*100 + Math.floor(hr*5) + c.length*15 + 900
      setStats({t:10,m: mc||1,h:hr,n:8,xp})
    })
  },[])

  const doCheck = ()=>{
    const h = hojeISO()
    if(cks.includes(h)) return
    const novo=[...cks,h]
    localStorage.setItem("checkins", JSON.stringify(novo))
    setCks(novo)
  }

  const escolher = (id,nivel)=>{
    if(stats.n < nivel) return alert("Chegue no nivel "+nivel)
    localStorage.setItem("perfil-moldura", id)
    setMolduraId(id); setShow(false)
  }

  const mAtual = getMoldura(molduraId)
  const dias = Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(new Date().getDate()-(29-i)); return d })

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", position:"sticky", top:0, background:"#080B1F", zIndex:10}}>
        <b>Perfil</b>
        <div style={{display:"flex", gap:8}}>
          <button onClick={()=>location.href="/configuracoes"} style={{background:"#ffffff12", color:"#fff", border:"1px solid #ffffff15", borderRadius:999, padding:"6px 12px", fontSize:12, fontWeight:700}}>⚙️</button>
          <button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 14px", fontSize:12, fontWeight:800, display:"flex", alignItems:"center", gap:6}}><span>🎨</span> Molduras</button>
        </div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:52, height:52, borderRadius:999, overflow:"hidden", background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:900, fontSize:20, border:`2px solid ${mAtual.preview}`, boxShadow:`0 0 0 2px #080B1F, 0 0 0 4px ${mAtual.preview}55`}}>
            {foto? <img src={foto} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : nome[0]}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800, display:"flex", alignItems:"center", gap:6}}>{nome} {user && <span style={{fontSize:10, background:"#22c55e22", color:"#22c55e", border:"1px solid #22c55e33", padding:"1px 6px", borderRadius:99}}>Google</span>}</div>
            <div style={{fontSize:12, opacity:.6}}>Nível {stats.n} • {stats.xp} XP • 🔥 1 dias • {mAtual.nome}</div>
            <div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:`${(stats.xp%150)/1.5}%`, height:"100%", background:"#FFD400"}}/></div>
          </div>
          <button onClick={doCheck} style={{width:36, height:36, borderRadius:999, border:0, background: cks.includes(hojeISO())?"#22c55e":"#FFD400", color: cks.includes(hojeISO())?"#fff":"#000", fontWeight:900, fontSize:16, cursor:"pointer"}}>✓</button>
        </div>

        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Loja de Molduras • Nível {stats.n}</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
            {MOLDURAS.map(m=>{
              const ok = stats.n >= m.nivel
              const ativo = m.id === molduraId
              return <div key={m.id} onClick={()=>escolher(m.id,m.nivel)} style={{border: ativo?"1.5px solid #FFD400":"1px solid #ffffff15", background: ativo?"#FFD40014":"#ffffff06", borderRadius:12, padding:10, textAlign:"center", opacity: ok?1:.35, cursor:"pointer"}}>
                <div style={{width:36, height:36, borderRadius:999, margin:"0 auto", display:"grid", placeItems:"center", fontWeight:900, color:"#000", background: foto && ativo? "#fff" : m.preview, overflow:"hidden", border:`2px solid ${m.preview}`}}>{foto && ativo? <img src={foto} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : nome[0]}</div>
                <div style={{fontSize:11, fontWeight:700, marginTop:6}}>{m.nome}</div>
                <div style={{fontSize:10, opacity:.5}}>Nv {m.nivel}</div>
              </div>
            })}
          </div>
        </div>}

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:18, fontWeight:900}}>{stats.t}</div><div style={{fontSize:11, opacity:.4}}>Títulos</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:18, fontWeight:900, color:"#FFD400"}}>{stats.m}</div><div style={{fontSize:11, opacity:.4}}>Maratonadas</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:18, fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11, opacity:.4}}>Tempo</div></div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Calendário • 30 dias</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(10, 1fr)", gap:6}}>
            {dias.map((d,i)=>{ const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const isToday = iso===hojeISO(); return <div key={i} style={{aspectRatio:"1", borderRadius:8, background: ok?"#22c55e": isToday?"#ffffff1a":"#ffffff0f", border: isToday &&!ok?"1px solid #ffffff30":"none", display:"grid", placeItems:"center", fontSize:11, fontWeight:ok?800:400, color: ok?"#fff": isToday?"#fff":"#ffffff88"}}>{d.getDate()}</div>})}
          </div>
        </div>

      </main>
      <BottomNav/>
    </div>
  )
}
