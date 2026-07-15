"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
export default function Home(){
 const [series,setSeries]=useState([])
 const [stMap,setStMap]=useState({})
 const [pgMap,setPgMap]=useState({})
 const [q,setQ]=useState(""); const [res,setRes]=useState([]); const [ok,setOk]=useState(false)
 async function load(){ const {data}=await supa.from("series").select("*").order("created_at",{ascending:false}); if(data)setSeries(data) }
 function loadLS(list){ let s={},p={}; list.forEach(x=>{ let a=localStorage.getItem("status-"+x.id); let b=localStorage.getItem("progress-"+x.id); if(a)s[x.id]=a; if(b)p[x.id]=JSON.parse(b)}); setStMap(s); setPgMap(p) }
 useEffect(()=>{setOk(true);load()},[]); useEffect(()=>{if(ok&&series.length)loadLS(series)},[ok,series])
 useEffect(()=>{const f=()=>loadLS(series); window.addEventListener("focus",f); return()=>removeEventListener("focus",f)},[series])
 async function buscar(v){ setQ(v); if(v.length<2)return setRes([]); let r=await fetch("https://api.themoviedb.org/3/search/tv?api_key="+process.env.NEXT_PUBLIC_TMDB_KEY+"&language=pt-BR&query="+v); let j=await r.json(); setRes(j.results?j.results.slice(0,5):[]) }
 async function add(i){ let {data:e}=await supa.from("series").select("*").eq("tmdb_id",i.id).maybeSingle(); let f=e; if(!e){ let n={tmdb_id:i.id,titulo:i.name,poster:i.poster_path}; let {data:d}=await supa.from("series").insert([n]).select().single(); f=d } localStorage.setItem("status-"+f.id,"quero_assistir"); localStorage.setItem("progress-"+f.id,"[]"); let l=[f,...series]; setSeries(l); loadLS(l); setRes([]); setQ("") }
 if(!ok)return null
 const isM=id=>{let s=stMap[id],p=pgMap[id]||[]; return s==="ja_maratonei"||p.includes("100%")}
 const isA=id=>{if(isM(id))return false; let s=stMap[id],p=pgMap[id]||[]; return s==="assistindo"||p.length>0}
 let mar=[],ass=[],que=[]; series.forEach(s=>{isM(s.id)?mar.push(s):isA(s.id)?ass.push(s):que.push(s)})
 return(<div style={{background:"#08162e",minHeight:"100vh",color:"#fff",paddingBottom:80}}><div style={{padding:16}}><input value={q} onChange={e=>buscar(e.target.value)} placeholder="Buscar..." style={{width:"100%",height:44,borderRadius:999,background:"#122042",border:0,padding:"0 16px",color:"#fff"}}/>{res.map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:8}}><span>{r.name}</span><button onClick={()=>add(r)} style={{background:"#FFD400",border:0,borderRadius:999,padding:"4px 10px"}}>+</button></div>)}</div><h3 style={{padding:"0 16px"}}>Estou assistindo</h3><div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 16px"}}>{ass.map(s=><Link key={s.id} href={"/serie/"+s.id} style={{minWidth:110,color:"#fff",textDecoration:"none"}}><img src={"https://image.tmdb.org/t/p/w200"+s.poster} style={{width:110,height:160,borderRadius:12,border:"2px solid #FFD400"}} alt=""/><div style={{fontSize:12}}>{s.titulo}</div></Link>)}</div><h3 style={{padding:"0 16px"}}>Quero Assistir</h3><div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 16px"}}>{que.map(s=><Link key={s.id} href={"/serie/"+s.id} style={{minWidth:110,color:"#fff",textDecoration:"none"}}><img src={"https://image.tmdb.org/t/p/w200"+s.poster} style={{width:110,height:160,borderRadius:12}} alt=""/><div style={{fontSize:12}}>{s.titulo}</div></Link>)}</div><h3 style={{padding:"0 16px"}}>Ja maratonei ✓</h3><div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 16px"}}>{mar.map(s=><Link key={s.id} href={"/serie/"+s.id} style={{minWidth:110,color:"#fff",textDecoration:"none"}}><div style={{position:"relative"}}><img src={"https://image.tmdb.org/t/p/w200"+s.poster} style={{width:110,height:160,borderRadius:12}} alt=""/><div style={{position:"absolute",top:6,right:6,background:"#FFD400",color:"#000",width:20,height:20,borderRadius:999,display:"grid",placeItems:"center"}}>✓</div></div><div style={{fontSize:12}}>{s.titulo}</div></Link>)}</div></div>)
}
