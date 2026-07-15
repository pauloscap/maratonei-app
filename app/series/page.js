"use client"
import { useEffect } from "react"
export default function Series(){
  useEffect(()=>{ location.href="/" },[])
  return <div style={{background:"#080B1F", minHeight:"100vh", color:"#fff", display:"grid", placeItems:"center"}}>Redirecionando...</div>
}
