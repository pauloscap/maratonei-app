"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function DetalheFilme({ params }) {
  const id = String(params.id)
  const [uid, setUid] = useState(null)
  const [filme, setFilme] = useState(null)
  const [status, setStatus] = useState("quero_assistir")
  const [salvando, setSalvando] = useState(false)

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
      setFilme(f)
      setStatus(st==="maratonei"||st==="assistido"?"ja_assisti":st==="assistindo"?"quero_assistir":st)

      try {
        const res = await supabase.from("user_filmes").select("status").eq("user_id", userId).eq("filme_id", id).single()
        if (res.data?.status) setStatus(res.data.status)
      } catch(e){}
    }
    load()
  }, [id])

  async function mudar(novoStatus) {
    if (!uid || salvando) return
    setSalvando(true)
    setStatus(novoStatus)

    // 1 - atualiza localStorage
    try {
      localStorage.setItem(uid + ":filme-status-" + id, novoStatus)
      const raw = localStorage.getItem(uid + ":meus-filmes")
      if (raw) {
        let lista = JSON.parse(raw)
        let achou = false
        lista = lista.map(function(x){ if (String(x.id)===id){ achou=true; return {...x, status:novoStatus} } return x })
        if(!achou && filme) lista.unshift({...filme, id:id, status:novoStatus})
        localStorage.setItem(uid + ":meus-filmes", JSON.stringify(lista))
      }
    } catch(e){}

    // 2 - salva no supabase
    try {
      await supabase.from("user_filmes").upsert({
        user_id: uid,
        filme_id: id,
        titulo: filme?.titulo || "Filme",
        img: filme?.img || "",
        status: novoStatus,
        updated_at: new Date().toISOString()
      }, { onConflict:"user_id,filme_id" })
    } catch(e){}

    // 3 - volta pra lista onde o banner vai estar na seção correta
    setTimeout(function(){ window.location.href = "/filmes" }, 300)
  }

  async function abandonar() {
    if (!uid) return
    if (!confirm("Remover "+ (filme?.titulo||"esse filme") +" da sua lista?")) return
    try { await supabase.from("user_filmes").delete().eq("user_id", uid).eq("filme_id", id) } catch(e){}
    try {
      const raw = localStorage.getItem(uid + ":meus-filmes")
      if (raw) {
        let lista = JSON.parse(raw).filter(function(x){ return String(x.id)!==id })
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
      <div style={{ height:360, position:"relative", overflow:"hidden" }}>
        <img src={filme.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(0,0,0,0.2), #080B1F 95%)" }} />
        <button onClick={function(){ window.location.href="/filmes" }} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#000", border:"1px solid #333", color:"#fff", cursor:"pointer", zIndex:2 }}>{"<"}</button>
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"8px 14px", borderRadius:999, background:"#ef4444", color:"#fff", fontWeight:900, fontSize:12, border:0, cursor:"pointer", zIndex:5 }}>Abandonar</button>
        <div style={{ position:"absolute", bottom:0, left:16, right:16, display:"flex", gap:12, alignItems:"flex-end", transform:"translateY(18px)" }}>
          <img src={filme.img} alt="" style={{ width:96, height:144, borderRadius:12, objectFit:"cover", border:"2px solid #222", background:"#000" }} />
          <div style={{ flex:1, paddingBottom:10 }}><h1 style={{ margin:0, fontSize:18, fontWeight:900, lineHeight:1.2 }}>{filme.titulo}</h1><div style={{ fontSize:11, opacity:0.6, marginTop:4 }}>{status==="ja_assisti"?"Já assisti ✓":"Quero assistir"}</div></div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"44px 14px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button disabled={salvando} onClick={function(){ mudar("quero_assistir") }} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="quero_assistir"? "#FFD400" : "#12182F", color: status==="quero_assistir"? "#000" : "#fff", border:"1px solid #222", cursor:"pointer", opacity:salvando?0.6:1 }}>{status==="quero_assistir"?"★ Quero Assistir":"Quero Assistir"}</button>
          <button disabled={salvando} onClick={function(){ mudar("ja_assisti") }} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="ja_assisti"? "#22c55e" : "#12182F", color:"#fff", border:"1px solid #222", cursor:"pointer", opacity:salvando?0.6:1 }}>{status==="ja_assisti"?"✓ Já Assisti":"Já Assisti"}</button>
        </div>

        <div style={{ marginTop:16, background:"#12182F", border:"1px solid #1e274f", borderRadius:16, padding:14 }}>
          <b style={{ fontSize:13 }}>Como funciona</b>
          <div style={{ fontSize:12, opacity:0.6, marginTop:6, lineHeight:1.5 }}>Ao escolher, o banner volta para <b>Filmes</b> e entra automaticamente na seção {status==="ja_assisti"?"Ja Assisti":"Quero Assistir"}.</div>
        </div>

        {salvando && <div style={{ textAlign:"center", marginTop:12, fontSize:12, opacity:0.6 }}>Salvando e voltando...</div>}
      </div>
    </div>
  )
}
