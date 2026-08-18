"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams, useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"

export default function DetalheSerie() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)
  const [userId, setUserId] = useState(null)
  const [serie, setSerie] = useState(null)
  const [status, setStatus] = useState("") // vazio = tudo azul
  const [epsVistos, setEpsVistos] = useState([])
  const [temporadas, setTemporadas] = useState([])
  const [aberta, setAberta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detalhes, setDetalhes] = useState({ sinopse:"", nota:0, votos:0, providers:[] })
  const [showRating, setShowRating] = useState(false)
  const [minhaNota, setMinhaNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)

  useEffect(() => {
    async function run() {
      setLoading(true)
      setSerie(null)
      setTemporadas([])
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/login"); return }
      const uid = session.user.id
      setUserId(uid)
      const { data: row } = await supabase.from("user_series").select("*").eq("user_id", uid).eq("serie_id", id).maybeSingle()
      if (!row) { router.push("/"); return }
      let s = { id: row.serie_id, titulo: row.titulo, ano: row.ano, img: row.img, q: row.q, status: row.status, origem: row.origem || "tmdb" }
      setSerie(s)
      setStatus(row.status || "") // SE VAZIO, NENHUM AMARELO
      setEpsVistos(row.eps_vistos || [])
      if(row.nota || row.avaliacao) setMinhaNota(row.nota || row.avaliacao)
      try {
        let lista = [], updates = {}, sinopse="", notaTmdb=0, votos=0, providers=[]
        if (s.origem === "tmdb") {
          const details = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=pt-BR`, { cache: 'no-store' }).then(r=>r.json())
          if (details?.name) {
            sinopse = details.overview || ""; notaTmdb = details.vote_average || 0; votos = details.vote_count || 0
            const newImg = details.poster_path? `https://image.tmdb.org/t/p/w500${details.poster_path}` : s.img
            if(newImg!==s.img) updates.img=newImg
            s = {...s, titulo: details.name, ano: details.first_air_date?.slice(0,4) || s.ano, img: newImg, banner: newImg }
            setSerie(s)
            try{
              const prov = await fetch(`https://api.themoviedb.org/3/tv/${id}/watch/providers?api_key=${TMDB_KEY}`).then(r=>r.json())
              const br = prov.results?.BR
              if(br){ const all=[...(br.flatrate||[]),...(br.rent||[]),...(br.buy||[])]; providers=[...new Map(all.map(p=>[p.provider_id,p])).values()].slice(0,6) }
            }catch{}
          }
          if(details?.seasons){
            const seasonsData = await Promise.all(details.seasons.filter(se=>se.season_number>0).map(se=>fetch(`https://api.themoviedb.org/3/tv/${id}/season/${se.season_number}?api_key=${TMDB_KEY}&language=pt-BR`).then(r=>r.json())))
            const mapa={}; seasonsData.forEach(se=>{ mapa[se.season_number]={ numero: se.season_number, eps: se.episodes.map(ep=>({ id:String(ep.id), numero:ep.episode_number, nome:ep.name, resumo: ep.overview?.replace(/<[^>]+>/g,"").trim()||"Sem resumo.", img: ep.still_path? `https://image.tmdb.org/t/p/w300${ep.still_path}`:"", runtime:ep.runtime||0, airdate:ep.air_date||"" })) } })
            lista=Object.values(mapa).sort((x,y)=>x.numero-y.numero)
          }
        }
        if(Object.keys(updates).length) await supabase.from("user_series").update({...updates, updated_at:new Date().toISOString()}).eq("user_id",uid).eq("serie_id",id)
        setDetalhes({ sinopse, nota:notaTmdb, votos, providers })
        const totalCalc = lista.reduce((a,t)=>a+t.eps.length,0)
        localStorage.setItem(uid+":total-"+id, String(totalCalc))
        setTemporadas(lista.length? lista : [{ numero:1, eps:[{ id:id+"-1", numero:1, nome:"Episódio 1", resumo:"", img:"" }]}])
        setAberta(null)
      } catch(e){ setTemporadas([{ numero:1, eps:[{ id:id+"-1", numero:1, nome:"Episódio 1", resumo:"", img:"" }]}]); setAberta(null) }
      setLoading(false)
    }
    run()
  }, [id, router])

  async function toggleEp(eid){
    let novo = epsVistos.includes(eid)? epsVistos.filter(x=>x!==eid) : [...epsVistos, eid]
    setEpsVistos(novo); localStorage.setItem(userId+":eps-"+id, JSON.stringify(novo))
    await supabase.from("user_series").update({ eps_vistos:novo, updated_at:new Date().toISOString() }).eq("user_id",userId).eq("serie_id",id)
  }
  async function maratonarTemp(temp){
    const ids=temp.eps.map(e=>e.id); const todos=ids.every(i=>epsVistos.includes(i))
    let novo = todos? epsVistos.filter(i=>!ids.includes(i)) : Array.from(new Set([...epsVistos,...ids]))
    setEpsVistos(novo); localStorage.setItem(userId+":eps-"+id, JSON.stringify(novo))
    await supabase.from("user_series").update({ eps_vistos:novo, updated_at:new Date().toISOString() }).eq("user_id",userId).eq("serie_id",id)
  }
  async function mudarStatus(novo){
    setStatus(novo); localStorage.setItem(userId+":status-"+id, novo)
    await supabase.from("user_series").update({ status:novo, updated_at:new Date().toISOString() }).eq("user_id",userId).eq("serie_id",id)
    if(novo==="maratonei"){
      const todosIds=temporadas.flatMap(t=>t.eps.map(e=>e.id)); const novoEps=Array.from(new Set([...epsVistos,...todosIds]))
      setEpsVistos(novoEps); localStorage.setItem(userId+":eps-"+id, JSON.stringify(novoEps))
      await supabase.from("user_series").update({ eps_vistos:novoEps }).eq("user_id",userId).eq("serie_id",id)
      setShowRating(true)
    }
  }
  async function salvarNota(nota){ setMinhaNota(nota); setShowRating(false); localStorage.setItem(userId+":nota-"+id, String(nota)); try{ await supabase.from("user_series").update({ nota, avaliacao:nota, updated_at:new Date().toISOString() }).eq("user_id",userId).eq("serie_id",id) }catch{} }
  async function abandonar(){ if(!confirm("Abandonar "+serie.titulo+"?")) return; setLoading(true); const {data:{session}}=await supabase.auth.getSession(); if(!session){ router.push("/login"); return } await supabase.from("user_series").delete().eq("user_id",session.user.id).eq("serie_id",serie.id); router.push("/"); router.refresh() }

  const totalEps = useMemo(()=>temporadas.reduce((a,t)=>a+t.eps.length,0),[temporadas])
  const progresso = totalEps? Math.round((epsVistos.length/totalEps)*100) : 0

  if(loading) return <div style={{minHeight:"100vh", background:"#080B1F", display:"grid", placeItems:"center", color:"#fff"}}>Carregando...</div>
  if(!serie) return null

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff" }}>
      <div style={{ height:300, position:"relative", overflow:"hidden" }}>
        <img src={serie.banner||serie.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(0,0,0,0.2), #080B1F 95%)" }} />
        <button onClick={()=>router.back()} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"rgba(0,0,0,0.6)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", cursor:"pointer" }}>{"<"}</button>
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"7px 12px", borderRadius:999, background:"#ef4444", color:"#fff", fontSize:11, fontWeight:900, cursor:"pointer", border:"1px solid rgba(255,255,255,0.2)", zIndex:9 }}>Abandonar</button>
        <div style={{ position:"absolute", bottom:0, left:16, right:16, display:"flex", gap:12, alignItems:"flex-end", transform:"translateY(22px)" }}>
          <img src={serie.img} alt="" style={{ width:90, height:135, borderRadius:12, objectFit:"cover", border:"2px solid rgba(255,255,255,0.15)" }} />
          <div style={{ flex:1, paddingBottom:6, minWidth:0 }}>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900 }}>{serie.titulo}</h1>
            <div style={{ fontSize:11, opacity:0.6, marginTop:4 }}>{temporadas.length} temp • {epsVistos.length}/{totalEps} • {progresso}% {minhaNota? `• ${minhaNota}★` : ""}</div>
            <div style={{ height:4, background:"rgba(255,255,255,0.15)", borderRadius:99, marginTop:8 }}><div style={{ width:progresso+"%", height:"100%", background:"#FFD400", borderRadius:99 }} /></div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"44px 14px 20px" }}>
        {(detalhes.sinopse||detalhes.providers.length>0) && (
          <div style={{ background:"#12182F", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:14, marginBottom:14 }}>
            {detalhes.nota>0 && <div style={{ display:"flex", gap:6, marginBottom:8, fontSize:13 }}><span style={{ color:"#FFD400" }}>★ {detalhes.nota.toFixed(1)}</span><span style={{ opacity:0.5, fontSize:11 }}>({detalhes.votos} votos)</span></div>}
            {detalhes.sinopse && <div style={{ fontSize:12, lineHeight:1.5, opacity:0.85 }}>{detalhes.sinopse}</div>}
            {detalhes.providers.length>0 && <div style={{ marginTop:12 }}><div style={{ fontSize:11, opacity:0.6, marginBottom:6 }}>Onde assistir:</div><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{detalhes.providers.map(p=><div key={p.provider_id} title={p.provider_name} style={{ width:36, height:36, borderRadius:8, overflow:"hidden", background:"#0E1430", border:"1px solid rgba(255,255,255,0.1)" }}><img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>)}</div></div>}
          </div>
        )}

        {/* AVISO SE NENHUM SELECIONADO */}
        {status==="" && <div style={{ background:"rgba(255,212,0,0.1)", border:"1px solid rgba(255,212,0,0.25)", borderRadius:12, padding:"10px 12px", marginBottom:12, fontSize:12, textAlign:"center", color:"#FFD400", fontWeight:700 }}>👀 Essa série ainda não está na sua home. Escolha abaixo onde colocar:</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
          <button onClick={()=>mudarStatus("assistindo")} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, background: status==="assistindo"?"#FFD400":"#12182F", color: status==="assistindo"?"#000":"#fff", border:"1px solid rgba(255,255,255,0.08)" }}>Assistindo</button>
          <button onClick={()=>mudarStatus("quero_assistir")} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, background: status==="quero_assistir"?"#FFD400":"#12182F", color: status==="quero_assistir"?"#000":"#fff", border:"1px solid rgba(255,255,255,0.08)" }}>Quero Assistir</button>
          <button onClick={()=>mudarStatus("maratonei")} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, background: status==="maratonei"?"#FFD400":"#12182F", color: status==="maratonei"?"#000":"#fff", border:"1px solid rgba(255,255,255,0.08)", gridColumn:"span 2" }}>Maratonei {minhaNota? `• ${minhaNota}★` : ""}</button>
        </div>

        <div style={{ background:"#12182F", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:12 }}>
          <b style={{ fontSize:13 }}>Temporadas • {temporadas.length}</b>
          {temporadas.map(t=>{ const vistos=t.eps.filter(e=>epsVistos.includes(e.id)).length; const aberto=aberta===t.numero; return (
            <div key={t.numero} style={{ borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:10, paddingTop:10 }}>
              <div onClick={()=>setAberta(aberto? null : t.numero)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <span style={{ fontSize:13, fontWeight:700 }}>Temporada {t.numero} <span style={{ fontSize:11, background:"rgba(255,255,255,0.1)", padding:"2px 6px", borderRadius:99 }}>{vistos}/{t.eps.length}</span></span>
                <button onClick={e=>{ e.stopPropagation(); maratonarTemp(t) }} style={{ fontSize:10, padding:"5px 10px", borderRadius:99, background: vistos===t.eps.length?"#22c55e":"rgba(255,212,0,0.14)", color: vistos===t.eps.length?"#fff":"#FFD400", border:"1px solid rgba(255,212,0,0.2)", cursor:"pointer", fontWeight:800 }}>{vistos===t.eps.length?"Desmarcar":"Maratonar tudo"}</button>
              </div>
              {aberto && <div style={{ marginTop:12, display:"grid", gap:10 }}>{t.eps.map(ep=>{ const ok=epsVistos.includes(ep.id); return (
                <div key={ep.id} style={{ display:"flex", gap:10, padding:10, borderRadius:14, background: ok?"rgba(255,255,255,0.05)":"#0E1430", border: ok?"1px solid #22c55e55":"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width:84, height:48, borderRadius:8, overflow:"hidden", background:"#0A0F2A" }}>{ep.img? <img src={ep.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ display:"grid", placeItems:"center", fontSize:10, opacity:0.3, height:"100%" }}>SEM IMG</div>}</div>
                  <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:800 }}>{ep.numero}. {ep.nome}</div><div style={{ fontSize:11, opacity:0.55, marginTop:4 }}>{ep.resumo}</div></div>
                  <button onClick={()=>toggleEp(ep.id)} style={{ width:36, height:36, borderRadius:999, border: ok?"0":"1.5px solid rgba(255,255,255,0.2)", background: ok?"#22c55e":"transparent", color:"#fff", cursor:"pointer" }}>{ok?"✓":""}</button>
                </div>
              )})}</div>}
            </div>
          )})}
        </div>
      </div>

      {showRating && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"grid", placeItems:"center", zIndex:10000, padding:16 }}>
          <div style={{ background:"#12182F", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:20, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:900, marginBottom:6 }}>Avalie {serie.titulo}</div>
            <div style={{ fontSize:12, opacity:0.6, marginBottom:14 }}>Sua nota vai para a aba Maratonei</div>
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:16 }}>{[1,2,3,4,5].map(n=><button key={n} onMouseEnter={()=>setHoverNota(n)} onMouseLeave={()=>setHoverNota(0)} onClick={()=>salvarNota(n)} style={{ fontSize:36, background:"transparent", border:0, cursor:"pointer", color:(hoverNota||minhaNota)>=n?"#FFD400":"rgba(255,255,255,0.2)" }}>★</button>)}</div>
            <div style={{ display:"flex", gap:8 }}><button onClick={()=>setShowRating(false)} style={{ flex:1, padding:10, borderRadius:12, background:"#0E1430", color:"#fff", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>Depois</button><button onClick={()=>salvarNota(minhaNota||5)} style={{ flex:1, padding:10, borderRadius:12, background:"#FFD400", color:"#000", border:0, cursor:"pointer", fontWeight:900 }}>Salvar {minhaNota||hoverNota? `${hoverNota||minhaNota}★` : ""}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
