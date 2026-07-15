"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home(){
 const [series,setSeries]=useState([])
 const [stMap,setStMap]=useState({})
 const [pgMap,setPgMap]=useState({})
 const [q,setQ]=useState("")
 const [res,setRes]=useState([])
 const [ready,setReady]=useState(false)

 async function load(){
  try{
   const {data}=await supa.from("series").select("*").order("created_at",{ascending:false})
   if(data) setSeries(data)
  }catch(e){ console.log(e) }
 }

 function loadLS(list){
  try{
   let s={},p={}
   list.forEach(x=>{
    try{
     let a=localStorage.getItem("status-"+x.id)
     let b=localStorage.getItem("progress-"+x.id)
     if(a) s[x.id]=a
     if(b){ let v=JSON.parse(b); if(Array.isArray(v)) p[x.id]=v }
    }catch{}
   })
   setStMap(s); setPgMap(p)
  }catch{}
 }

 useEffect(()=>{ setReady(true); load() },[])
 useEffect(()=>{ if(ready && series.length) loadLS(series) },[ready, series])

 // FIX QUE REALMENTE FUNCIONA: recarrega a cada volta
 useEffect(()=>{
  if(!ready) return
  const t=setInterval(()=>{ try{ if(series.length) loadLS(series) }catch{} },800)
  const onVis=()=>{ try{ loadLS(series) }catch{} }
  window.addEventListener("focus",onVis); document.addEventListener("visibilitychange",onVis)
  return()=>{ clearInterval(t); window.removeEventListener("focus",onVis); document.removeEventListener("visibilitychange",onVis) }
 },[series,ready])

 async function buscar(v){
  setQ(v); if(v.length<2){ setRes([]); return }
  try{
   let r=await fetch("https://api.themoviedb.org/3/search/tv?api_key="+process.env.NEXT_PUBLIC_TMDB_KEY+"&language=pt-BR&query="+encodeURIComponent(v))
   let j=await r.json(); setRes(j.results?j.results.slice(0,5):[])
  }catch{ setRes([]) }
 }

 async function add(i){
  try{
   let {data:e}=await supa.from("series").select("*").eq("tmdb_id",i.id).maybeSingle()
   let f=e
   if(!e){
    let n={tmdb_id:i.id,titulo:i.name,poster:i.poster_path,ano:i.first_air_date?new Date(i.first_air_date).getFullYear():null}
    let {data:d}=await supa.from("series").insert([n]).select().single(); f=d
   }
   if(!f) return
   localStorage.setItem("status-"+f.id,"quero_assistir")
   localStorage.setItem("progress-"+f.id,"[]")
   let l=[f,...series]; setSeries(l); loadLS(l); setRes([]); setQ("")
  }catch(e){ alert("Erro: "+e.message) }
 }

 if(!ready) return <div style={{background:"#08162e",minHeight:"100vh"}}></div>

 const isM=id=>{ let s=stMap[id]; let p=pgMap[id]||[]; try{return s==="ja_maratonei"||p.indexOf("100%")>=0}catch{return s==="ja_maratonei"} }
 const isA=id=>{ if(isM(id)) return false; let s=stMap[id]; let p=pgMap[id]||[]; try{return s==="assistindo"||p.length>0}catch{return s==="assistindo"} }

 let mar=[],ass=[],que=[]
 series.forEach(s=>{ try{ isM(s.id)?mar.push(s):isA(s.id)?ass.push(s):que.push(s) }catch{} })

 const Card=({s,borda,selo})=>{
  let img = s.poster? "https://image.tmdb.org/t/p/w300"+s.poster : ""
  return(
   <Link href={"/serie/"+s.id} style={{textDecoration:"none",color:"#fff",minWidth:112}}>
    <div style={{width:112,height:164,borderRadius:16,overflow:"hidden",background:"#122042",position:"relative",border:borda?"2px solid #FFD400":"1px solid #ffffff18"}}>
     {img? <img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/> : <div style={{width:"100%",height:"100%",background:"#122042"}}/>}
     {selo && <div style={{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:999,background:"#FFD400",display:"grid",placeItems:"center",color:"#08162e",fontWeight:900,fontSize:12}}>✓</div>}
    </div>
    <div style={{fontSize:12,marginTop:6,maxWidth:112,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.titulo||"Sem título"}</div>
   </Link>
  )
 }

 return(
  <div style={{minHeight:"100vh",background:"#08162e",color:"#fff",paddingBottom:90}}>
   <div style={{height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid #ffffff12",position:"sticky",top:0,background:"#08162e",zIndex:10}}>
    <div style={{display:"flex",alignItems:"center",gap:10,fontWeight:900,fontSize:18}}><div style={{width:32,height:32,borderRadius:999,background:"#FFD400",display:"grid",placeItems:"center",color:"#08162e"}}>M</div>maratonei</div>
    <Link href="/perfil" style={{width:36,height:36,borderRadius:999,background:"#FFD400",display:"grid",placeItems:"center",color:"#08162e",fontWeight:800,textDecoration:"none"}}>P</Link>
   </div>
   <div style={{maxWidth:960,margin:"0 auto",padding:16}}>
    <input value={q} onChange={e=>buscar(e.target.value)} placeholder="Buscar série..." style={{width:"100%",height:46,borderRadius:999,background:"#122042",border:"1px solid #ffffff18",padding:"0 16px",color:"#fff",outline:"none"}}/>
    {res.length>0 && <div style={{marginTop:10,background:"#122042",borderRadius:12}}>{res.map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",borderBottom:"1px solid #ffffff10"}}><span style={{fontSize:14}}>{r.name}</span><button onClick={()=>add(r)} style={{background:"#FFD400",border:0,borderRadius:999,padding:"4px 12px",fontWeight:800,cursor:"pointer"}}>+ Quero</button></div>)}</div>}
    <h3 style={{marginTop:24,fontSize:15,fontWeight:800}}>Estou assistindo</h3>
    <div style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 0"}}>{ass.length?ass.map(s=><Card key={s.id} s={s} borda/>):<div style={{opacity:.4,fontSize:13}}>Nenhuma</div>}</div>
    <h3 style={{marginTop:24,fontSize:15,fontWeight:800}}>Quero Assistir</h3>
    <div style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 0"}}>{que.length?que.map(s=><Card key={s.id} s={s}/>):<div style={{opacity:.4,fontSize:13}}>Busque uma série acima</div>}</div>
    <h3 style={{marginTop:24,fontSize:15,fontWeight:800}}>Já maratonei ✓</h3>
    <div style={{display:"flex",gap:12,overflowX:"auto",padding:"4px 0"}}>{mar.length?mar.map(s=><Card key={s.id} s={s} selo/>):<div style={{opacity:.4,fontSize:13}}>Nenhuma finalizada</div>}</div>
   </div>
  </div>
 )
}
