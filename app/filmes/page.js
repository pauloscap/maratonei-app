"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w342"

export default function FilmesPage() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [filmes, setFilmes] = useState([])
  const [resultados, setResultados] = useState([])
  const [view, setView] = useState("grade")
  const [msg, setMsg] = useState("")
  const [userFoto, setUserFoto] = useState("")
  const [userInicial, setUserInicial] = useState("M")

  useEffect(() => {
    async function init() {
      const s = await supabase.auth.getSession()
      if (!s.data.session) { window.location.href="/login"; return }
      const uid = s.data.session.user.id
      const u = s.data.session.user
      setUserId(uid)
      setUserFoto(u.user_metadata?.avatar_url || "")
      setUserInicial((u.user_metadata?.full_name || u.email || "M")[0].toUpperCase())
      const v = localStorage.getItem(uid + ":view-filmes")
      if (v) setView(v)

      const { data: doSupabase } = await supabase.from("user_filmes").select("*").eq("user_id", uid)
      let listaBase = []
      if (doSupabase && doSupabase.length > 0) {
        listaBase = doSupabase.map(r=>({
          id: String(r.filme_id),
          titulo: r.titulo,
          img: r.img,
          status: r.status,
          ano: r.ano || "0000",
          updated_at: r.updated_at
        }))
      } else {
        const raw = localStorage.getItem(uid + ":meus-filmes")
        listaBase = raw? JSON.parse(raw) : []
      }

      // CORRIGE ANOS 0000 BUSCANDO NA TMDB
      const precisaCorrigir = listaBase.filter(f=>!f.ano || f.ano==="0000")
      if(precisaCorrigir.length>0){
        for(let f of precisaCorrigir){
          try{
            const isImdb = f.id.startsWith("tt")
            let url = ""
            if(isImdb){
              url = `https://api.themoviedb.org/3/find/${f.id}?api_key=${TMDB_KEY}&external_source=imdb_id&language=pt-BR`
              const r = await fetch(url).then(x=>x.json())
              const movie = r.movie_results?.[0]
              if(movie?.release_date){
                const novoAno = movie.release_date.slice(0,4)
                f.ano = novoAno
                await supabase.from("user_filmes").update({ano: novoAno}).eq("user_id", uid).eq("filme_id", f.id)
              }
            } else {
              url = `https://api.themoviedb.org/3/movie/${f.id}?api_key=${TMDB_KEY}&language=pt-BR`
              const r = await fetch(url).then(x=>x.json())
              if(r?.release_date){
                const novoAno = r.release_date.slice(0,4)
                f.ano = novoAno
                await supabase.from("user_filmes").update({ano: novoAno}).eq("user_id", uid).eq("filme_id", f.id)
              }
            }
          }catch{}
        }
        localStorage.setItem(uid + ":meus-filmes", JSON.stringify(listaBase))
      }

      setFilmes(listaBase)
    }
    init()
  }, [])

  async function buscarFilmes(q){
    const termo = q.trim()
    const urls = [
      "https://api.themoviedb.org/3/search/movie?api_key="+TMDB_KEY+"&language=pt-BR&query="+encodeURIComponent(termo),
      "https://api.themoviedb.org/3/search/movie?api_key="+TMDB_KEY+"&language=en-US&query="+encodeURIComponent(termo)
    ]
    for(let url of urls){
      try{
        const r = await fetch(url)
        const j = await r.json()
        if(j.results?.length) return j.results.slice(0,10).map(m=>({
          id:String(m.id),
          titulo: m.title || m.original_title,
          ano: m.release_date? m.release_date.slice(0,4) : "0000",
          img: m.poster_path? TMDB_IMG+m.poster_path : "https://picsum.photos/seed/"+m.id+"/400/600"
        }))
      }catch{ continue }
    }
    return []
  }

  useEffect(function(){
    if(!busca.trim()){ setResultados([]); setMsg(""); return }
    const t=setTimeout(async function(){
      setMsg("Buscando...")
      const res = await buscarFilmes(busca)
      setResultados(res)
      setMsg(res.length?"":"Nenhum resultado")
    },350)
    return function(){ clearTimeout(t) }
  },[busca])

  function toggle(){ const n=view==="grade"?"lista":"grade"; setView(n); localStorage.setItem(userId+":view-filmes",n) }

  function abrir(f){
    localStorage.setItem(userId+":filme-atual", JSON.stringify(f));
    window.location.href="/filme/"+f.id
  }

  const { quero, vistos } = useMemo(()=>{
    const ordenar = (a,b)=>{
      const anoA = parseInt(String(a.ano||"0").substring(0,4)) || 0
      const anoB = parseInt(String(b.ano||"0").substring(0,4)) || 0
      return anoB - anoA
    }
    const q = [...filmes].filter(x=>x.status==="quero_assistir").sort(ordenar)
    const v = [...filmes].filter(x=>x.status==="ja_assisti").sort(ordenar)
    return { quero: q, vistos: v }
  }, [filmes])

  function Secao(p){ return <div style={{marginTop:24}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}><div style={{width:3,height:14,background:p.cor,borderRadius:99}}/><b style={{fontSize:14}}>{p.titulo}</b><span style={{fontSize:11,opacity:0.4}}> - {p.qtd}</span></div>{p.qtd===0? (
          <div style={{background:"#12182F", border:"1px dashed rgba(255,255,255,0.12)", borderRadius:12, padding:"18px 14px", textAlign:"center"}}>
            <div style={{fontSize:11, opacity:0.35}}>Nenhum filme em {p.titulo.toLowerCase()}</div>
          </div>
        ) : view==="grade"? <div className="grid">{p.children}</div> : <div className="list">{p.children}</div>}</div> }

  return (
    <div style={{minHeight:"100vh",background:"#0A0F2A",color:"#fff",paddingBottom:90}}>
      <style>{`
 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
 .list{display:grid;gap:8px}
 .card{cursor:pointer;display:flex;flex-direction:column;width:100%}
 .poster{width:100%;height:0;padding-bottom:150%;position:relative;border-radius:12px;overflow:hidden;background:#12182F;border:1px solid rgba(255,255,255,0.08)}
 .poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
 .badge{position:absolute;top:6px;left:6px;background:#FFD400;color:#000;font-size:8px;font-weight:900;padding:3px 6px;border-radius:6px;z-index:2}
 .tit{font-size:11.5px;font-weight:700;margin-top:7px;line-height:1.25;height:28px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
 .row{display:flex;gap:12px;padding:10px;background:#12182F;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;align-items:center}
 .row img{width:48px;height:72px;min-width:48px;border-radius:8px;object-fit:cover;background:#000}
      `}</style>

      <header style={{height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:0,background:"rgba(10,15,42,0.92)",backdropFilter:"blur(12px)",zIndex:20}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <img src="/icon-192.png" alt="maratonei" style={{width:32,height:32,borderRadius:8}}/>
          <b style={{fontWeight:900,fontSize:16}}>maratonei</b>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={toggle} style={{background:"#121A3A",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"6px 10px",fontSize:11,height:32,fontWeight:700}}>{view==="grade"?"Lista":"Grade"}</button>
          <button onClick={()=>window.location.href="/perfil"} style={{width:36,height:36,borderRadius:999,overflow:"hidden",border:"1.5px solid #FFD40055",background:"#121B3A",display:"grid",placeItems:"center",cursor:"pointer",padding:0}}>
            {userFoto? <img src={userFoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontWeight:900,fontSize:12,color:"#FFD400"}}>{userInicial}</span>}
          </button>
        </div>
      </header>

      <div style={{maxWidth:1280,margin:"0 auto",padding:14,position:"relative"}}>
        <div style={{background:"#121A3A",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,display:"flex",alignItems:"center",padding:"0 14px",height:42,maxWidth:420,margin:"0 auto"}}>
          <span style={{opacity:0.4,marginRight:8}}>⌕</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar filme" style={{flex:1,background:"transparent",border:0,outline:"none",color:"#fff",fontSize:13}}/>
          {busca&&<span onClick={()=>{setBusca("");setResultados([])}} style={{cursor:"pointer",opacity:0.5}}>✕</span>}
        </div>

        {busca&&<div style={{position:"absolute",top:62,left:14,right:14,maxWidth:420,margin:"0 auto",background:"#12182F",border:"1px solid rgba(255,255,255,0.12)",borderRadius:16,zIndex:50,overflow:"hidden",boxShadow:"0 20px 40px rgba(0,0,0,0.5)"}}>
          {resultados.map(r=><div key={r.id} onClick={()=>abrir(r)} style={{display:"flex",gap:10,padding:10,borderBottom:"1px solid rgba(255,255,255,0.06)",cursor:"pointer"}}><img src={r.img} style={{width:40,height:60,borderRadius:6,objectFit:"cover"}} alt=""/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{r.titulo} ({r.ano})</div><div style={{fontSize:10,color:"#FFD400",fontWeight:800,marginTop:4}}>VER DETALHES ›</div></div></div>)}
          {msg&&<div style={{padding:12,fontSize:12,opacity:0.5}}>{msg}</div>}
        </div>}

        {!busca&&<div>
          <Secao titulo="Quero Assistir" cor="#8b5cf6" qtd={quero.length}>
            {quero.map(s=><div key={s.id} onClick={()=>abrir(s)} className={view==="grade"?"card":"row"}>{view==="grade"?<><div className="poster"><img src={s.img} alt=""/><div className="badge">{s.ano}</div></div><div className="tit">{s.titulo}</div></>:<><img src={s.img} alt=""/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800}}>{s.titulo}</div><div style={{fontSize:11,opacity:0.5}}>{s.ano}</div></div><span style={{opacity:0.3}}>›</span></>}</div>)}
          </Secao>
          <Secao titulo="Ja Assisti" cor="#22c55e" qtd={vistos.length}>
            {vistos.map(s=><div key={s.id} onClick={()=>abrir(s)} className={view==="grade"?"card":"row"}>{view==="grade"?<><div className="poster"><img src={s.img} alt=""/><div className="badge" style={{background:"#22c55e",color:"#fff"}}>{s.ano}</div></div><div className="tit">{s.titulo}</div></>:<><img src={s.img} alt=""/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800}}>{s.titulo}</div><div style={{fontSize:11,opacity:0.5}}>{s.ano}</div></div><span style={{opacity:0.3}}>›</span></>}</div>)}
          </Secao>
        </div>}
      </div>

      <BottomNav/>
    </div>
  )
}
