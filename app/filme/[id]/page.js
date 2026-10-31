"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import ShareModal from "../../../components/ShareModal"

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
  const [detalhes, setDetalhes] = useState({ sinopse:"", nota:0, votos:0, providers:[], lancamento:"", emCartaz:false, providerLink:"" })
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
        const [det, prov, nowPlayingPages] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=pt-BR`).then(r=>r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${TMDB_KEY}`).then(r=>r.json()),
          Promise.all([1,2,3,4,5].map(page =>
            fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&language=pt-BR&region=BR&page=${page}`)
              .then(r=>r.json()).catch(()=>({results:[]}))
          ))
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
          const emCartaz = nowPlayingPages.some(page =>
            (page.results || []).some(movie => String(movie.id) === id)
          )
          setDetalhes({
            sinopse: det.overview || "",
            nota: det.vote_average || 0,
            votos: det.vote_count || 0,
            providers,
            lancamento: det.release_date || "",
            emCartaz,
            providerLink: br?.link || ""
          })
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
    if(rede==='copiar'){ navigator.clipboard.writeText(txt).catch(()=>{}) }
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
    setTimeout(()=>abrirShare("ja_assisti"), 250)
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
        {(detalhes.sinopse || detalhes.providers.length>0 || detalhes.emCartaz) && (
          <div style={{ background:"#12182F", border:"1px solid #1e274f", borderRadius:16, padding:14, marginBottom:14 }}>
            {detalhes.sinopse && <div style={{ fontSize:12, lineHeight:1.5, opacity:0.85 }}>{detalhes.sinopse}</div>}
          </div>
        )}

        <section style={{ background:"#12182F", border:"1px solid #1e274f", borderRadius:16, padding:14, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:12 }}>
            <h2 style={{ margin:0, fontSize:14, fontWeight:900 }}>Onde assistir</h2>
            <span style={{ fontSize:10, opacity:0.5 }}>Brasil</span>
          </div>
          {detalhes.emCartaz && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:10, borderRadius:12, background:"#182b24", border:"1px solid #24543b" }}>
              <span style={{ fontSize:22 }}>🎟️</span>
              <div>
                <div style={{ fontSize:12, fontWeight:900, color:"#86efac" }}>Em cartaz nos cinemas</div>
                <div style={{ fontSize:10, opacity:0.7, marginTop:2 }}>O filme aparece na seleção atual de lançamentos em cartaz no Brasil</div>
              </div>
            </div>
          )}
          {detalhes.providers.length>0 ? (
            <>
              <div style={{ fontSize:10, opacity:0.55, marginBottom:8 }}>Disponível para assistir por streaming, aluguel ou compra:</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(76px,1fr))", gap:10 }}>
                {detalhes.providers.map(p => (
                  <a key={p.provider_id} href={detalhes.providerLink || "https://www.themoviedb.org/"} target="_blank" rel="noopener noreferrer" title={p.provider_name}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:8, borderRadius:12, background:"#0b1026", border:"1px solid #ffffff12", color:"#fff", textDecoration:"none", minWidth:0 }}>
                    {p.logo_path
                      ? <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt="" style={{ width:42, height:42, borderRadius:10, objectFit:"cover" }} />
                      : <span style={{ width:42, height:42, display:"grid", placeItems:"center", borderRadius:10, background:"#202944", fontSize:16 }}>▶</span>}
                    <span style={{ fontSize:10, fontWeight:800, textAlign:"center", lineHeight:1.2 }}>{p.provider_name}</span>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize:11, opacity:0.65, lineHeight:1.5 }}>
              {detalhes.emCartaz ? "Não encontramos opções de streaming confirmadas no momento." : "Nenhuma opção de streaming ou aluguel foi confirmada no Brasil no momento."}
            </div>
          )}
        </section>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button disabled={salvando} onClick={()=> mudar("quero_assistir")} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="quero_assistir"? "#FFD400" : "#12182F", color: status==="quero_assistir"? "#000" : "#fff", border:"1px solid #222", cursor:"pointer" }}>{status==="quero_assistir"?"★ Quero Assistir":"Quero Assistir"}</button>
          <button disabled={salvando} onClick={()=> mudar("ja_assisti")} style={{ height:48, borderRadius:12, fontWeight:900, fontSize:13, background: status==="ja_assisti"? "#22c55e" : "#12182F", color:"#fff", border:"1px solid #222", cursor:"pointer" }}>{status==="ja_assisti"?"✓ Já Assisti":"Já Assisti"}</button>
        </div>
      </div>

      {showShare && shareData && (
        <ShareModal
          heading={shareData.tipo === "ja_assisti" ? "Compartilhe sua sessão" : shareData.tipo === "quero_assistir" ? "Convide para assistir" : "Compartilhe este filme"}
          title={shareData.titulo}
          subtitle={shareData.subtexto}
          image={shareData.img}
          emoji={shareData.emoji}
          message={shareData.texto}
          accent={shareData.cor}
          onClose={() => setShowShare(false)}
          onShare={compartilhar}
          onDownload={() => baixarImagemShare("story")}
          downloading={baixando}
        />
      )}
      {showRating && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"grid", placeItems:"center", zIndex:10000, padding:16 }}>
          <div style={{ background:"#12182F", borderRadius:20, padding:20, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:900, marginBottom:14 }}>Avalie {filme.titulo}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:16 }}>{[1,2,3,4,5].map(n=><button key={n} onMouseEnter={()=>setHoverNota(n)} onMouseLeave={()=>setHoverNota(0)} onClick={()=>salvarNota(n)} style={{ fontSize:36, background:"transparent", border:0, cursor:"pointer", color: (hoverNota||minhaNota)>=n? "#FFD400" : "rgba(255,255,255,0.2)" }}>★</button>)}</div>
            <div style={{ display:"flex", gap:8 }}><button onClick={()=>{ setShowRating(false); abrirShare("ja_assisti") }} style={{ flex:1, padding:10, borderRadius:12, background:"#0E1430", color:"#fff", border:"1px solid #333" }}>Depois</button><button onClick={()=>salvarNota(minhaNota||5)} style={{ flex:1, padding:10, borderRadius:12, background:"#22c55e", color:"#fff", border:0, fontWeight:900 }}>Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
