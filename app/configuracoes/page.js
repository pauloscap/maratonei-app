"use client"
import { useEffect, useState } from "react"
import { getSupa } from "../../lib/supabase"
import { BottomNav } from "../../components/BottomNav"

const supa = getSupa()

export default function ConfigPage(){
  const [user,setUser] = useState(null)
  const [nome,setNome] = useState("")
  const [email,setEmail] = useState("")
  const [foto,setFoto] = useState("")

  useEffect(()=>{
    const n = localStorage.getItem("perfil-nome") || ""
    setNome(n)
    supa.auth.getUser().then(({data})=>{
      if(data?.user){
        setUser(data.user)
        setEmail(data.user.email || "")
        setFoto(data.user.user_metadata?.avatar_url || "")
        if(!n && data.user.user_metadata?.full_name){
          setNome(data.user.user_metadata.full_name)
        }
      }
    })
  },[])

  const salvarNome = ()=>{
    if(!nome.trim()) return alert("Digite um nome")
    localStorage.setItem("perfil-nome", nome)
    alert("Nome salvo! Vai aparecer no Perfil e no Ranking")
  }

  const logout = async()=>{
    if(!confirm("Sair da sua conta Google?")) return
    await supa.auth.signOut()
    localStorage.removeItem("supabase.auth.token")
    location.href="/"
  }

  const limparTudo = ()=>{
    if(!confirm("Isso apaga check-ins, progresso e molduras LOCAL. Sua conta Google continua. Confirmar?")) return
    const manter = ["perfil-nome"]
    const chaves = []
    for(let i=0;i<localStorage.length;i++) chaves.push(localStorage.key(i))
    chaves.forEach(k=>{ if(!manter.includes(k)) localStorage.removeItem(k) })
    alert("Dados locais limpos!")
    location.reload()
  }

  const exportar = ()=>{
    const dados = {}
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); dados[k]=localStorage.getItem(k) }
    const blob = new Blob([JSON.stringify(dados,null,2)], {type:"application/json"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=`meus-dados-${new Date().toISOString().slice(0,10)}.json`; a.click()
  }

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", padding:"0 16px", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"#080B1F", zIndex:10, fontWeight:900}}>Configurações</header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12}}>

        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:48, height:48, borderRadius:999, background:"#fff", overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, color:"#000"}}>
            {foto? <img src={foto} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : (nome[0]||"P")}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800}}>{nome || "Usuário"}</div>
            <div style={{fontSize:12, opacity:.5}}>{email || "Conta local (sem login)"}</div>
            <div style={{fontSize:10, marginTop:4, background: user?"#22c55e22":"#ffffff14", color: user?"#22c55e":"#fff", display:"inline-block", padding:"2px 8px", borderRadius:99, border:`1px solid ${user?"#22c55e33":"#ffffff10"}`}}>{user? "● Conectado com Google" : "○ Modo offline"}</div>
          </div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Conta</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <label style={{fontSize:11, opacity:.5}}>Nome de exibição</label>
            <div style={{display:"flex", gap:8}}>
              <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome" style={{flex:1, background:"#ffffff0f", border:"1px solid #ffffff15", borderRadius:10, padding:"10px 12px", color:"#fff", outline:"none"}}/>
              <button onClick={salvarNome} style={{background:"#FFD400", color:"#000", border:0, borderRadius:10, padding:"0 14px", fontWeight:900, cursor:"pointer"}}>Salvar</button>
            </div>
            <div style={{fontSize:11, opacity:.35, marginTop:4}}>Esse nome aparece no Perfil, Ranking e na moldura.</div>
          </div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Dados e Privacidade</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <button onClick={exportar} style={{height:44, background:"#ffffff08", border:"1px solid #ffffff12", color:"#fff", borderRadius:12, fontWeight:700, cursor:"pointer"}}>⬇️ Exportar meus dados (.json)</button>
            <button onClick={limparTudo} style={{height:44, background:"#ff3b3b14", border:"1px solid #ff3b3b22", color:"#ff6b6b", borderRadius:12, fontWeight:700, cursor:"pointer"}}>🗑️ Limpar histórico local</button>
          </div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Sessão</div>
          {user? <button onClick={logout} style={{width:"100%", height:44, background:"#fff", color:"#000", border:0, borderRadius:12, fontWeight:900, cursor:"pointer"}}>Sair da conta Google</button>
          : <button onClick={()=>location.href="/"} style={{width:"100%", height:44, background:"#ffffff08", border:"1px solid #ffffff12", color:"#fff", borderRadius:12, fontWeight:700, cursor:"pointer"}}>Fazer login com Google</button>}
          <div style={{fontSize:11, opacity:.3, textAlign:"center", marginTop:10}}>v1.2-perfil-completo • Maratonei App</div>
        </div>

      </main>
      <BottomNav/>
    </div>
  )
}
