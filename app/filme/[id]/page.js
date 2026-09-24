"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w500"
const SITE_URL = "https://www.maratoneiapp.com.br"

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
  const [showShare, setShowShare] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [baixando, setBaixando] = useState(false)

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

  function abrirShare(tipoStatus){
    if(!filme) return
    const linkFilme = `${SITE_URL}/filme/${id}`
    const textos = {
      quero_assistir: `Coloquei ${filme.titulo} na minha lista para assistir no Maratonei App 🍿\n\nVem organizar seus filmes também no Maratonei: ${linkFilme}`,
      ja_assisti: `Acabei de assistir ${filme.titulo}! ${minhaNota? `Minha nota: ${minhaNota}★ ` : ''}🎬\n\nOrganizo tudo no Maratonei App - vem organizar seus filmes também: ${linkFilme}`,
      livre: `Olha esse filme: ${filme.titulo} 🎬\n\nTô organizando minha lista no Maratonei App, vem organizar os seus também: ${linkFilme}`
    }
    setShareData({
      tipo: tipoStatus,
      titulo: filme.titulo,
      texto: textos[tipoStatus] || textos.livre,
      subtexto: `${detalhes.lancamento? detalhes.lancamento.slice(0,4)+' • ' : ''}${detalhes.nota? `★ ${detalhes.nota.toFixed(1)}` : ''}`,
      img: filme.img,
      link: linkFilme,
      cor: tipoStatus==='ja_assisti'? '#22c55e' : '#FFD400',
      emoji: tipoStatus==='ja_assisti'? '🎬' : '🍿'
    })
    setShowShare(true)
  }

  function compartilhar(rede){
    if(!shareData) return
    const txt = shareData.texto
    if(navigator.share && rede==='nativo'){
      navigator.share({ title: filme.titulo, text: txt, url: shareData.link }).catch(()=>{})
      return
    }
    if(rede==='whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank')
    if(rede==='twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`, '_blank')
    if(rede==='copiar'){ navigator.clipboard.writeText(txt); alert('Link copiado com CTA!') }
  }

  async function baixarImagemShare(formato = 'story'){
    if(!shareData ||!filme) return
    setBaixando(true)
    try{
      const canvas = document.createElement('canvas')
      if(formato==='story'){
        canvas.width = 1080
        canvas.height = 1920
      } else {
        canvas.width = 1080
        canvas.height = 1080
      }
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#080B1F'
      ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.fillStyle = shareData.cor
      ctx.fillRect(0,0,canvas.width,16)

      // Carrega poster via proxy (resolve CORS)
      let bmp = null
      try{
        const proxied = `/api/proxy-image?url=${encodeURIComponent(shareData.img)}`
        const res = await fetch(proxied)
        const blob = await res.blob()
        bmp = await createImageBitmap(blob)
      }catch{}

      if(bmp){
        if(formato==='story'){
          ctx.drawImage(bmp, 90, 100, 900, 1350)
          const grad = ctx.createLinearGradient(0, 900, 0, 1450)
          grad.addColorStop(0, 'rgba(8,11,31,0)')
          grad.addColorStop(1, 'rgba(8,11,31,1)')
          ctx.fillStyle = grad
          ctx.fillRect(0, 900, 1080, 550)
        } else {
          ctx.drawImage(bmp, 340, 80, 400, 600)
        }
      }

      ctx.textAlign = 'center'
      ctx.font = '90px serif'
      ctx.fillText(shareData.emoji, 540, formato==='story'? 1550 : 780)

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 48px sans-serif'
      const tit = filme.titulo.length>28? filme.titulo.slice(0,28)+'...' : filme.titulo
      ctx.fillText(tit, 540, formato==='story'? 1630 : 840)

      ctx.fillStyle = '#FFD400'
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText('Vem organizar seus filmes também!', 540, formato==='story'? 1720 : 900)

      ctx.fillStyle = '#ffffff66'
      ctx.font = '24px sans-serif'
      ctx.fillText('maratoneiapp.com.br', 540, formato==='story'? 1770 : 940)

      const a = document.createElement('a')
      a.download = `maratonei-${formato}-${filme.titulo.replace(/\s+/g,'-')}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }catch(e){
      alert('Erro ao gerar imagem: '+e.message)
    }
    setBaixando(false)
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
      alert("Erro: "+e.message)
      setSalvando(false)
      return
    }
    if(novoStatus==="ja_assisti"){
      setSalvando(false)
      setShowRating(true)
      setTimeout(()=>abrirShare(novoStatus), 600)
      return
    }
    if(novoStatus==="quero_assistir"){
      setSalvando(false)
      abrirShare(novoStatus)
      return
    }
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
        <div style={{position:"absolute", top:14, right:14, display:"flex", gap:8, zIndex:5}}>
          <button onClick={()=>abrirShare('livre')} style={{ padding:"8px 14px", borderRadius:999, background:"#ffffff18", backdropFilter:"blur(10px)", color:"#fff", fontWeight:800, fontSize:12, border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer" }}>↗ Compartilhar</button>
          <button onClick={abandonar} style={{ padding:"8px 14px", borderRadius:999, background:"#ef4444", color:"#fff", fontWeight:900, fontSize:12, border:0, cursor:"pointer" }}>Abandonar</button>
        </div>
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
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button disabled={salvando} onClick={()=> mudar("quero_assistir")} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="quero_assistir"? "#FFD400" : "#12182F", color: status==="quero_assistir"? "#000" : "#fff", border:"1px solid #222", cursor:"pointer" }}>{status==="quero_assistir"?"★ Quero Assistir":"Quero Assistir"}</button>
          <button disabled={salvando} onClick={()=> mudar("ja_assisti")} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="ja_assisti"? "#22c55e" : "#12182F", color:"#fff", border:"1px solid #222", cursor:"pointer" }}>{status==="ja_assisti"?"✓ Já Assisti":"Já Assisti"}</button>
        </div>
      </div>

      {showShare && shareData && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(12px)", zIndex:10002, padding:14, display:"grid", placeItems:"center"}}>
          <div style={{width:"100%", maxWidth:400, background:"#12182F", border:"1px solid #ffffff18", borderRadius:20, padding:18}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
              <b>Compartilhar filme</b>
              <button onClick={()=>setShowShare(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{background: "#0A0F2A", border:`1px solid ${shareData.cor}44`, borderRadius:16, padding:16, textAlign:"center"}}>
              <div style={{width:90, height:135, margin:"0 auto", borderRadius:10, overflow:"hidden", background:"#000", border:`2px solid ${shareData.cor}55`}}><img src={shareData.img} style={{width:"100%", height:"100%", objectFit:"cover"}} /></div>
              <div style={{fontSize:28, marginTop:10}}>{shareData.emoji}</div>
              <div style={{fontSize:15, fontWeight:900, marginTop:6}}>{shareData.titulo}</div>
              <div style={{fontSize:11, opacity:0.6, marginTop:4}}>{shareData.subtexto}</div>
              <div style={{marginTop:10, fontSize:11, background:"#ffffff10", padding:"8px", borderRadius:8, whiteSpace:"pre-wrap"}}>{shareData.texto}</div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:14}}>
              <button onClick={()=>compartilhar('whatsapp')} style={{background:"#25D366", color:"#fff", border:0, borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>WhatsApp</button>
              <button onClick={()=>compartilhar('twitter')} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>X / Twitter</button>
              <button onClick={()=>compartilhar('copiar')} style={{background:"#ffffff12", color:"#fff", border:"1px solid #ffffff20", borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>🔗 Copiar Link</button>
              <button onClick={()=>baixarImagemShare('feed')} disabled={baixando} style={{background:"#FFD400", color:"#000", border:0, borderRadius:999, padding:"12px", fontWeight:900, fontSize:12}}>{baixando?'...':'⬇ Feed'}</button>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8}}>
              <button onClick={()=>baixarImagemShare('story')} disabled={baixando} style={{background:"#8b5cf6", color:"#fff", border:0, borderRadius:999, padding:"12px", fontWeight:900, fontSize:12}}>{baixando?'Gerando...':'📸 Instagram Story'}</button>
              <button onClick={()=>compartilhar('nativo')} style={{background:"#ffffff15", color:"#fff", border:"1px solid #ffffff20", borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>📲 Mais</button>
            </div>
          </div>
        </div>
      )}
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
