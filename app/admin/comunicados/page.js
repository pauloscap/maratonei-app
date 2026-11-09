"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const emptyBlock = () => ({ title: "", text: "", imageUrl: "", linkUrl: "", linkLabel: "SAIBA MAIS" })
const inputStyle = { width: "100%", boxSizing: "border-box", background: "#080B1F", color: "#fff", border: "1px solid #ffffff25", borderRadius: 10, padding: 12, marginTop: 6 }
const labelStyle = { display: "block", fontSize: 13, color: "#CBD5E1", marginBottom: 14 }

export default function ComunicadosAdminPage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [blocks, setBlocks] = useState([emptyBlock()])
  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [notice, setNotice] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    let active = true
    async function checkAccess() {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) {
        if (active) { setNotice("Entre com sua conta Google para continuar."); setLoading(false) }
        return
      }
      const response = await fetch("/api/admin/email-campaign", { headers: { Authorization: "Bearer " + token } })
      if (active) {
        setAllowed(response.ok)
        if (!response.ok) setNotice(response.status === 403 ? "Esta conta não tem permissão de administração." : "Não foi possível validar o acesso. Verifique a configuração do servidor.")
        setLoading(false)
      }
    }
    checkAccess().catch(() => { if (active) { setNotice("Não foi possível validar o acesso."); setLoading(false) } })
    return () => { active = false }
  }, [])

  async function signInWithGoogle() {
    setAuthLoading(true); setNotice("")
    const callbackUrl = new URL("https://maratonei-app-git-feat-notificacoes-email-maratonei.vercel.app/auth/callback")
    callbackUrl.searchParams.set("next", "/admin/comunicados")
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl.toString() } })
    if (error) { setNotice("Não foi possível iniciar o login com Google. Tente novamente."); setAuthLoading(false) }
  }

  function updateBlock(index, field, value) {
    setBlocks(current => current.map((block, i) => i === index ? { ...block, [field]: value } : block))
  }

  async function sendTestEmail() {
    setSendingTest(true); setNotice("")
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) { setNotice("Sua sessão expirou. Entre novamente."); setSendingTest(false); return }
    const payload = { subject, message, coverImageUrl, blocks: blocks.filter(block => Object.values(block).some(value => String(value).trim())) }
    const response = await fetch("/api/admin/email-campaign/test", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const result = await response.json().catch(() => ({}))
    setSendingTest(false)
    setNotice(response.ok ? "E-mail de teste enviado para " + result.sentTo + ". A fila geral não foi utilizada." : (result.error || "Não foi possível enviar o e-mail de teste."))
  }

  async function queueCampaign(event) {
    event.preventDefault()
    setSending(true); setNotice("")
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) { setNotice("Sua sessão expirou. Entre novamente."); setSending(false); return }
    const response = await fetch("/api/admin/email-campaign", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, coverImageUrl, blocks: blocks.filter(block => Object.values(block).some(value => String(value).trim())) })
    })
    const result = await response.json().catch(() => ({}))
    setSending(false)
    if (!response.ok) { setNotice(result.error || "Não foi possível preparar o comunicado."); return }
    if (result.queued) {
      setNotice("Newsletter preparada na fila para " + result.queued + " conta(s) com e-mail confirmado. O envio ocorrerá gradualmente.")
      setSubject(""); setMessage(""); setCoverImageUrl(""); setBlocks([emptyBlock()])
    } else {
      setNotice("Não há contas com e-mail confirmado disponíveis para receber a newsletter. Seu conteúdo foi mantido no formulário.")
    }
  }

  const field = (label, value, onChange, placeholder, type = "text", maxLength) => (
    <label style={labelStyle}>{label}
      <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} style={inputStyle}/>
    </label>
  )

  return (
    <main style={{minHeight:"100vh",background:"#080B1F",color:"#fff",padding:"28px 16px"}}>
      <section style={{maxWidth:1080,margin:"0 auto"}}>
        <a href="/" style={{color:"#FACC15",textDecoration:"none",fontSize:13}}>← Voltar ao Maratonei</a>
        <h1 style={{fontSize:28,fontWeight:900,color:"#FACC15",margin:"18px 0 8px"}}>Newsletter do Maratonei</h1>
        <p style={{color:"#94A3B8",fontSize:14,lineHeight:1.6,marginBottom:24}}>Monte uma edição com capa, textos, imagens e links. A prévia ao lado acompanha suas alterações.</p>
        {loading ? <p>Verificando acesso...</p> : !allowed ? (
          <div style={{maxWidth:520,background:"#12182F",padding:24,borderRadius:18}}>
            <p style={{color:"#FCA5A5",fontSize:14}}>{notice || "Acesso restrito."}</p>
            <button type="button" onClick={signInWithGoogle} disabled={authLoading} style={{background:"#fff",color:"#1F2937",border:0,borderRadius:10,padding:14,fontWeight:800,cursor:"pointer"}}>{authLoading ? "Abrindo Google..." : "Entrar com Google"}</button>
          </div>
        ) : (
          <div className="newsletter-layout" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(300px,0.9fr)",gap:22,alignItems:"start"}}>
            <form onSubmit={queueCampaign} style={{background:"#12182F",border:"1px solid #ffffff18",borderRadius:18,padding:22}}>
              <h2 style={{fontSize:18,marginTop:0}}>1. Identificação</h2>
              {field("Assunto do e-mail",subject,setSubject,"Ex.: As novidades que chegaram nesta semana","text",140)}
              {field("Imagem de capa (URL HTTPS)",coverImageUrl,setCoverImageUrl,"https://...")}
              <label style={labelStyle}>Texto de abertura
                <textarea value={message} onChange={event=>setMessage(event.target.value)} minLength={10} maxLength={1200} required rows={4} placeholder="Apresente os destaques desta edição..." style={{...inputStyle,resize:"vertical"}}/>
              </label>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"24px 0 12px"}}>
                <h2 style={{fontSize:18,margin:0}}>2. Conteúdo da newsletter</h2>
                <button type="button" onClick={()=>setBlocks(current=>current.length<12?[...current,emptyBlock()]:current)} disabled={blocks.length>=12} style={{background:"#26334F",color:"#FACC15",border:"1px solid #ffffff25",borderRadius:9,padding:"9px 12px",cursor:"pointer"}}>+ Adicionar bloco</button>
              </div>
              {blocks.map((block,index)=>(
                <div key={index} style={{border:"1px solid #ffffff20",borderRadius:12,padding:14,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <strong style={{fontSize:14}}>Bloco {index+1}</strong>
                    <button type="button" onClick={()=>setBlocks(current=>current.filter((_,i)=>i!==index))} style={{background:"transparent",color:"#FCA5A5",border:0,cursor:"pointer"}}>Remover</button>
                  </div>
                  {field("Título",block.title,value=>updateBlock(index,"title",value),"Ex.: Estreia da semana","text",120)}
                  <label style={labelStyle}>Texto
                    <textarea value={block.text} onChange={event=>updateBlock(index,"text",event.target.value)} maxLength={700} rows={3} placeholder="Escreva uma descrição curta..." style={{...inputStyle,resize:"vertical"}}/>
                  </label>
                  {field("Imagem do bloco (URL HTTPS)",block.imageUrl,value=>updateBlock(index,"imageUrl",value),"https://...")}
                  {field("Link de destino (URL HTTPS)",block.linkUrl,value=>updateBlock(index,"linkUrl",value),"https://maratoneiapp.com.br/...")}
                  {field("Texto do botão",block.linkLabel,value=>updateBlock(index,"linkLabel",value),"SAIBA MAIS","text",40)}
                </div>
              ))}
              <button type="button" onClick={()=>setShowPreview(value=>!value)} style={{background:"transparent",color:"#FACC15",border:"1px solid #FACC15",borderRadius:10,padding:12,marginRight:8,cursor:"pointer"}}>{showPreview ? "Ocultar prévia" : "Mostrar prévia"}</button>
              <button type="button" onClick={sendTestEmail} disabled={sendingTest || sending} style={{background:"#22C55E",color:"#052E16",border:0,borderRadius:10,padding:14,fontWeight:900,cursor:"pointer",opacity:sendingTest?0.65:1,marginRight:8}}>{sendingTest ? "Enviando teste..." : "Enviar e-mail de teste"}</button>
              <button type="submit" disabled={sending || sendingTest} style={{background:"#FACC15",color:"#080B1F",border:0,borderRadius:10,padding:14,fontWeight:900,cursor:"pointer",opacity:sending?0.65:1}}>{sending ? "Preparando..." : "Colocar newsletter na fila"}</button>
              {notice ? <p role="status" style={{color:"#FDE68A",fontSize:13,marginTop:16}}>{notice}</p> : null}
              <p style={{color:"#94A3B8",fontSize:12,lineHeight:1.5,marginBottom:0}}>A newsletter será enviada às contas com e-mail confirmado. Quem cancelar o recebimento pelo link no rodapé ficará fora das próximas edições.</p>
            </form>
            {showPreview ? (
              <aside className="newsletter-preview" style={{position:"sticky",top:16,background:"#F3F4F6",borderRadius:18,padding:12,color:"#374151",border:"1px solid #E5E7EB"}}>
                <div style={{textAlign:"center",fontSize:11,color:"#64748B",padding:"5px 0 12px"}}>PRÉVIA DO E-MAIL</div>
                <div style={{maxWidth:600,width:"100%",boxSizing:"border-box",margin:"0 auto",background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:10,overflow:"hidden",padding:24,color:"#374151"}}>
                  <div style={{textAlign:"center",color:"#172033",fontSize:22,fontWeight:900,letterSpacing:1,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #F0F0F0"}}>🍿 MARATONEI</div>
                  <div style={{fontSize:11,color:"#9A7414",letterSpacing:1,marginBottom:10}}>NEWSLETTER • NOVIDADES</div>
                  <h2 style={{fontSize:23,lineHeight:1.3,color:"#111827",margin:"0 0 16px"}}>{subject || "Título da sua newsletter"}</h2>
                  {coverImageUrl ? <img src={coverImageUrl} alt="Capa da newsletter" style={{width:"100%",height:"auto",borderRadius:10,margin:"8px 0 16px"}}/> : <div style={{height:150,background:"#26334F",borderRadius:10,display:"grid",placeItems:"center",color:"#94A3B8",marginBottom:16}}>Imagem de capa</div>}
                  <p style={{fontSize:15,lineHeight:1.7,color:"#4B5563",whiteSpace:"pre-wrap"}}>{message || "Seu texto de abertura aparecerá aqui."}</p>
                  {blocks.map((block,index)=>(
                    <div key={index} style={{borderTop:"1px solid #E5E7EB",paddingTop:18,marginTop:18}}>
                      {block.imageUrl ? <img src={block.imageUrl} alt={block.title || "Imagem do conteúdo"} style={{width:"100%",height:"auto",borderRadius:9,marginBottom:10}}/> : null}
                      {block.title ? <h3 style={{fontSize:19,color:"#111827",margin:"8px 0"}}>{block.title}</h3> : null}
                      {block.text ? <p style={{fontSize:15,lineHeight:1.65,color:"#4B5563",whiteSpace:"pre-wrap"}}>{block.text}</p> : null}
                      {block.linkUrl ? <div style={{display:"inline-block",background:"#F2C94C",color:"#172033",fontWeight:900,fontSize:12,padding:"11px 14px",borderRadius:8,marginTop:8}}>{block.linkLabel || "SAIBA MAIS"} →</div> : null}
                    </div>
                  ))}
                  <div style={{background:"#F2C94C",color:"#172033",fontWeight:900,textAlign:"center",padding:14,borderRadius:9,marginTop:22}}>ACESSAR MARATONEI</div>
                  <p style={{fontSize:11,color:"#6B7280",textAlign:"center",lineHeight:1.5,marginTop:22}}>Você recebe este e-mail porque ativou as novidades do Maratonei. Gerencie suas preferências nas configurações.</p>
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </section>
      <style jsx>{".newsletter-layout{grid-template-columns:minmax(0,1fr) minmax(300px,0.9fr)}@media(max-width:760px){.newsletter-layout{grid-template-columns:1fr!important}.newsletter-preview{position:static!important}}"}</style>
    </main>
  )
}
