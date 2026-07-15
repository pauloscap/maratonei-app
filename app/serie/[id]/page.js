"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const MAPA_IDS_FAKE = {
  "101": 45582,
  "102": 71268,
  "103": 0,
  "104": 73,
  "201": 0,
  "301": 2993,
  "302": 61167,
}

export default function DetalheSerie({ params }) {
  const id = String(params.id)
  const [userId, setUserId] = useState("anon")
  const [serie, setSerie] = useState(null)
  const [status, setStatus] = useState("assistindo")
  const [epsVistos, setEpsVistos] = useState([])
  const [temporadas, setTemporadas] = useState([])
  const [aberta, setAberta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { window.location.href = "/login"; return }
      const uid = data.session.user.id
      setUserId(uid)
      let s = null
      try { const raw = localStorage.getItem(uid + ":serie-atual"); if (raw) s = JSON.parse(raw) } catch {}
      if (!s || String(s.id)!== id) s = { id, titulo: id, img: "" }
      setSerie(s)
      const st = localStorage.getItem(uid + ":status-" + id)
      if (st) setStatus(st); else if (s.status) setStatus(s.status)
      setEpsVistos(JSON.parse(localStorage.getItem(uid + ":eps-" + id) || "[]"))

      let rid = MAPA_IDS_FAKE[id] || id
      if (!rid || rid === 0 || Number(rid) < 1000) {
        try {
          const q = s.q || s.titulo
          const sr = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`)
          const sj = await sr.json()
          if (sj?.[0]?.show?.id) rid = sj[0].show.id
        } catch {}
      }

      try {
        const [showRes, seasonsRes, epsRes] = await Promise.all([
          fetch(`https://api.tvmaze.com/shows/${rid}`),
          fetch(`https://api.tvmaze.com/shows/${rid}/seasons`),
          fetch(`https://api.tvmaze.com/shows/${rid}/episodes`)
        ])
        const show = await showRes.json()
        const seasons = await seasonsRes.json()
        const episodes = await epsRes.json()
        if (show?.name) {
          s = {...s, id, realId: rid, titulo: show.name, ano: show.premiered?.slice(0,4) || "", img: show.image?.original || show.image?.medium || s.img, banner: show.image?.original || s.img }
          setSerie(s)
        }
        const mapa = {}
        if (Array.isArray(seasons)) seasons.forEach(se => { mapa[se.number] = { numero: se.number, eps: [] } })
        if (Array.isArray(episodes)) episodes.forEach(ep => { if (!mapa[ep.season]) mapa[ep.season] = { numero: ep.season, eps: [] }; mapa[ep.season].eps.push({ id: ep.id, numero: ep.number, nome: ep.name }) })
        const lista = Object.values(mapa).sort((a,b)=>a.numero-b.numero)
        setTemporadas(lista.length? lista : [{ numero:1, eps: Array.from({length:10},(_,i)=>({id:`${rid}-${i+1}`, numero:i+1, nome:`Episódio ${i+1}`})) }])
        setAberta(lista[0]?.numero || 1)
      } catch {
        const fake = [1,2,3].map(n => ({ numero: n, eps: Array.from({length:10}, (_,i)=>({ id: `${rid}-${n}-${i+1}`, numero: i+1, nome: `Episódio ${i+1}` })) }))
        setTemporadas(fake); setAberta(1)
      }
      setLoading(false)
    }
    run()
  }, [id])

  const toggleEp = (eid) => {
    let novo = epsVistos.includes(eid)? epsVistos.filter(x=>x!==eid) : [...epsVistos, eid]
    setEpsVistos(novo); localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }
  const maratonarTemp = (temp) => {
    const ids = temp.eps.map(e=>e.id)
    const todos = ids.every(i=>epsVistos.includes(i))
    let novo = todos? epsVistos.filter(i=>!ids.includes(i)) : [...new Set([...epsVistos,...ids])]
    setEpsVistos(novo); localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }

  const abandonar = () => {
    if (!confirm(`Abandonar "${serie?.titulo}"? Seu progresso será apagado.`)) return
    const lista = JSON.parse(localStorage.getItem(userId+":minhas-series")||"[]")
    const nova = lista.filter(s=> String(s.id)!== String(id))
    localStorage.setItem(userId+":minhas-series", JSON.stringify(nova))
    localStorage.removeItem(userId+":status-"+id)
    localStorage.removeItem(userId+":eps-"+id)
    localStorage.removeItem(userId+":serie-atual")
    window.location.href = "/"
  }

  const totalEps = useMemo(()=> temporadas.reduce((a,t)=>a+t.eps.length,0), [temporadas])
  const progresso = totalEps? Math.round((epsVistos.length/totalEps)*100) : 0
  if (!serie) return null

  return (
    <div style={{ minHeight: "100vh", background: "#080B1F", color: "#fff" }}>
      <div style={{ height: 300, position: "relative" }}>
        <img src={serie.banner || serie.img} style={{ width:"100%", height:"100%", objectFit:"cover", background:"#12182F" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, #00000030, #080B1F 95%)" }} />
        {/* Botão voltar */}
        <button onClick={()=>history.back()} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#0009", border:"1px solid #ffffff22", color:"#fff", cursor:"pointer" }}>‹</button>
        {/* BOTÃO ABANDONAR VERMELHO NO CANTO SUPERIOR DIREITO */}
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"7px 12px", borderRadius:999, background:"#ef4444", border:"1px solid #ef444499", color:"#fff", fontSize:11, fontWeight:900, cursor:"pointer", letterSpacing:.3, boxShadow:"0 4px 12px #0008" }}>Abandonar</button>

        <div style={{ position:"absolute", bottom:-22, left:16, display:"flex", gap:12, alignItems:"flex-end", right:16 }}>
          <img src={serie.img} style={{ width:90, height:135, borderRadius:12, objectFit:"cover", border:"2px solid #ffffff18", background:"#12182F" }} />
          <div style={{ flex:1, paddingBottom:6 }}>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900 }}>{serie.titulo}</h1>
            <div style={{ fontSize:11, opacity:.6, marginTop:4 }}>{loading? "carregando...": `${temporadas.length} temp • ${epsVistos.length}/${totalEps} vistos • ${progresso}%`}</div>
            <div style={{ height:4, background:"#ffffff1a", borderRadius:99, marginTop:8 }}><div style={{ width:progresso+"%", height:"100%", background:"#FFD400", borderRadius:99 }} /></div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"38px 14px 14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
          {[{id:"assistindo",l:"Assistindo"},{id:"quero_assistir",l:"Quero Assistir"},{id:"maratonei",l:"Maratonei"}].map(b=>{
            const ativo = status===b.id
            return <button key={b.id} onClick={()=>{setStatus(b.id); localStorage.setItem(userId+":status-"+id,b.id); const lista = JSON.parse(localStorage.getItem(userId+":minhas-series")||"[]"); const nova = lista.map(s=> String(s.id)===id? {...s,status:b.id}:s); localStorage.setItem(userId+":minhas-series", JSON.stringify(nova)) }} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, border: ativo?"1px solid #FFD400":"1px solid #ffffff12", background: ativo? "#FFD400":"#12182F", color: ativo? "#000":"#fff", cursor:"pointer" }}>{b.l}</button>
          })}
        </div>

        <div style={{ background:"#12182F", border:"1px solid #ffffff0e", borderRadius:16, padding:12 }}>
          <b style={{ fontSize:13 }}>Temporadas e Episódios {loading?"":`• ${temporadas.length} temporadas`}</b>
          {temporadas.map(t=>{
            const vistos = t.eps.filter(e=>epsVistos.includes(e.id)).length
            const aberto = aberta===t.numero
            return (
              <div key={t.numero} style={{ borderTop:"1px solid #ffffff08", marginTop:10, paddingTop:10 }}>
                <div onClick={()=>setAberta(aberto? null : t.numero)} style={{ display:"flex", justifyContent:"space-between", cursor:"pointer", alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>Temporada {t.numero} <span style={{ fontSize:11, background:"#ffffff12", padding:"2px 6px", borderRadius:99 }}>{vistos}/{t.eps.length}</span></span>
                  <button onClick={(e)=>{e.stopPropagation(); maratonarTemp(t)}} style={{ fontSize:10, padding:"4px 8px", borderRadius:99, border:"1px solid #FFD40040", background: vistos===t.eps.length?"#22c55e":"#FFD40018", color: vistos===t.eps.length?"#fff":"#FFD400", cursor:"pointer" }}>{vistos===t.eps.length?"Desmarcar":"Maratonar tudo"}</button>
                </div>
                {aberto && <div style={{ marginTop:8, display:"grid", gap:6 }}>
                  {t.eps.map(ep=>{
                    const ok = epsVistos.includes(ep.id)
                    return <div key={ep.id} onClick={()=>toggleEp(ep.id)} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 10px", borderRadius:10, background: ok?"#ffffff0b":"transparent", border:"1px solid "+(ok?"#22c55e40":"#ffffff08"), cursor:"pointer" }}>
                      <div style={{ width:18, height:18, borderRadius:5, border:"1.5px solid "+(ok?"#22c55e":"#ffffff30"), background: ok?"#22c55e":"transparent", display:"grid", placeItems:"center", fontSize:10, color:"#fff" }}>{ok?"✓":""}</div>
                      <div style={{ flex:1, fontSize:13 }}>{ep.numero}. {ep.nome}</div>
                      <div style={{ fontSize:10, opacity:.4 }}>{ok?"Visto":"Marcar"}</div>
                    </div>
                  })}
                </div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
