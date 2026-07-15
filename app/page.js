"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

// helper para deixar tudo individual por usuário
const uidKey = (uid, k) => `${uid}:${k}`
const hoje = ()=> new Date().toISOString().slice(0,10)

export default function Home(){
  const [userId,setUserId]=useState("anon")
  const [busca,setBusca]=useState("")
  const [lista,setLista]=useState([
    {id:1, titulo:"Breaking Bad", ano:"2008", img:"https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"},
    {id:2, titulo:"Game of Thrones", ano:"2011", img:"https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg"},
    {id:3, titulo:"Stranger Things", ano:"2016", img:"https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"},
    {id:4, titulo:"The Last of Us", ano:"2023", img:"https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg"},
    {id:5, titulo:"Dark", ano:"2017", img:"https://image.tmdb.org/t/p/w500/7yQvnZ9G1R9L6aV1nH4R6Z5X.jpg"},
    {id:6, titulo:"The Witcher", ano:"2019", img:"https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg"},
  ])
  const [statusMap,setStatusMap]=useState({})

  useEffect(()=>{
    ;(async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const uid = session.user.id
      setUserId(uid)
      // carrega status individual desse usuário
      const map={}
      lista.forEach(s=>{
        const v = localStorage.getItem(uidKey(uid, `status-${s.id}`))
        if(v) map[s.id]=v
      })
      setStatusMap(map)
    })()
  },[])

  const setStatus = (id, valor)=>{
    localStorage.setItem(uidKey(userId, `status-${id}`), valor)
    setStatusMap({...statusMap, [id]:valor})
    // ganha XP individual
    const xpKey = uidKey(userId, "xp-total")
    const atual = parseInt(localStorage.getItem(xpKey)||"0")
    localStorage.setItem(xpKey, String(atual+50))
  }

  const filtradas = lista.filter(s=> s.titulo.toLowerCase().includes(busca.toLowerCase()))

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{position:"sticky", top:0, zIndex:10, background:"#080B1F", borderBottom:"1px solid #ffffff0f", padding:"12px 14px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", maxWidth:1100, margin:"0 auto"}}>
          <div style={{fontWeight:900, fontSize:18, color:"#FFD400"}}>Maratonei</div>
          <div style={{display:"flex", gap:8}}>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar série..." style={{background:"#12182F", border:"1px solid #ffffff15", color:"#fff", borderRadius:999, padding:"8px 14px", outline:"none", width:160}}/>
            <button onClick={()=>location.href="/perfil"} style={{width:36, height:36, borderRadius:999, border:"1px solid #ffffff15", background:"#ffffff10", color:"#fff"}}>👤</button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:1100, margin:"0 auto", padding:"16px 14px"}}>
        <div style={{display:"flex", gap:8, marginBottom:14}}>
          <div style={{background:"#FFD400", color:"#000", padding:"6px 14px", borderRadius:999, fontWeight:800, fontSize:13}}>Séries</div>
          <div onClick={()=>location.href="/filmes"} style={{background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", padding:"6px 14px", borderRadius:999, fontWeight:600, fontSize:13, cursor:"pointer"}}>Filmes</div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px,1fr))", gap:12}}>
          {filtradas.map(s=>{
            const st = statusMap[s.id]
            return(
              <div key={s.id} style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, overflow:"hidden"}}>
                <div style={{aspectRatio:"2/3", background:"#0e1330", overflow:"hidden", position:"relative"}}>
                  <img src={s.img} alt={s.titulo} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                  {st==="ja_assisti" && <div style={{position:"absolute", top:8, right:8, background:"#22c55e", color:"#fff", fontSize:10, fontWeight:800, padding:"3px 7px", borderRadius:99}}>✓ Visto</div>}
                  {st==="quero_ver" && <div style={{position:"absolute", top:8, right:8, background:"#FFD400", color:"#000", fontSize:10, fontWeight:800, padding:"3px 7px", borderRadius:99}}>Quero ver</div>}
                </div>
                <div style={{padding:10}}>
                  <div style={{fontWeight:800, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{s.titulo}</div>
                  <div style={{fontSize:11, opacity:.45, marginTop:2}}>{s.ano}</div>
                  <div style={{display:"flex", gap:6, marginTop:10}}>
                    <button onClick={()=>setStatus(s.id,"ja_assisti")} style={{flex:1, background: st==="ja_assisti"?"#22c55e":"#ffffff12", color: st==="ja_assisti"?"#fff":"#fff", border:"1px solid #ffffff15", borderRadius:999, padding:"6px 0", fontSize:11, fontWeight:700, cursor:"pointer"}}>Já vi</button>
                    <button onClick={()=>setStatus(s.id,"quero_ver")} style={{flex:1, background: st==="quero_ver"?"#FFD400":"#ffffff08", color: st==="quero_ver"?"#000":"#ffffffaa", border:"1px solid #ffffff10", borderRadius:999, padding:"6px 0", fontSize:11, fontWeight:700, cursor:"pointer"}}>Quero</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{marginTop:18, background:"#12182F", border:"1px dashed #ffffff18", borderRadius:14, padding:12, fontSize:12, opacity:.6, textAlign:"center"}}>
          Logado como ID individual: {userId.slice(0,8)}... • Seu histórico agora é só seu. Quem abrir o link vai ver o histórico dela.
        </div>
      </main>
      <BottomNav/>
    </div>
  )
}
