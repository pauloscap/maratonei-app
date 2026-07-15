"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupa } from "../../../lib/supabase"
const supa = getSupa()

export default function Detalhe(){
 const {id}=useParams(); const router=useRouter()
 const [serie,setSerie]=useState(null); const [prog,setProg]=useState([]); const [st,setSt]=useState("quero_assistir")
 const [removing,setRemoving]=useState(false)

 useEffect(()=>{ async function l(){ try{ let {data}=await supa.from("series").select("*").eq("id",id).single(); if(!data) return; setSerie(data); let a=localStorage.getItem("status-"+id); if(a) setSt(a); let b=localStorage.getItem("progress-"+id); if(b){ try{ setProg(JSON.parse(b)) }catch{} } }catch{} } if(id) l() },[id])

 function save(n){
  setProg(n); try{ localStorage.setItem("progress-"+id,JSON.stringify(n)) }catch{}
  if(n.length>0 && st==="quero_assistir"){ setSt("assistindo"); try{ localStorage.setItem("status-"+id,"assistindo") }catch{} }
 }
 function toggle(t,e){ let k=t+"-"+e; let n=prog.indexOf(k)>=0?prog.filter(x=>x!==k):[...prog,k]; save(n) }
 function setStatus(v){ setSt(v); try{ localStorage.setItem("status-"+id,v) }catch{}; if(v==="ja_maratonei"){ let a=["100%"]; setProg(a); try{ localStorage.setItem("progress-"+id,JSON.stringify(a)) }catch{} } }

 async function abandonar(){
  if(!confirm("Tem certeza que quer abandonar '"+(serie?.titulo||"essa série")+"'? Ela vai sumir da sua home.")) return
  setRemoving(true)
  try{
   localStorage.removeItem("status-"+id); localStorage.removeItem("progress-"+id)
   await supa.from("series").delete().eq("id",id)
   router.push("/")
  }catch(e){ alert("Erro ao remover: "+e.message); setRemoving(false) }
 }

 if(!serie) return <div style={{background:"#08162e",minHeight:"100vh",display:"grid",placeItems:"center",color:"#fff"}}>Carregando...</div>
 let pct=prog.indexOf("100%")>=0?100:Math.min(100,prog.length*12)

 return(
  <div style={{minHeight:"100vh",background:"#08162e",color:"#fff",paddingBottom:90}}>
   <div style={{height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",position:"sticky",top:0,background:"#08162e",zIndex:10,borderBottom:"1px solid #ffffff10"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={()=>router.back()} style={{width:32,height:32,borderRadius:999,border:0,cursor:"pointer"}}>‹</button><b style={{maxWidth:220,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{serie.titulo}</b></div>
    <button onClick={abandonar} disabled={removing} style={{height:32,padding:"0 12px",borderRadius:999,border:"1px solid #ff4d4d44",background:"rgba(255,77,77,0.12)",color:"#ff6b6b",fontSize:12,fontWeight:700,cursor:"pointer"}}>{removing?"Removendo...":"🗑 Abandonar"}</button>
   </div>

   <div style={{padding:16,display:"flex",gap:16}}>
    <img src={serie.poster?"https://image.tmdb.org/t/p/w300"+serie.poster:""} style={{width:120,height:180,borderRadius:12,background:"#122042",objectFit:"cover"}} alt=""/>
    <div><div style={{width:140,height:6,background:"#ffffff22",borderRadius:999,marginTop:20}}><div style={{width:pct+"%",height:6,background:"#FFD400",borderRadius:999}}></div></div><div style={{fontSize:12,opacity:.6,marginTop:6}}>{pct}% concluído</div></div>
   </div>

   <div style={{display:"flex",gap:8,padding:"0 16px",flexWrap:"wrap"}}>
    <button onClick={()=>setStatus("assistindo")} style={{height:36,borderRadius:999,border:0,padding:"0 14px",background:st==="assistindo"?"#fff":"#ffffff18",color:st==="assistindo"?"#000":"#fff",fontWeight:700}}>Assistindo</button>
    <button onClick={()=>setStatus("quero_assistir")} style={{height:36,borderRadius:999,border:0,padding:"0 14px",background:st==="quero_assistir"?"#fff":"#ffffff18",color:st==="quero_assistir"?"#000":"#fff"}}>Quero</button>
    <button onClick={()=>setStatus("ja_maratonei")} style={{height:36,borderRadius:999,border:"1px solid #FFD400",padding:"0 14px",background:st==="ja_maratonei"?"#FFD400":"transparent",color:st==="ja_maratonei"?"#000":"#FFD400",fontWeight:900}}>✓ Já maratonei</button>
   </div>

   <div style={{padding:16}}>
    {[1,2,3].map(t=><div key={t} style={{background:"#122042",borderRadius:16,padding:14,marginBottom:12}}><b style={{fontSize:14}}>Temporada {t}</b>{[1,2,3,4,5,6].map(e=>{let k=t+"-"+e,ck=prog.indexOf(k)>=0; return<label key={k} style={{display:"flex",gap:10,padding:"8px 0",cursor:"pointer"}}><input type="checkbox" checked={ck} onChange={()=>toggle(t,e)}/><span style={{fontSize:13}}>Episódio {e}</span></label>})}</div>)}
    <div style={{marginTop:24,borderTop:"1px solid #ffffff10",paddingTop:20}}>
     <button onClick={abandonar} disabled={removing} style={{width:"100%",height:48,borderRadius:12,border:"1px solid #ff4d4d30",background:"#ff4d4d15",color:"#ff7a7a",fontWeight:800,fontSize:14,cursor:"pointer"}}>{removing?"Removendo...":"Abandonar série e remover da home"}</button>
     <div style={{fontSize:11,opacity:.4,textAlign:"center",marginTop:8}}>Isso apaga seu progresso dessa série</div>
    </div>
   </div>
  </div>
 )
}
