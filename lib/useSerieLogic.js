"use client"
import { useEffect, useState } from "react"
import { getSupa } from "./supabase"
const supa = getSupa()
export function useSerie(id){
 const [s,setS]=useState(null); const [p,setP]=useState([])
 const [st,setSt]=useState("quero_assistir"); const [tm,setTm]=useState(null)
 const [se,setSe]=useState([]); const [err,setErr]=useState("")
 useEffect(()=>{async function l(){
  try{ let {data,error}=await supa.from("series").select("*").eq("id",id).maybeSingle()
   if(error){setErr(error.message);return}
   if(!data){setErr("Não encontrada");return}
   setS(data)
   let a=localStorage.getItem("status-"+id); if(a)setSt(a)
   let b=localStorage.getItem("progress-"+id); if(b)try{setP(JSON.parse(b))}catch{}
   if(data.tmdb_id){
    try{ let r=await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
     let j=await r.json(); setTm(j)
     let f=(j.seasons||[]).filter(x=>x.season_number>0)
     if(f.length)setSe(f); else if(j.number_of_seasons)setSe(Array.from({length:j.number_of_seasons},(_,i)=>({season_number:i+1,episode_count:8})))
    }catch{ setSe([{season_number:1,episode_count:8},{season_number:2,episode_count:8},{season_number:3,episode_count:8}]) }
   } else setSe([{season_number:1,episode_count:8}])
  }catch(e){setErr(String(e))} } if(id)l()
 },[id])
 return {s,p,setP,st,setSt,tm,se,err,supa}
}
export function saveProg(id,n,st){
 setTimeout(()=>{ try{ localStorage.setItem("progress-"+id,JSON.stringify(n)); localStorage.setItem("_upd",Date.now()) }catch{} },0)
}
