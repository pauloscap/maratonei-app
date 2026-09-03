"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w500"

export default function DetalheFilme() {
  const params = useParams()
  const id = String(params.id)
  const [uid, setUid] = useState(null)
  const [filme, setFilme] = useState(null)
  const [status, setStatus] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [detalhes, setDetalhes] = useState({ sinopse:"", nota:0, votos:0, providers:[], lancamento:"" })
  const [showRating, setShowRating] = useState(false)
  const [minhaNota, setMinhaNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)

  useEffect(() => {
    async function load() {
      const s = await supabase.auth.getSession()
      if (!s.data.session) { window.location.href = "/login"; return }
      const userId = s.data.session.user.id
      setUid(userId)

      let f = null
      try { const raw = localStorage.getItem(userId + ":filme-atual"); if (raw) f = JSON.parse(raw) } catch(e){}
      if (!f || String(f.id)!==id) {
        try { const all = JSON.parse(localStorage.getItem(userId + ":meus-filmes") || "[]"); f = all.find(x=> String(x.id)===id) } catch(e){}
      }
      if (!f) f = { id: id, titulo: "Filme " + id, img: "https://picsum.photos/seed/" + id + "/600/900" }
      setFilme(f)

      try {
        const res = await supabase.from("user_filmes").select("*").eq("user_id", userId).eq("filme_id", id).single()
        if (res.data?.status) setStatus(res.data.status)
        if(res.data?.nota) setMinhaNota(res.data.nota)
      } catch(e){
        const stLocal = localStorage.getItem(userId + ":filme-status-" + id) || ""
        if(stLocal) setStatus(stLocal)
      }

      try{
        const [det, prov] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${TMDB_KEY}`).then(r=>r.json())
        ])
        if(det && det.title){
          f = {...f, titulo: det.title, img: det.poster_path? `${TMDB_IMG}${det.poster_path}` : f.img, banner: det.backdrop_path? `${TMDB_IMG}${det.backdrop_path}` : f.img, data_lancamento: det.release_date }
          setFilme(f)
          localStorage.setItem(userId + ":filme-atual", JSON.stringify(f))
          const br = prov.results?.BR
          let providers = []
          if(br){
            const all = [...(br.flatrate||[]),...(br.rent||[]),...(br.buy||[])]
            providers = [...new Map(all.map(p=>[p.provider_id,p])).values()].slice(0,8)
          }
          setDetalhes({ sinopse: det.overview || "", nota: det.vote_average || 0, votos: det.vote_count || 0, providers, lancamento: det.release_date || "" })
        }
      }catch(e){}
    }
    load()
  }, [id])

  function salvarLocal(uidLocal, novoStatus, agora){
    try{
      localStorage.setItem(uidLocal + ":filme-status-" + id, novoStatus)
      let lista = []
      try{ lista = JSON.parse(localStorage.getItem(uidLocal + ":meus-filmes") || "[]") }catch{ lista=[] }
      let achou = false
      lista = lista.map(x=>{
        if(String(x.id)===id){ achou=true; return {...x, status:novoStatus, updated_at: agora, data_assistido: novoStatus==="ja_assisti"? agora : x.data_assistido} }
        return x
      })
      if(!achou){
        lista.unshift({ id, titulo: filme?.titulo||"Filme", img: filme?.img||"", status: novoStatus, data_lancamento: filme?.data_lancamento || detalhes.lancamento, data_assistido: novoStatus==="ja_assisti"? agora : null, updated_at: agora })
      }
      localStorage.setItem(uidLocal + ":meus-filmes", JSON.stringify(lista))
    }catch{}
  }

  async function mudar(novoStatus) {
    if (!uid || salvando) return
    setSalvando(true)
    const agora = new Date().toISOString()
    const dataLanc = filme?.data_lancamento || detalhes.lancamento || null

    setStatus(novoStatus)
    salvarLocal(uid, novoStatus, agora)

    try{
      const payload = {
        user_id: uid,
        filme_id: String(id),
        titulo: filme?.titulo || "Filme",
        img: filme?.img || "",
        status: novoStatus,
        updated_at: agora,
        data_lancamento: dataLanc,
       ...(novoStatus==="ja_assisti"? {data_assistido: agora} : {})
      }
      const { error } = await supabase.from("user_filmes").upsert(payload, { onConflict:"user_id,filme_id" })
      if(error) throw error
    }catch(e){
      console.error(e)
      alert("Erro ao salvar: "+e.message+"\nRoda o SQL que te mandei no Supabase!")
      setSalvando(false)
      return
    }

    if(novoStatus==="ja_assisti"){
      setSalvando(false)
      setShowRating(true)
      return
    }
    setTimeout(()=>{ window.location.href="/filmes" }, 400)
  }

  async function salvarNota(nota){
    setMinhaNota(nota)
    setShowRating(false)
    const agora = new Date().toISOString()
    salvarLocal(uid, "ja_assisti", agora)
    try{
      await supabase.from("user_filmes").upsert({
        user_id: uid,
        filme_id: String(id),
        titulo: filme?.titulo || "Filme",
        img: filme?.img || "",
        status: "ja_assisti",
        nota: nota,
        avaliacao: nota,
        data_lancamento: filme?.data_lancamento || detalhes.lancamento || null,
        data_assistido: agora,
        updated_at: agora
      }, { onConflict:"user_id,filme_id" })
    }catch{}
    setTimeout(()=>{ window.location.href="/filmes" }, 500)
  }

  async function abandonar() {
    if (!uid) return
    if (!confirm("Remover "+ (filme?.titulo||"esse filme") )) return
    try { await supabase.from("user_filmes").delete().eq("user_id", uid).eq("filme_id", id) } catch{}
    try {
      let lista = JSON.parse(localStorage.getItem(uid + ":meus-filmes") || "[]").filter(x=> String(x.id)!==id)
      localStorage.setItem(uid + ":meus-filmes", JSON.stringify(lista))
      localStorage.removeItem(uid + ":filme-status-" + id)
      localStorage.removeItem(uid + ":filme-atual")
    } catch{}
    window.location.href = "/filmes"
  }

  if (!filme) return null

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff" }}>
      <div style={{ height:360, position:"relative", overflow:"hidden" }}>
        <img src={filme.banner || filme.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(0,0,0,0.2), #080B1F 95%)" }} />
        <button onClick={()=> window.location.href="/filmes"} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#000", border:"1px solid #333", color:"#fff", cursor:"pointer", zIndex:2 }}>{"<"}</button>
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"8px 14px", borderRadius:999, background:"#ef4444", color:"#fff", fontWeight:900, fontSize:12, border:0, cursor:"pointer", zIndex:5 }}>Abandonar</button>
        <div style={{ position:"absolute", bottom:0, left:16, right:16, display:"flex", gap:12, alignItems:"flex-end", transform:"translateY(18px)" }}>
          <img src={filme.img} alt="" style={{ width:96, height:144, borderRadius:12, objectFit:"cover", border:"2px solid #222" }} />
          <div style={{ flex:1, paddingBottom:10 }}>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900 }}>{filme.titulo}</h1>
            <div style={{ fontSize:11, opacity:0.6, marginTop:4, display:"flex", gap:8 }}>
              <span>{detalhes.lancamento? detalhes.lancamento.slice(0,4) : ""}</span>
              {detalhes.nota>0 && <span style={{ color:"#FFD400" }}>★ {detalhes.nota.toFixed(1)}</span>}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"44px 14px 20px" }}>
        {(detalhes.sinopse || detalhes.providers.length>0) && (
          <div style={{ background:"#12182F", border:"1px solid #1e274f", borderRadius:16, padding:14, marginBottom:14 }}>
            {detalhes.sinopse && <div style={{ fontSize:12, lineHeight:1.5, opacity:0.85 }}>{detalhes.sinopse}</div>}
            {detalhes.providers.length>0 && <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>{detalhes.providers.map(p=><div key={p.provider_id} style={{ width:36, height:36, borderRadius:8, overflow:"hidden" }}><img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt="" style={{width:"100%",height:"100%"}}/></div>)}</div>}
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button disabled={salvando} onClick={()=> mudar("quero_assistir")} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="quero_assistir"? "#FFD400" : "#12182F", color: status==="quero_assistir"? "#000" : "#fff", border:"1px solid #222", cursor:"pointer" }}>{status==="quero_assistir"?"★ Quero Assistir":"Quero Assistir"}</button>
          <button disabled={salvando} onClick={()=> mudar("ja_assisti")} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="ja_assisti"? "#22c55e" : "#12182F", color:"#fff", border:"1px solid #222", cursor:"pointer" }}>{status==="ja_assisti"?"✓ Já Assisti":"Já Assisti"}</button>
        </div>
        {salvando && <div style={{ textAlign:"center", marginTop:12, fontSize:12, opacity:0.6 }}>Salvando...</div>}
      </div>
      {showRating && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"grid", placeItems:"center", zIndex:10000, padding:16 }}>
          <div style={{ background:"#12182F", borderRadius:20, padding:20, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:900, marginBottom:14 }}>Avalie {filme.titulo}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:16 }}>{[1,2,3,4,5].map(n=><button key={n} onMouseEnter={()=>setHoverNota(n)} onMouseLeave={()=>setHoverNota(0)} onClick={()=>salvarNota(n)} style={{ fontSize:36, background:"transparent", border:0, cursor:"pointer", color: (hoverNota||minhaNota)>=n? "#FFD400" : "rgba(255,255,255,0.2)" }}>★</button>)}</div>
            <div style={{ display:"flex", gap:8 }}><button onClick={()=>{ setShowRating(false); window.location.href="/filmes" }} style={{ flex:1, padding:10, borderRadius:12, background:"#0E1430", color:"#fff", border:"1px solid #333" }}>Depois</button><button onClick={()=>salvarNota(minhaNota||5)} style={{ flex:1, padding:10, borderRadius:12, background:"#22c55e", color:"#fff", border:0, fontWeight:900 }}>Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
