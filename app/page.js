"use client"
import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home(){
  const router = useRouter()
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(!data?.session) router.push("/login")
      // se tem sessão, fica na home mesmo, não redireciona pra /series
    })
  },[])
  return (
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", display:"grid", placeItems:"center"}}>
      <div style={{textAlign:"center"}}>
        <h1 style={{color:"#FFD400", fontSize:32, fontWeight:900}}>Maratonei</h1>
        <p style={{opacity:.5, marginTop:8}}>Carregando suas séries...</p>
        <div style={{marginTop:16, display:"flex", gap:8, justifyContent:"center"}}>
          <a href="/perfil" style={{background:"#FFD400", color:"#000", padding:"10px 18px", borderRadius:999, fontWeight:800, textDecoration:"none"}}>Ir para Perfil</a>
          <a href="/configuracoes" style={{background:"#ffffff12", color:"#fff", padding:"10px 18px", borderRadius:999, fontWeight:700, textDecoration:"none", border:"1px solid #ffffff20"}}>Configurações</a>
        </div>
      </div>
    </div>
  )
}
