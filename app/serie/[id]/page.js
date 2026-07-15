"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupa } from "../../../lib/supabase"
const supa = getSupa()

export default function Detalhe(){
 const {id}=useParams(); const router=useRouter()
 const [serie,setSerie]=useState(null); const [prog,setProg]=useState([]); const [st,setSt]=useState("quero_assistir")
 const [tmdb,setTmdb]=useState(null); const [seasons,setSeasons]=useState([]); const [open,setOpen]=useState(1)
 const [epData,setEpData]=useState({}); const [removing,setRemoving]=useState(false)

 useEffect(()=>{ async function l(){
   try{
    let {data}=await supa.from("series").select("*").eq("id",id).single(); if(!data) return
    setSerie(data)
    let a=localStorage.getItem("status-"+id); if(a) setSt(a)
    let b=localStorage.getItem("progress-"+id); if(b){ try{ setProg(JSON.parse(b)) }catch{} }
    if(data.tmdb_id){
     try{
      let r=await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
      let j=await r.json(); setTmdb(j)
      let filt=(j.seasons||[]).filter(s=>s.season_number>0); setSeasons(filt)
      if(filt.length) setOpen(filt[0].season_number)
     }catch{}
    }
   }catch{}
 } if(id) l() },[id])

 async function loadSeason(sn){
  if(epData[sn] ||!serie?.tmdb_id) return
  try{
   let r=await fetch(`https://api.themoviedb.org/3/tv/${serie.tmdb_id}/season/${sn}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
   let j=await r.json(); setEpData(p=>({...p,[sn]:j.episodes||[]}))
  }catch{}
 }
 useEffect(()=>{ if(open) loadSeason(open) },[open])

 function save(n){
  setProg(n); try{ localStorage.setItem("progress-"+id,JSON.stringify(n)); localStorage.setItem("_upd",Date.now()+"") }catch{}
  if(n.length>0 && st==="quero_assistir"){ setSt("assistindo"); try{ localStorage.setItem("status-"+id,"assistindo") }catch{} }
  let total=tmdb?.number_of_episodes||0; if(total>0 && n.filter(x=>x!=="100%").length>=total){ setSt("ja_maratonei"); try{ localStorage.setItem("status-"+id,"ja_maratonei") }catch{} }
 }
 function toggle(s,ep){ let k=s+"-"+ep; let n=prog.indexOf(k)>=0?prog.filter(x=>x!==k):[...prog,k]; save(n) }
 function setStatus(v){ setSt(v); try{ localStorage.setItem("status-"+id,v); localStorage.setItem("_upd",Date.now()+"") }catch{}; if(v==="ja_maratonei"){ let a=["100%"]; setProg(a); try{ localStorage.setItem("progress-"+id,JSON.stringify(a)) }catch{} } }
 function marcarTemporada(sn,total){
  let eps=Array.from({length:total},(_,i)=>sn+"-"+(i+1))
  let todos=eps.every(k=>prog.indexOf(k)>=0)
  let n=todos? prog.filter(p=>!p.startsWith(sn+"-")) : Array.from(new Set([...prog.filter(p=>p!=="100%"),...eps]))
  save(n)
 }
 async function abandonar(){
  if(!confirm(`Abandonar "${serie?.titulo}"? Vai sumir da home.`)) return
  setRemoving(true); try{ localStorage.removeItem("status-"+id); localStorage.removeItem("progress-"+id); await supa.from("series").delete().eq("id",id); router.push("/") }catch(e){ alert(e.message); setRemoving(false) }
 }

 if(!serie) return <div style={{background:"#08162e",minHeight:"100vh",display:"grid",placeItems:"center",color:"#fff"}}>Carregando...</div>
 let totalEps=tmdb?.number_of_episodes||0; let watched=prog.filter(p=>p!=="100%").length
 let pct=prog.indexOf("100%")>=0?100: totalEps? Math.round((watched/totalEps)*100) : Math.min(100,watched*6)

 return(
  <div style={{minHeight:"100vh",background:"#0A1836",color:"#fff",paddingBottom:100}}>
   <div style={{height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",position:"sticky",top:0,zIndex:10,background:"#0A1836",borderBottom:"1px solid #ffffff0f"}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>router.back()} style={{width:36,height:36,borderRadius:999,background:"#ffffff14",border:0,color:"#fff",fontSize:18,cursor:"pointer"}}>‹</button><b style={{fontSize:15,maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{serie.titulo}</b></div>
    <button onClick={abandonar} disabled={removing} style={{height:32,padding:"0 12px",borderRadius:999,border:"1px solid #ff5a5a33",background:"#ff5a5a14",color:"#ff8a8a",fontSize:12,fontWeight:700,cursor:"pointer"}}>{removing?"...":"🗑 Abandonar"}</button>
   </div>
   <div style={{maxWidth:860,margin:"0 auto"}}>
    <div style={{display:"flex",gap:16,padding:20}}>
     <img src={serie.poster?`https://image.tmdb.org/t/p/w300${serie.poster}`:""} style={{width:120,height:180,borderRadius:16,objectFit:"cover",background:"#122042",flexShrink:0}} alt=""/>
     <div style={{flex:1,minWidth:0}}><h1 style={{margin:0,fontSize:18,fontWeight:900}}>{serie.titulo}</h1><div style={{fontSize:12,opacity:.5,marginTop:6}}>{tmdb?.number_of_seasons?`${tmdb.number_of_seasons} temp • ${totalEps} eps`:"Série"}</div><div style={{marginTop:14,height:6,background:"#ffffff18",borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"#FFD400",borderRadius:999}}/></div><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,opacity:.5}}>{watched}/{totalEps||"?"} </span><span style={{fontSize:11,fontWeight:800,color:"#FFD400"}}>{pct}%</span></div></div>
    </div>
    <div style={{display:"flex",gap:8,padding:"0 20px"}}><button onClick={()=>setStatus("assistindo")} style={{height:38,padding:"0 16px",borderRadius:999,border:0,cursor:"pointer",fontWeight:st==="assistindo"?800:600,background:st==="assistindo"?"#fff":"#ffffff14",color:st==="assistindo"?"#0A1836":"#fff"}}>Assistindo</button><button onClick={()=>setStatus("quero_assistir")} style={{height:38,padding:"0 16px",borderRadius:999,border:0,cursor:"pointer",fontWeight:st==="quero_assistir"?800:600,background:st==="quero_assistir"?"#fff":"#ffffff14",color:st==="quero_assistir"?"#0A1836":"#fff"}}>Quero</button><button onClick={()=>setStatus("ja_maratonei")} style={{height:38,padding:"0 16px",borderRadius:999,cursor:"pointer",fontWeight:900,border:st==="ja_maratonei"?"0":"1px solid #FFD400",background:st==="ja_maratonei"?"#FFD400":"transparent",color:st==="ja_maratonei"?"#0A1836":"#FFD400"}}>✓ Já maratonei</button></div>
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
     {seasons.length? seasons.map(s=>{
      let sn=s.season_number; let isOpen=open===sn; let eps=epData[sn]||[]; let total=s.episode_count||eps
