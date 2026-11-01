"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { BottomNav } from "../components/BottomNav";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const atalhos = [
  { href: "/feed", icon: "◎", titulo: "Amigos", texto: "Veja o que a comunidade está assistindo.", cor: "#FFD400" },
  { href: "/busca", icon: "⌕", titulo: "Descobrir", texto: "Encontre maratoneiros, filmes e séries.", cor: "#48D7E8" },
  { href: "/series", icon: "▣", titulo: "Minhas séries", texto: "Continue suas séries e acompanhe episódios.", cor: "#A78BFA" },
  { href: "/filmes", icon: "▶", titulo: "Meus filmes", texto: "Organize o que quer assistir e o que já viu.", cor: "#FB923C" },
];

export default function HomeSocial() {
  const [nome, setNome] = useState("Maratoneiro");
  const [foto, setFoto] = useState("");
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (!user) {
        window.location.replace("/login");
        return;
      }
      const metadata = user.user_metadata || {};
      setNome(metadata.full_name || metadata.name || user.email?.split("@")[0] || "Maratoneiro");
      setFoto(metadata.avatar_url || metadata.picture || "");
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("lida", false);
      if (active) {
        setNaoLidas(count || 0);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <main style={{minHeight:"100vh",background:"#080F25",color:"#fff",display:"grid",placeItems:"center"}}>Preparando seu Maratonei...</main>;
  }

  return (
    <main style={{minHeight:"100vh",background:"#080F25",color:"#fff",paddingBottom:105,fontFamily:"Inter,system-ui,sans-serif"}}>
      <header style={{maxWidth:900,margin:"0 auto",padding:"22px 18px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #ffffff12"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/icon-192.png" alt="Maratonei" style={{width:38,height:38,borderRadius:11}}/>
          <div>
            <div style={{fontSize:17,fontWeight:950,letterSpacing:-.5}}>maratonei<span style={{color:"#FFD400"}}>.</span></div>
            <div style={{fontSize:9,color:"#8D9AB8",letterSpacing:2,fontWeight:800}}>SUA VIDA EM MARATONAS</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/notificacoes" aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : "Notificações"} title="Notificações" style={{position:"relative",width:40,height:40,borderRadius:"50%",border:"1px solid #ffffff20",background:"#172344",display:"grid",placeItems:"center",color:"#FFD400",textDecoration:"none"}}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {naoLidas > 0 && <span style={{position:"absolute",top:-3,right:-3,minWidth:17,height:17,padding:"0 4px",borderRadius:99,background:"#F04452",color:"#fff",fontSize:9,fontWeight:900,display:"grid",placeItems:"center",border:"2px solid #080F25"}}>{naoLidas > 9 ? "9+" : naoLidas}</span>}
          </Link>
          <Link href="/perfil" aria-label="Abrir perfil" style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",border:"1px solid #FFD40066",background:"#172344",display:"grid",placeItems:"center",color:"#FFD400",fontWeight:900,textDecoration:"none"}}>
            {foto ? <img src={foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : nome.slice(0,1).toUpperCase()}
          </Link>
        </div>
      </header>

      <section style={{maxWidth:900,margin:"0 auto",padding:"28px 18px 18px"}}>
        <div style={{borderRadius:24,padding:"25px 21px",background:"radial-gradient(circle at 90% 10%,#38436b 0%,#172345 38%,#111a34 78%)",border:"1px solid #ffffff18",position:"relative",overflow:"hidden"}}>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:2,color:"#FFD400",marginBottom:10}}>BEM-VINDO DE VOLTA</div>
          <h1 style={{fontSize:clampFont(),lineHeight:1.12,letterSpacing:-1.2,margin:"0 0 10px",fontWeight:950}}>Olá, {nome.split(" ")[0]}!<br/>O que vamos maratonar?</h1>
          <p style={{fontSize:13,lineHeight:1.6,color:"#B8C4DF",maxWidth:430,margin:"0 0 18px"}}>Seu espaço para organizar filmes e séries, acompanhar amigos e descobrir sua próxima obsessão.</p>
          <Link href="/busca" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 18px",borderRadius:999,background:"#FFD400",color:"#080F25",fontWeight:950,fontSize:12,textDecoration:"none"}}>＋ Encontrar algo para assistir</Link>
          <div aria-hidden="true" style={{position:"absolute",right:18,bottom:10,fontSize:76,opacity:.12}}>🍿</div>
        </div>
      </section>

      <section style={{maxWidth:900,margin:"0 auto",padding:"8px 18px 24px"}}>
        <div style={{display:"flex",alignItems:"end",justifyContent:"space-between",marginBottom:13}}>
          <div><div style={{fontSize:10,color:"#FFD400",fontWeight:900,letterSpacing:2}}>EXPLORE</div><h2 style={{fontSize:19,margin:"4px 0 0",fontWeight:900}}>Seu Maratonei</h2></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:11}}>
          {atalhos.map(item => (
            <Link key={item.href} href={item.href} style={{minHeight:132,padding:15,borderRadius:17,background:"#111b38",border:"1px solid #ffffff12",textDecoration:"none",color:"#fff",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8}}>
              <span style={{width:34,height:34,borderRadius:11,display:"grid",placeItems:"center",background:item.cor+"20",color:item.cor,fontSize:20,fontWeight:900}}>{item.icon}</span>
              <strong style={{fontSize:13,fontWeight:900}}>{item.titulo}</strong>
              <span style={{fontSize:10,lineHeight:1.5,color:"#9CAACB"}}>{item.texto}</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{maxWidth:900,margin:"0 auto",padding:"0 18px 25px"}}>
        <Link href="/feed" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:17,borderRadius:17,background:"linear-gradient(110deg,#252342,#172344)",border:"1px solid #ffffff16",color:"#fff",textDecoration:"none"}}>
          <div><div style={{fontSize:10,color:"#FFD400",fontWeight:900,letterSpacing:1.5}}>MARATONEI SOCIAL</div><div style={{fontSize:15,fontWeight:900,marginTop:5}}>As maratonas ficam melhores com amigos.</div><div style={{fontSize:11,color:"#AAB4CE",marginTop:5}}>Acompanhe, descubra pessoas e compartilhe suas descobertas.</div></div>
          <span style={{fontSize:26,color:"#FFD400"}}>→</span>
        </Link>
      </section>
      <BottomNav/>
    </main>
  );
}

function clampFont() {
  return "clamp(25px, 6vw, 36px)";
}
