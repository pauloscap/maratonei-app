"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function DetalheSerie({ params }){
  const id = params.id
  const [userId,setUserId]=useState("anon")
  const [serie,setSerie]=useState(null)
  const [status,setStatus]=useState("assistindo")
  const [epsMarcados,setEpsMarcados]=useState([])
  const [tempAberta,setTempAberta]=useState(1)

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const uid = session.user.id
      setUserId(uid)

      const raw = localStorage.getItem(`${uid}:serie-atual`)
      const s = raw? JSON.parse(raw) : { id, titulo:`Série #${id}`, ano:"2024", img:"", sinopse:"Sinopse da série carregada automaticamente. Adicione temporadas e marque seus episódios." }
      setSerie(s)

      const st = localStorage.getItem(`${uid}:status-${id}`)
      if(st) setStatus(st)

      const eps = JSON.parse(localStorage.getItem(`${uid}:eps-${id}`)||"[]")
      setEpsMarcados(eps)
    })()
  },[id])

  const toggleEp = (epId)=>{
    const key = `${userId}:eps-${id}`
    let novo
    if(epsMarcados.includes(epId)){ novo = epsMarcados.filter(e=>e!==epId) }
    else { novo = [...epsMarcados, epId] }
    setEpsMarcados(novo)
    localStorage.setItem(key, JSON.stringify(novo))

    // ganha XP por episódio
    const xpKey = `${userId}:xp-total`
    localStorage.setItem(xpKey, String(parseInt(localStorage.getItem(xpKey)||"0")+10))
  }

  const maratonarTemporada = (temp)=>{
    const epsDaTemp = Array.from({length:10},(_,i)=>`${temp}-${i+1}`)
    const todosMarcados = epsDaTemp.every(ep=>epsMarcados.includes(ep))
    let novo
    if(todosMarcados){ novo = epsMarcados.filter(e=>!epsDaTemp.includes(e)) }
    else { novo = [...new Set([...epsMarcados,...epsDaTemp])] }
    setEpsMarcados(novo)
    localStorage.setItem(`${userId}:eps-${id}`, JSON.stringify(novo))
  }

  const mudarStatusGeral = (novo)=>{
    setStatus(novo)
    localStorage.setItem(`${userId}:status-${id}`, novo)
    if(novo==="maratonei"){
      // marca tudo como visto
      const todos = Array.from({length:3},(_,t)=>Array.from({length:10},(_,e)=>`${t+1}-${e+1}`)).flat()
      setEpsMarcados(todos)
      localStorage.setItem(`${userId}:eps-${id}`, JSON.stringify(todos))
    }
  }

  if(!serie) return <div style={{background:"#0A0F2A", minHeight:"100vh", display:"grid", placeItems:"center", color:"#fff"}}>Carregando...</div>

  const banner = serie.img || serie.tmdb || `https://picsum.photos/seed/banner${id}/1200/600`
  const progresso = Math.round((epsMarcados.length/30)*100)

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:40}}>
      {/* BANNER */}
      <div style={{height:280, position:"relative", overflow:"hidden"}}>
        <img src={banner} style={{width:"100%", height:"100%", objectFit:"cover", opacity:.6}}/>
        <div style={{position:"absolute", inset:0, background:"linear-gradient(180deg, #00000020 0%, #080B1F 95%)"}}/>
        <button onClick={()=>history.back()} style={{position:"absolute", top:14, left:14, width:32, height:32, borderRadius:999, background:"#00000080", border:"1px solid #ffffff20", color:"#fff", backdropFilter:"blur(6px)"}}>‹</button>
        <div style={{position:"absolute", bottom:0, left:0, right:0, padding:"0 16px 16px", display:"flex", gap:14, alignItems:"flex-end"}}>
          <img src={banner} style={{width:96, height:144, borderRadius:12, border:"2px solid #ffffff20", objectFit:"cover"}}/>
          <div style={{flex:1, paddingBottom:6}}>
            <h1 style={{fontSize:20, fontWeight:900, margin:"0 0 4px"}}>{serie.titulo}</h1>
            <div style={{fontSize:12, opacity:.6}}>{serie.ano} • {epsMarcados.length} episódios vistos • {progresso}%</div>
            <div style={{height:5, background:"#ffffff18", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"#FFD400"}}/></div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:680, margin:"0 auto", padding:"14px"}}>
        {/* STATUS GERAL */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
          {[
            {id:"assistindo", label:"Assistindo"},
            {id:"ja_assisti", label:"Já Assisti"},
            {id:"maratonei", label:"Maratonei"},
          ].map(b=>{
            const ativo = status===b.id
            return <button key={b.id} onClick={()=>mudarStatusGeral(b.id)} style={{padding:"10px 0", borderRadius:12, fontWeight:800, fontSize:12, border: ativo?"1px solid #FFD400":"1px solid #ffffff15", background: ativo?"#FFD400":"#12182F", color: ativo?"#000":"#fff", cursor:"pointer"}}>{b.label}</button>
          })}
        </div>

        {/* TEMPORADAS */}
        <div style={{background:"#12182F", border:"1px solid #ffffff0f", borderRadius:16, padding:14}}>
          <h3 style={{margin:"0 0 12px", fontSize:14}}>Temporadas e Episódios</h3>
          {[1,2,3].map(temp=>{
            const aberta = tempAberta===temp
            const eps = Array.from({length:10},(_,i)=>i+1)
            const vistosDaTemp = eps.filter(e=>epsMarcados.includes(`${temp}-${e}`)).length
            return(
              <div key={temp} style={{borderBottom:"1px solid #ffffff08", padding:"10px 0"}}>
                <div onClick={()=>setTempAberta(aberta?0:temp)} style={{display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer"}}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}><b style={{fontSize:13}}>Temporada {temp}</b><span style={{fontSize:11, background:"#ffffff12", padding:"2px 6px", borderRadius:99}}>{vistosDaTemp}/10</span></div>
                  <div style={{display:"flex", gap:6, alignItems:"center"}}>
                    <button onClick={(e)=>{e.stopPropagation(); maratonarTemporada(temp)}} style={{fontSize:10, padding:"4px 8px", borderRadius:99, border:"1px solid #FFD40044", background: vistosDaTemp===10?"#22c55e":"#FFD40018", color: vistosDaTemp===10?"#fff":"#FFD400", cursor:"pointer"}}>{vistosDaTemp===10?"Desmarcar":"Maratonar tudo"}</button>
                    <span style={{opacity:.4}}>{aberta?"▲":"▼"}</span>
                  </div>
                </div>
                {aberta && <div style={{marginTop:10, display:"grid", gap:6}}>
                  {eps.map(ep=>{
                    const eid=`${temp}-${ep}`
                    const visto=epsMarcados.includes(eid)
                    return <div key={eid} onClick={()=>toggleEp(eid)} style={{display:"flex", alignItems:"center", gap:10, background: visto?"#ffffff0a":"transparent", border:"1px solid "+(visto?"#ffffff14":"#ffffff06"), borderRadius:10, padding:"8px 10px", cursor:"pointer"}}>
                      <div style={{width:20,height:20,borderRadius:6,border:"1.5px solid "+(visto?"#22c55e":"#ffffff30"), background: visto?"#22c55e":"transparent", display:"grid", placeItems:"center", color:"#fff", fontSize:11}}>{visto?"✓":""}</div>
                      <div style={{flex:1}}><div style={{fontSize:13, fontWeight:600}}>Episódio {ep}</div><div style={{fontSize:11, opacity:.4}}>25 min</div></div>
                      <div style={{fontSize:10, opacity:.3}}>{visto?"Visto":"Marcar"}</div>
                    </div>
                  })}
                </div>}
              </div>
            )
          })}
        </div>

        <div style={{marginTop:12, fontSize:11, opacity:.35, background:"#ffffff06", border:"1px solid #ffffff0a", padding:10, borderRadius:10}}>
          ID individual: {userId.slice(0,8)}... • Progresso salvo como <b>{userId}:eps-{id}</b> então outra pessoa que logar não vê seu progresso.
        </div>
      </div>
    </div>
  )
}
