"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w500"

export default function DetalheFilme({ params }) {
  const id = String(params.id)
  const [uid, setUid] = useState(null)
  const [filme, setFilme] = useState(null)
  const [status, setStatus] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [detalhes, setDetalhes] = useState({ sinopse:"", nota:0, votos:0, providers:[], emCartaz:false, lancamento:"" })
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
        try { const all = JSON.parse(localStorage.getItem(userId + ":meus-filmes") || "[]"); f = all.find(function(x){ return String(x.id)===id }) } catch(e){}
      }
      if (!f) f = { id: id, titulo: "Filme " + id, img: "https://picsum.photos/seed/" + id + "/600/900" }

      const stLocal = localStorage.getItem(userId + ":filme-status-" + id) || ""
      setFilme(f)
      setStatus(stLocal)

      try {
        const res = await supabase.from("user_filmes").select("status,nota,avaliacao").eq("user_id", userId).eq("filme_id", id).single()
        if (res.data?.status) setStatus(res.data.status)
        if(res.data?.nota || res.data?.avaliacao) setMinhaNota(res.data.nota || res.data.avaliacao)
      } catch(e){}

      // TMDB DETALHES
      try{
        const key = TMDB_KEY
        const [det, prov] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=pt-BR`, { cache:'no-store' }).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${key}`, { cache:'no-store' }).then(r=>r.json())
        ])
        if(det && det.title){
          f = {...f, titulo: det.title, img: det.poster_path? `${TMDB_IMG}${det.poster_path}` : f.img, banner: det.backdrop_path? `${TMDB_IMG}${det.backdrop_path}` : f.img }
          setFilme(f)
          const br = prov.results?.BR
          let providers = []
          let emCartaz = false
          if(br){
            const all = [...(br.flatrate||[]),...(br.rent||[]),...(br.buy||[])]
            providers = [...new Map(all.map(p=>[p.provider_id,p])).values()].slice(0,8)
            emCartaz =!!(br.flatrate || br.buy || br.rent)
          }
          setDetalhes({
            sinopse: det.overview || "",
            nota: det.vote_average || 0,
            votos: det.vote_count || 0,
            providers,
            emCartaz: det.status? det.status : "",
            lancamento: det.release_date || "",
            cinema:!providers.length && det.release_date
          })
        }
      }catch(e){}
    }
    load()
  }, [id])

  async function mudar(novoStatus) {
    if (!uid || salvando) return
    setSalvando(true)

    if(novoStatus === "ja_assisti"){
      setStatus(novoStatus)
      try{
        localStorage.setItem(uid + ":filme-status-" + id, novoStatus)
        const raw = localStorage.getItem(uid + ":meus-filmes")
        if (raw) {
          let lista = JSON.parse(raw)
          let achou = false
          lista = lista.map(function(x){ if (String(x.id)===id){ achou=true; return {...x, status:novoStatus} } return x })
          if(!achou && filme) lista.unshift({...filme, id:id, status:novoStatus})
          localStorage.setItem(uid + ":meus-filmes", JSON.stringify(lista))
        }
      }catch(e){}
      try{
        await supabase.from("user_filmes").upsert({
          user_id: uid,
          filme_id: id,
          titulo: filme?.titulo || "Filme",
          img: filme?.img || "",
          status: novoStatus,
          updated_at: new Date().toISOString()
        }, { onConflict:"user_id,filme_id" })
      }catch(e){}
      setSalvando(false)
      setShowRating(true)
      return
    }

    setStatus(novoStatus)
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
    setTimeout(function(){ window.location.href = "/filmes" }, 300)
  }

  async function salvarNota(nota){
    setMinhaNota(nota)
    setShowRating(false)
    localStorage.setItem(uid + ":filme-nota-" + id, String(nota))
    try{
      await supabase.from("user_filmes").upsert({
        user_id: uid,
        filme_id: id,
        titulo: filme?.titulo || "Filme",
        img: filme?.img || "",
        status: "ja_assisti",
        nota: nota,
        avaliacao: nota,
        updated_at: new Date().toISOString()
      }, { onConflict:"user_id,filme_id" })
    }catch{}
    setTimeout(()=>{ window.location.href="/filmes" }, 400)
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
      localStorage.removeItem(uid + ":filme-nota-" + id)
    } catch(e){}
    window.location.href = "/filmes"
  }

  if (!filme) return null

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff" }}>
      <div style={{ height:360, position:"relative", overflow:"hidden" }}>
        <img src={filme.banner || filme.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(0,0,0,0.2), #080B1F 95%)" }} />
        <button onClick={function(){ window.location.href="/filmes" }} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#000", border:"1px solid #333", color:"#fff", cursor:"pointer", zIndex:2 }}>{"<"}</button>
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"8px 14px", borderRadius:999, background:"#ef4444", color:"#fff", fontWeight:900, fontSize:12, border:0, cursor:"pointer", zIndex:5 }}>Abandonar</button>
        <div style={{ position:"absolute", bottom:0, left:16, right:16, display:"flex", gap:12, alignItems:"flex-end", transform:"translateY(18px)" }}>
          <img src={filme.img} alt="" style={{ width:96, height:144, borderRadius:12, objectFit:"cover", border:"2px solid #222", background:"#000" }} />
          <div style={{ flex:1, paddingBottom:10 }}>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900, lineHeight:1.2 }}>{filme.titulo}</h1>
            <div style={{ fontSize:11, opacity:0.6, marginTop:4, display:"flex", gap:8, alignItems:"center" }}>
              <span>{detalhes.lancamento? detalhes.lancamento.slice(0,4) : ""}</span>
              {detalhes.nota>0 && <span style={{ color:"#FFD400" }}>★ {detalhes.nota.toFixed(1)}</span>}
              {status==="ja_assisti" && minhaNota>0 && <span style={{ background:"#FFD400", color:"#000", padding:"1px 6px", borderRadius:99, fontWeight:900 }}>{minhaNota}★</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"44px 14px 20px" }}>
        {/* SINOPSE + NOTA + STREAMING / CINEMA */}
        {(detalhes.sinopse || detalhes.providers.length>0) && (
          <div style={{ background:"#12182F", border:"1px solid #1e274f", borderRadius:16, padding:14, marginBottom:14 }}>
            {detalhes.nota>0 && <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8, fontSize:13 }}><span style={{ color:"#FFD400" }}>★ {detalhes.nota.toFixed(1)}</span><span style={{ opacity:0.5, fontSize:11 }}>({detalhes.votos} votos)</span></div>}
            {detalhes.sinopse && <div style={{ fontSize:12, lineHeight:1.5, opacity:0.85 }}>{detalhes.sinopse}</div>}
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:11, opacity:0.6, marginBottom:6 }}>Onde assistir:</div>
              {detalhes.providers.length>0? (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {detalhes.providers.map(p=>(
                    <div key={p.provider_id} title={p.provider_name} style={{ width:36, height:36, borderRadius:8, overflow:"hidden", background:"#0E1430", border:"1px solid rgba(255,255,255,0.1)" }}>
                      <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:12, background:"rgba(255,212,0,0.1)", border:"1px solid rgba(255,212,0,0.2)", padding:"8px 10px", borderRadius:10, color:"#FFD400", fontWeight:700 }}>🎬 No cinema {detalhes.lancamento? `• Lançamento ${detalhes.lancamento}` : ""} • Ainda não está em streaming no Brasil</div>
              )}
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button disabled={salvando} onClick={function(){ mudar("quero_assistir") }} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="quero_assistir"? "#FFD400" : "#12182F", color: status==="quero_assistir"? "#000" : "#fff", border:"1px solid #222", cursor:"pointer", opacity:salvando?0.6:1 }}>{status==="quero_assistir"?"★ Quero Assistir":"Quero Assistir"}</button>
          <button disabled={salvando} onClick={function(){ mudar("ja_assisti") }} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="ja_assisti"? "#22c55e" : "#12182F", color:"#fff", border:"1px solid #222", cursor:"pointer", opacity:salvando?0.6:1 }}>{status==="ja_assisti"? `✓ Já Assisti ${minhaNota? minhaNota+"★" : ""}`:"Já Assisti"}</button>
        </div>

        <div style={{ marginTop:16, background:"#12182F", border:"1px solid #1e274f", borderRadius:16, padding:14 }}>
          <b style={{ fontSize:13 }}>Como funciona</b>
          <div style={{ fontSize:12, opacity:0.6, marginTop:6, lineHeight:1.5 }}>Série nova entra sem botão amarelo. Ao escolher, o filme vai pra aba correta em <b>Filmes</b>. Ao clicar em Já Assisti, avalie com estrelas.</div>
        </div>

        {salvando && <div style={{ textAlign:"center", marginTop:12, fontSize:12, opacity:0.6 }}>Salvando e voltando...</div>}
      </div>

      {showRating && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"grid", placeItems:"center", zIndex:10000, padding:16 }}>
          <div style={{ background:"#12182F", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:20, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:900, marginBottom:6 }}>Avalie {filme.titulo}</div>
            <div style={{ fontSize:12, opacity:0.6, marginBottom:14 }}>Sua nota vai para a aba Já Assisti</div>
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:16 }}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onMouseEnter={()=>setHoverNota(n)} onMouseLeave={()=>setHoverNota(0)} onClick={()=>salvarNota(n)} style={{ fontSize:36, background:"transparent", border:0, cursor:"pointer", color: (hoverNota||minhaNota)>=n? "#FFD400" : "rgba(255,255,255,0.2)", transition:"0.15s" }}>★</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ setShowRating(false); window.location.href="/filmes" }} style={{ flex:1, padding:10, borderRadius:12, background:"#0E1430", color:"#fff", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontSize:12, fontWeight:700 }}>Depois</button>
              <button onClick={()=>salvarNota(minhaNota||5)} style={{ flex:1, padding:10, borderRadius:12, background:"#22c55e", color:"#fff", border:0, cursor:"pointer", fontSize:12, fontWeight:900 }}>Salvar {minhaNota||hoverNota? `${hoverNota||minhaNota}★` : ""}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
