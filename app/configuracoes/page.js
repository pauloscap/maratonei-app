"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function ConfigPage(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("")
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    const n = localStorage.getItem("perfil-nome") || ""
    setNome(n)
    checkUser()
  },[])

  async function checkUser(){
    const { data:{ session } } = await supabase.auth.getSession()
    if(session?.user){ setUser(session.user) }
  }

  async function signInWithGoogle(){
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }
    })
    if(error){ console.error(error); setLoading(false); alert("Erro ao logar") }
  }

  async function logout(){
    if(!confirm("Sair da conta?")) return
    await supabase.auth.signOut()
    setUser(null)
    location.href="/login"
  }

  const salvarNome = ()=>{
    localStorage.setItem("perfil-nome", nome)
    alert("Nome salvo!")
  }

  const limpar = ()=>{
    if(!confirm("Apagar check-ins e progresso LOCAL? Sua conta Google continua.")) return
    const keep = ["perfil-nome"]
    const keys = []
    for(let i=0;i<localStorage.length;i++) keys.push(localStorage.key(i))
    keys.forEach(k=>{ if(!keep.includes(k)) localStorage.removeItem(k) })
    alert("Limpo!")
  }

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", padding:"0 16px", borderBottom:"1px solid #ffffff10", background:"#080B1F", position:"sticky", top:0, fontWeight:900}}>Configurações</header>
      <main style={{maxWidth:560, margin:"0 auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12}}>

        {!user ? (
          <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:24, textAlign:"center"}}>
            <h1 style={{color:"#FACC15", fontSize:28, fontWeight:900, marginBottom:8}}>Maratonei</h1>
            <p style={{color:"#94A3B8", marginBottom:24}}>Conecte sua conta para salvar na nuvem</p>
            <button onClick={signInWithGoogle} disabled={loading} style={{width:"100%", background: loading?"#94A3B8":"#fff", color:"#000", border:"none", padding:14, borderRadius:10, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {loading?"Carregando...":"Entrar com Google"}
            </button>
            <p style={{color:"#64748B", fontSize:11, marginTop:16}}>Ao entrar, você salva seu progresso de forma segura</p>
          </div>
        ) : (
          <>
            <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:12}}>
              <img src={user.user_metadata?.avatar_url} style={{width:48, height:48, borderRadius:999}} alt="avatar"/>
              <div style={{flex:1}}><div style={{fontWeight:800}}>{user.user_metadata?.full_name || nome}</div><div style={{fontSize:12, opacity:.5}}>{user.email}</div><div style={{fontSize:10, color:"#22c55e", background:"#22c55e22", display:"inline-block", padding:"2px 8px", borderRadius:99, marginTop:4}}>● Conectado</div></div>
            </div>

            <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}>
              <div style={{fontSize:12, opacity:.5, marginBottom:8}}>Nome de exibição</div>
              <div style={{display:"flex", gap:8}}><input value={nome} onChange={e=>setNome(e.target.value)} style={{flex:1, background:"#ffffff0f", border:"1px solid #ffffff15", borderRadius:10, padding:"10px 12px", color:"#fff"}}/><button onClick={salvarNome} style={{background:"#FFD400", color:"#000", border:0, borderRadius:10, padding:"0 14px", fontWeight:900}}>Salvar</button></div>
            </div>

            <button onClick={limpar} style={{height:44, background:"#ff3b3b14", border:"1px solid #ff3b3b22", color:"#ff6b6b", borderRadius:12, fontWeight:700}}>🗑️ Limpar histórico local</button>
            <button onClick={logout} style={{height:44, background:"#fff", color:"#000", border:0, borderRadius:12, fontWeight:900}}>Sair da conta</button>
          </>
        )}

        <div style={{fontSize:11, opacity:.25, textAlign:"center", marginTop:8}}>v1.3 • login integrado • maratonei-app</div>
      </main>
      <BottomNav/>
    </div>
  )
}
