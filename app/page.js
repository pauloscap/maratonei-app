"use client"
import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home(){
  const router = useRouter()
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(!data.session) router.push("/login")
      else router.push("/series")
    })
  },[])
  return <div style={{minHeight:"100vh", background:"#080B1F", display:"grid", placeItems:"center", color:"#fff"}}>Carregando...</div>
}
