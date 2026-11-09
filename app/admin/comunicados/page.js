"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function ComunicadosAdminPage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true
    async function checkAccess() {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) {
        if (active) {
          setNotice("Entre com sua conta Google para continuar.")
          setLoading(false)
        }
        return
      }
      const response = await fetch("/api/admin/email-campaign", {
        headers: { Authorization: "Bearer " + token }
      })
      if (active) {
        setAllowed(response.ok)
        if (!response.ok) setNotice(response.status === 403 ? "Esta conta não tem permissão de administração." : "Não foi possível validar o acesso. Verifique a configuração do servidor.")
        setLoading(false)
      }
    }
    checkAccess().catch(() => {
      if (active) {
        setNotice("Não foi possível validar o acesso.")
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  async function queueCampaign(event) {
    event.preventDefault()
    setSending(true)
    setNotice("")
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) {
      setNotice("Sua sessão expirou. Entre novamente.")
      setSending(false)
      return
    }
    const response = await fetch("/api/admin/email-campaign", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ subject, message })
    })
    const result = await response.json().catch(() => ({}))
    setSending(false)
    if (!response.ok) {
      setNotice(result.error || "Não foi possível preparar o comunicado.")
      return
    }
    setNotice(result.queued
      ? "Comunicado colocado na fila para " + result.queued + " pessoa(s) inscrita(s). O envio ocorrerá gradualmente."
      : "Nenhuma pessoa ativou o recebimento de comunicados gerais.")
    setSubject("")
    setMessage("")
  }

  return (
    <main style={{minHeight:"100vh",background:"#080B1F",color:"#fff",padding:"28px 16px"}}>
      <section style={{maxWidth:640,margin:"0 auto",background:"#12182F",border:"1px solid #ffffff18",borderRadius:18,padding:24}}>
        <a href="/" style={{color:"#FACC15",textDecoration:"none",fontSize:13}}>← Voltar ao Maratonei</a>
        <h1 style={{fontSize:26,fontWeight:900,color:"#FACC15",margin:"18px 0 8px"}}>Comunicados do Maratonei</h1>
        <p style={{color:"#94A3B8",fontSize:14,lineHeight:1.6,marginBottom:20}}>Envie novidades gerais somente para pessoas que ativaram essa preferência nas configurações.</p>
        {loading ? <p>Verificando acesso...</p> : allowed ? (
          <form onSubmit={queueCampaign} style={{display:"grid",gap:14}}>
            <label style={{display:"grid",gap:6,fontSize:13}}>Assunto
              <input value={subject} onChange={e=>setSubject(e.target.value)} minLength={3} maxLength={140} required style={{background:"#080B1F",color:"#fff",border:"1px solid #ffffff25",borderRadius:10,padding:12}}/>
            </label>
            <label style={{display:"grid",gap:6,fontSize:13}}>Mensagem
              <textarea value={message} onChange={e=>setMessage(e.target.value)} minLength={10} maxLength={1200} rows={7} required style={{background:"#080B1F",color:"#fff",border:"1px solid #ffffff25",borderRadius:10,padding:12,resize:"vertical"}}/>
            </label>
            <button disabled={sending} style={{background:"#FACC15",color:"#080B1F",border:0,borderRadius:10,padding:14,fontWeight:900,cursor:"pointer",opacity:sending?.65:1}}>{sending ? "Preparando envio..." : "Colocar comunicado na fila"}</button>
          </form>
        ) : <p style={{color:"#FCA5A5",fontSize:14}}>{notice || "Acesso restrito."}</p>}
        {notice && allowed ? <p role="status" style={{color:"#FDE68A",fontSize:13,marginTop:16}}>{notice}</p> : null}
      </section>
    </main>
  )
}
