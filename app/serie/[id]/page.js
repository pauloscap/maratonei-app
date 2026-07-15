"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupa } from "../../../lib/supabase"
const supa = getSupa()

export default function Detalhe(){
 const {id}=useParams(); const router=useRouter()
 const [serie,setSerie]=useState(null); const [prog,setProg]=useState([]); const [st,setSt]=useState("quero_assistir")
 const [tmdb,setTmdb]=useState(null); const [seasons,setSeasons]=useState([]); const [open,setOpen]=useState(1)
 const [epData,setEpData]=useState({}) // cache dos episodios por temporada
 const [removing,setRemoving]=useState(false)

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
   let j=await r.json(); setEpData(prev=>({...prev,[sn]:j.episodes||[]}))
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
  let n=todos? prog
