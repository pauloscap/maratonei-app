"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function DetalheSerie({ params }){
  const { id } = params
  const [serie,setSerie]=useState(null)
  const [userId,setUserId]=useState("anon")
  const [status,setStatus]=useState("assistindo")

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const uid = session.user.id
      setUserId(uid)

      // tenta pegar a série que você clicou
      const salvo = localStorage.getItem(`${uid}:serie-atual`)
      if(salvo){
        const s = JSON.parse(salvo)
        if(String(s.id)===String(id)){
          setSerie(s)
          const st = localStorage.getItem(`${uid}:status-${id}`) || s.status
          setStatus(st)
          return
        }
      }
      // fallback se entrou direto pelo link
      setSerie({ id, titulo:`Série #${id}`, img:`https://picsum.photos/seed/${id}/400/600`, ano:"2024" })
      setStatus(localStorage.getItem(`${uid}:status-${id}`) || "assistindo")
    })()
  },[id])

  const mudar = (novo)=>{
    localStorage.setItem(`${userId}:status-${id}`, novo)
    setStatus(novo)
    // anima e volta
    setTimeout(()=> history.back(), 400)
  }

  if(!serie) return <div style={{minHeight:"100vh", background:"#0A0F2A", display:"grid", placeItems:"center", color:"#fff"}}>Carregando...</div>

  return(
    <div style={{minHeight:"100vh", background:"#0A0F2A", color:"#fff"}}>
      <div style={{height:360, background:`url(${serie.img}) center/cover`, position:"relative"}}>
        <button onClick={()=>history.back()} style={{position:"absolute", top:16, left:14, background:"#00000088", backdropFilter:"blur(6px)", border:"1px solid #ffffff22", color:"#fff", width:36, height:36, borderRadius:999}}>‹</button>
        <div style={{position:"absolute", bottom:0, left:0, right:0, height:120, background:"linear-gradient(transparent, #0A0F2A)"}}/>
      </div>
      <div style={{padding:16, maxWidth:560, margin:"-40px auto 0", position:"relative"}}>
        <h1 style={{fontSize:22, fontWeight:900, margin:0}}>{serie.titulo}</h1>
        <div style={{opacity:.5, fontSize:13, marginTop:4}}>{serie.ano} • {status}</div>
        
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:18}}>
          <button onClick={()=>mudar("assistindo")} style={{padding:"12px", borderRadius:12, border: status==="assistindo"?"1px solid #FFD400":"1px solid #ffffff15", background: status==="assistindo"?"#FFD400":"#ffffff10", color: status==="assistindo"?"#000":"#fff", fontWeight:800}}>Assistindo</button>
          <button onClick={()=>mudar("ja_assisti")} style={{padding:"12px", borderRadius:12, border: status==="ja_assisti"?"1px solid #3b82f6":"1px solid #ffffff15", background: status==="ja_assisti"?"#3b82f6":"#ffffff10", color:"#fff", fontWeight:800}}>Já Assisti</button>
          <button onClick={()=>mudar("maratonei")} style={{padding:"12px", borderRadius:12, border: status==="maratonei"?"1px solid #22c55e":"1px solid #ffffff15", background: status==="maratonei"?"#22c55e":"#ffffff10", color:"#fff", fontWeight:800}}>Maratonei</button>
        </div>

        <div style={{marginTop:20, background:"#121A3A", border:"1px solid #ffffff10", borderRadius:14, padding:14, fontSize:12, opacity:.6}}>
          ID individual: {userId.slice(0,8)}... • Status salvo como <b>{userId.slice(0,4)}:status-{id}</b> então outra pessoa que logar não vê seu progresso.
        </div>
      </div>
    </div>
  )
}
