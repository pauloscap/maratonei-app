"use client"
import { useEffect, useState, useMemo } from "react"
import { getSupa } from "../../lib/supabase";
import { BottomNav } from "../../components/BottomNav"

const supabase = getSupa();
  }
  function CardLista({s, isDeixado}){
    const cor = isDeixado? "#f97316" : s.status==="maratonei"? "#22c55e" : s.status==="quero_assistir"? "#8b5cf6" : "#FFD400"
    return (
      <div onClick={()=> isDeixado? resgatarSerie(s) : abrir(s)} style={{ display:"flex", gap:12, padding:10, background: isDeixado? "#1a140f" : "#12182F", border: isDeixado? "1px solid #f9731633" : "1px solid rgba(255,255,255,0.08)", borderRadius:12, cursor:"pointer", alignItems:"center" }}>
        <div style={{ width:52, height:78, minWidth:52, borderRadius:8, overflow:"hidden", position:"relative" }}>
          <img src={s.img} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
          {s.status!== "quero_assistir" && s.status!=="" && (<div style={{ position:"absolute", bottom:0, left:0, right:0, height:4, background:"rgba(255,255,255,0.25)" }}><div style={{ height:"100%", width: s.progresso + "%", background: cor }} /></div>)}
        </div>
        <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{s.titulo}</div><div style={{ fontSize:11, opacity:0.6 }}>{s.epsVistos}/{s.totalEps || "?"} • {s.progresso}% {isDeixado? `• parado há ${Math.floor((Date.now()-new Date(s.updated_at).getTime())/(1000*60*60*24))} dias` : ""}</div>{isDeixado && <div style={{fontSize:10, color:"#f97316", fontWeight:800, marginTop:2}}>Toque para resgatar</div>}</div>
        <button onClick={(e)=>{ e.stopPropagation(); removerDefinitivo(s.id, s.titulo)}} style={{background:"#ef444422", border:"1px solid #ef4444", color:"#ef4444", borderRadius:8, padding:"6px 10px", fontSize:10, fontWeight:800}}>REMOVER</button>
      </div>
    )
  }

  function Secao({titulo, cor, qtd, children, destaque, idSecao}){
    const [expandido, setExpandido] = useState(false)
    useEffect(()=>{
      const saved = localStorage.getItem(userId+":sec-serie-"+idSecao)
      if(saved==="1") setExpandido(true)
    },[userId])
    function toggleExpand(){
      const novo=!expandido
      setExpandido(novo)
      localStorage.setItem(userId+":sec-serie-"+idSecao, novo?"1":"0")
    }
    const arr = Array.isArray(children)? children : [children].filter(Boolean)
    const listaFlat = arr.flat().filter(Boolean)
    const visiveis = expandido? listaFlat : listaFlat.slice(0,6)
    const precisaBotao = qtd > 6

    return (
      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:14, background:cor, borderRadius:99 }} />
            <b style={{ fontSize:14, fontFamily:"Sora,sans-serif" }}>{titulo}</b>
            <span style={{ fontSize:11, opacity:0.4 }}>- {qtd}</span>
            {destaque && qtd>0 && <span style={{fontSize:9, background:"#f9731622", color:"#f97316", padding:"2px 6px", borderRadius:99, fontWeight:800, border:"1px solid #f9731633"}}>PRECISA DE ATENÇÃO</span>}
          </div>
          {precisaBotao && (
            <button onClick={toggleExpand} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.14)",color:"#fff",borderRadius:999,padding:"5px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>
              {expandido? "Recolher" : `Ver todos (${qtd}) ›`}
            </button>
          )}
        </div>
        {qtd===0? (
          <div style={{background:"#12182F", border:"1px dashed rgba(255,255,255,0.12)", borderRadius:12, padding:"18px 14px", textAlign:"center"}}>
            <div style={{fontSize:11, opacity:0.35}}>{titulo==="Deixei de lado"? "Nenhuma série abandonada 🎉" : `Nenhuma série em ${titulo.toLowerCase()}`}</div>
          </div>
        ) : view==="grade"? <div className="grid-responsive">{visiveis}</div> : <div style={{ display:"grid", gap:8 }}>{expandido? listaFlat : listaFlat.slice(0,6)}</div>}
      </div>
    )
  }

  if(loading) return <div style={{minHeight:"100vh", background:"#0A0F2A", display:"grid", placeItems:"center", color:"#fff"}}>Sincronizando...</div>

  return (
    <div style={{ minHeight:"100vh", background:"#0A0F2A", color:"#fff", paddingBottom:90 }}>
      <style>{`.grid-responsive{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(min-width:480px){.grid-responsive{grid-template-columns:repeat(4,1fr)}}@media(min-width:768px){.grid-responsive{grid-template-columns:repeat(5,1fr);gap:14px}}@media(min-width:1024px){.grid-responsive{grid-template-columns:repeat(6,1fr);gap:16px}}.card-grade{cursor:pointer;display:flex;flex-direction:column;width:100%}.poster-wrap{width:100%;height:0;padding-bottom:150%;position:relative;border-radius:12px;overflow:hidden;background:#12182F;border:1px solid rgba(255,255,255,0.08)}.poster-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.badge{position:absolute;top:6px;left:6px;background:#FFD400;color:#000;font-size:8px;font-weight:900;padding:3px 6px;border-radius:6px}.progress-track{position:absolute;bottom:0;left:0;right:0;height:5px;background:rgba(255,255,255,0.22);z-index:2}.progress-fill{height:100%;transition:width 0.3s}.titulo{font-size:11.5px;font-weight:700;margin-top:7px;line-height:1.25;height:28px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}`}</style>
      <header style={{ height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, background:"rgba(10,15,42,0.92)", backdropFilter:"blur(12px)", zIndex:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><img src="/icon-192.png" alt="maratonei" style={{ width:32, height:32, borderRadius:8 }} /><b style={{ fontFamily:"Sora,sans-serif", fontWeight:900, fontSize:16 }}>maratonei</b></div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><button onClick={toggleView} style={{ background:"#121A3A", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", borderRadius:8, padding:"6px 10px", fontSize:11, cursor:"pointer", height:32, fontWeight:700 }}>{view==="grade"? "Lista" : "Grade"}</button><button onClick={function(){ window.location.href="/perfil" }} style={{ width:36, height:36, borderRadius:999, overflow:"hidden", border:"1.5px solid #FFD40055", background:"#121B3A", display:"grid", placeItems:"center", cursor:"pointer", padding:0 }}>{userFoto? <img src={userFoto} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/> : <span style={{ fontWeight:900, fontSize:12, color:"#FFD400" }}>{userInicial}</span>}</button></div>
      </header>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:14, position:"relative" }}>
        <div style={{ background:"#121A3A", border:"1px solid rgba(255,255,255,0.08)", borderRadius:999, display:"flex", alignItems:"center", padding:"0 14px", height:42, maxWidth:420, margin:"0 auto" }}><span style={{ opacity:0.4, marginRight:8 }}>⌕</span><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar série para adicionar..." style={{ flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13 }} />{busca && <span onClick={()=>setBusca("")} style={{ cursor:"pointer", opacity:0.5 }}>✕</span>}</div>
        {busca && <div style={{ position:"absolute", top:62, left:14, right:14, maxWidth:420, margin:"0 auto", background:"#12182F", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, zIndex:50, overflow:"hidden" }}>{resultados.map(r=> (<div key={r.id} onClick={()=>adicionarSerie(r)} style={{ display:"flex", gap:10, padding:10, borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer" }}><img src={r.img} style={{ width:44, height:66, borderRadius:8, objectFit:"cover" }} alt="" /><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800 }}>{r.titulo}</div><div style={{ fontSize:10, opacity:0.4 }}>{r.ano}</div><div style={{ fontSize:10, color:"#FFD400", fontWeight:800, marginTop:4 }}>+ ADICIONAR</div></div></div>))}</div>}
        {!busca && <>
          <Secao titulo="Assistindo" cor="#FFD400" qtd={assistindo.length} idSecao="assistindo">{assistindo.map(s=> view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/>)}</Secao>
          <Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={queroAssistir.length} idSecao="quero">{queroAssistir.map(s=> view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/>)}</Secao>
          <Secao titulo="Deixei de lado" cor="#f97316" qtd={deixeiDeLado.length} destaque={true} idSecao="deixei">{deixeiDeLado.map(s=> view==="grade"? <CardGrade key={s.id} s={s} isDeixado={true}/> : <CardLista key={s.id} s={s} isDeixado={true}/>)}</Secao>
          <Secao titulo="Maratonei" cor="#22c55e" qtd={maratonei.length} idSecao="maratonei">{maratonei.map(s=> view==="grade"? <CardGrade key={s.id} s={s}/> : <CardLista key={s.id} s={s}/>)}</Secao>
        </>}
      </div><BottomNav />
    </div>
  )
}
