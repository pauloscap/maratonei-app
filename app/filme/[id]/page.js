"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function DetalheFilme({ params }) {
  const id = String(params.id)
  const [uid, setUid] = useState(null)
  const [filme, setFilme] = useState(null)
  const [status, setStatus] = useState("quero_assistir")

  useEffect(() => {
    async function load() {
      const s = await supabase.auth.getSession()
      if (!s.data.session) { window.location.href = "/login"; return }
      const userId = s.data.session.user.id
      setUid(userId)

      let f = null
      try { const raw = localStorage.getItem(userId + ":filme-atual"); if (raw) f = JSON.parse(raw) } catch(e){}
      if (!f || String(f.id)!==id) {
        try { const all = JSON.parse(localStorage.getItem(userId + ":meus-filmes") || "[]"); f = all.find(function(x){ return String(x.id)===id }) } catch(e){}
      }
      if (!f) f = { id: id, titulo: "Filme " + id, img: "https://picsum.photos/seed/" + id + "/600/900" }

      const st = localStorage.getItem(userId + ":filme-status-" + id) || f.status || "quero_assistir"
      let finalStatus = st
      if (finalStatus==="maratonei" || finalStatus==="assistido") finalStatus="ja_assisti"
      if (finalStatus==="assistindo") finalStatus="quero_assistir"

      setFilme(f)
      setStatus(finalStatus)

      try {
        const res = await supabase.from("user_filmes").select("*").eq("user_id", userId).eq("filme_id", id).single()
        if (res.data && res.data.status) {
          let sDb = res.data.status
          if (sDb==="maratonei") sDb="ja_assisti"
          if (sDb==="assistindo") sDb="quero_assistir"
          setStatus(sDb)
        }
      } catch(e){}
    }
    load()
  }, [id])

  async function mudar(novoStatus) {
    if (!uid) return
    setStatus(novoStatus)
    localStorage.setItem(uid + ":filme-status-" + id, novoStatus)
    // atualiza lista geral
    try {
      const raw = localStorage.getItem(uid + ":meus-filmes")
      if (raw) {
        let lista = JSON.parse(raw)
        lista = lista.map(function(x){ if (String(x.id)===id) return {...x, status:novoStatus}; return x })
        localStorage.setItem(uid + ":meus-filmes", JSON.stringify(lista))
      }
    } catch(e){}
    try { await supabase.from("user_filmes").upsert({ user_id: uid, filme_id: id, titulo: filme.titulo, img: filme.img, status: novoStatus, updated_at: new Date().toISOString() }, { onConflict:"user_id,filme_id" }) } catch(e){}
  }

  async function abandonar() {
    if (!uid) { window.location.href="/filmes"; return }
    if (!confirm("Remover " + (filme? filme.titulo : "esse filme") + " da sua lista?")) return

    try { await supabase.from("user_filmes").delete().eq("user_id", uid).eq("filme_id", id) } catch(e){ console.log("erro supabase", e) }

    try {
      const raw = localStorage.getItem(uid + ":meus-filmes")
      if (raw) {
        let lista = JSON.parse(raw)
        lista = lista.filter(function(x){ return String(x.id)!==id })
        localStorage.setItem(uid + ":meus-filmes", JSON.stringify(lista))
      }
      localStorage.removeItem(uid + ":filme-status-" + id)
      localStorage.removeItem(uid + ":filme-atual")
    } catch(e){}

    window.location.href = "/filmes"
  }

  if (!filme) return null

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff" }}>
      <div style={{ height:320, position:"relative", overflow:"hidden" }}>
        <img src={filme.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(180deg, rgba(0,0,0,0.2), #080B1F 95%)" }} />
        <button onClick={function(){ window.history.back() }} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#000", border:"1px solid #333", color:"#fff", cursor:"pointer" }}>{"<"}</button>
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"8px 14px", borderRadius:999, background:"#ef4444", color:"#fff", fontWeight:900, fontSize:12, border:0, cursor:"pointer", zIndex:5 }}>Abandonar</button>
        <div style={{ position:"absolute", bottom:0, left:16, right:16, display:"flex", gap:12, alignItems:"flex-end", transform:"translateY(18px)" }}>
          <img src={filme.img} alt="" style={{ width:90, height:135, borderRadius:12, objectFit:"cover", border:"2px solid #222" }} />
          <div style={{ flex:1, paddingBottom:8 }}><h1 style={{ margin:0, fontSize:18, fontWeight:900 }}>{filme.titulo}</h1><div style={{ fontSize:11, opacity:0.6, marginTop:4 }}>Filme • {status==="ja_assisti"? "Ja assisti" : "Quero assistir"}</div></div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"42px 14px 14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <button onClick={function(){ mudar("qu
