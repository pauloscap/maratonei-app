"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

// Mapa de posters reais pra não depender do que veio da Home
const POSTERS = {
  "101": "https://image.tmdb.org/t/p/w500/5K7yB7Q5Q5Q5Q5.jpg",
  "102": "https://image.tmdb.org/t/p/w500/8y8y8y8y8y.jpg",
  "default": "https://picsum.photos/seed/maratonei/500/750"
}

export default function DetalheSerie({ params }){
  const id = String(params.id)
  const [userId,setUserId]=useState("anon")
  const [serie,setSerie]=useState(null)
  const [status,setStatus]=useState("assistindo")
  const [epsMarcados,setEpsMarcados]=useState([])
  const [tempAberta,setTempAberta]=useState(1)
  const [imgErro,setImgErro]=useState(false)

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const uid = session.user.id; setUserId(uid)

      let s = null
      try{
        const raw = localStorage.getItem(`${uid}:serie-atual`)
        if(raw) s = JSON.parse(raw)
      }catch{}

      if(!s || String(s.id)!==id){
        // se entrou direto ou o localStorage tá vazio, cria na hora com imagem que funciona
        s = {
          id,
          titulo: id==="101"?"Abbott Elementary":`Série #${id}`,
          ano:"2021",
          sinopse:"Acompanhe os professores de Abbott Elementary enquanto equilibram trabalho e vida pessoal.",
          poster: POSTERS[id] || POSTERS.default,
          banner: POSTERS[id] || POSTERS.default,
          img: POSTERS[id] || POSTERS.default,
        }
      }
      setSerie(s)
      setStatus(localStorage.getItem(`${uid}:status-${id}`) || s.status || "assistindo")
      setEpsMarcados(JSON.parse(localStorage.getItem(`${uid}:eps-${id}`)||"[]"))
    })()
  },[id])

  const toggleEp = (epId)=>{
    const novo = epsMarcados.includes(epId)? epsMarcados.filter(e=>e!==epId) : [...epsMarcados, epId]
    setEpsMarcados(novo); localStorage.setItem(`${userId}:eps-${id}`, JSON.stringify(novo))
  }
  const maratonarTemporada = (t)=>{
    const eps = Array.from({length:10},(_,i)=>`${t}-${i+1}`)
    const todos = eps.every(e=>epsMarcados.includes(e))
    const novo = todos? epsMarcados.filter(e=>!eps.includes(e)) : [...new Set([...epsMarcados,...eps])]
    setEpsMarcados(novo); localStorage.setItem(`${userId}:eps-${id}`, JSON.stringify(novo))
  }

  if(!serie) return null
  const poster = imgErro? `https://picsum.photos/seed/${id}/400/600` : (serie.poster || serie.banner || serie.img)
  const banner = poster
  const progresso = Math.round((epsMarcados.length/30)*100)

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff"}}>
      <div style={{height:300, position:"relative"}}>
        <img src={banner} onError={()=>setImgErro(true)} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
        <div style={{position:"absolute", inset:0, background:"linear-gradient(180deg, #00000040, #080B1F 95%)"}}/>
        <button onClick={()=>history.back()} style={{position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"#0009", border:"1px solid #ffffff22", color:"#fff"}}>‹</button>
        <div style={{position:"absolute", bottom:-20, left:16, display:"flex", gap:12, alignItems:"flex-end", right:16}}>
          <img src={poster} onError={()=>setImgErro(true)} style={{width:92, height:138, borderRadius:12, border:"2px solid #ffffff18", objectFit:"cover", background:"#12182F"}}/>
          <div style={{flex:1, paddingBottom:10}}>
            <h1 style={{margin:0, fontSize:18, fontWeight:900}}>{serie.titulo}</h1>
            <div style={{fontSize:11, opacity:.6, marginTop:3}}>{epsMarcados.length} episódios vistos • {progresso}%</div>
            <div style={{height:4, background:"#ffffff1a", borderRadius:99, marginTop:8}}><div style={{width:progresso+"%", height:"100%", background:"#FFD400", borderRadius:99}}/></div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:680, margin:"0 auto", padding:"36px 14px 14px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
          {[{id:"assistindo",l:"Assistindo"},{id:"ja_assisti",l:"Já Assisti"},{id:"maratonei",l:"Maratonei"}].map(b=>{
            const a=status===b.id
            return <button key={b.id} onClick={()=>{setStatus(b.id);localStorage.setItem(`${userId}:status-${id}`,b.id)}} style={{padding:"11px", borderRadius:12, fontWeight:800, fontSize:12, border: a?"1px solid #FFD400":"1px solid #ffffff12", background: a?"#FFD400":"#12182F", color: a?"#000":"#fff"}}>{b.l}</button>
          })}
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff0e", borderRadius:16, padding:12}}>
          <b style={{fontSize:13}}>Temporadas e Episódios</b>
          {[1,2,3].map(t=>{
            const aberto=tempAberta===t
            const vistos=Array.from({length:10},(_,i)=>`${t}-${i+1}`).filter(e=>epsMarcados.includes(e)).length
            return(
              <div key={t} style={{borderTop:"1px solid #ffffff08", marginTop:10, paddingTop:10}}>
                <div onClick={()=>setTempAberta(aberto?0:t)} style={{display:"flex", justifyContent:"space-between", cursor:"pointer"}}>
                  <span style={{fontSize:13, fontWeight:700}}>Temporada {t} <span style={{fontSize:11, background:"#ffffff12", padding:"2px 6px", borderRadius:99}}>{vistos}/10</span></span>
                  <button onClick={(e)=>{e.stopPropagation();maratonarTemporada(t)}} style={{fontSize:10, padding:"4px 8px", borderRadius:99, border:"1px solid #FFD40040", background: vistos===10?"#22c55e":"#FFD40018", color: vistos===10?"#fff":"#FFD400"}}>{vistos===10?"Desmarcar":"Maratonar tudo"}</button>
                </div>
                {aberto && <div style={{marginTop:8, display:"grid", gap:6}}>
                  {Array.from({length:10},(_,i)=>i+1).map(ep=>{
                    const eid=`${t}-${ep}`; const ok=epsMarcados.includes(eid)
                    return <div key={eid} onClick={()=>toggleEp(eid)} style={{display:"flex", gap:10, alignItems:"center", padding:"8px 10px", borderRadius:10, background: ok?"#ffffff0b":"transparent", border:"1px solid "+(ok?"#ffffff14":"#ffffff06"), cursor:"pointer"}}>
                      <div style={{width:18,height:18,borderRadius:5,border:"1.5px solid "+(ok?"#22c55e":"#ffffff30"), background: ok?"#22c55e":"transparent", display:"grid", placeItems:"center", fontSize:10, color:"#fff"}}>{ok?"✓":""}</div>
                      <div style={{flex:1, fontSize:13}}>Episódio {ep}</div><div style={{fontSize:10, opacity:.4}}>{ok?"Visto":"Marcar"}</div>
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
