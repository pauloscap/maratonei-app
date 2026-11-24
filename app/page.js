import Link from "next/link";

export const metadata = {
  title: "Maratonei App | Filmes, séries e comunidade",
  description: "Acompanhe filmes, séries e episódios, organize sua lista e compartilhe suas maratonas com a comunidade Maratonei App."
};

const features = [
  { number: "01", title: "Acompanhe suas séries", description: "Registre temporadas e episódios concluídos e saiba exatamente onde sua maratona parou.", symbol: "▣" },
  { number: "02", title: "Organize seus filmes", description: "Guarde o que quer assistir, registre o que já viu e mantenha seu histórico em um só lugar.", symbol: "▶" },
  { number: "03", title: "Compartilhe com a comunidade", description: "Siga outros maratoneiros, acompanhe atividades, publique check-ins e converse sobre episódios.", symbol: "◎" }
];

export default function PublicHome() {
  return (
    <main style={{minHeight:"100vh",background:"#080B14",color:"#F5F6FA",fontFamily:"'Sora',Inter,system-ui,sans-serif"}}>
      <header style={{maxWidth:1160,margin:"0 auto",padding:"22px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:18}}>
        <Link href="/" aria-label="Maratonei App — página inicial" style={{display:"flex",alignItems:"center",gap:11,textDecoration:"none",color:"inherit"}}>
          <img src="/icon-192.png" alt="Logo Maratonei App" width="44" height="44" style={{width:44,height:44,borderRadius:13,objectFit:"cover"}}/>
          <span style={{fontSize:19,fontWeight:900,letterSpacing:-.7}}>Maratonei <span style={{color:"#FFD21A"}}>App</span></span>
        </Link>
        <nav aria-label="Navegação principal" style={{display:"flex",alignItems:"center",gap:20}}>
          <a href="#recursos" style={{color:"#B8C0D0",fontSize:13,textDecoration:"none"}}>Recursos</a>
          <Link href="/politica-de-privacidade" style={{color:"#B8C0D0",fontSize:13,textDecoration:"none"}}>Privacidade</Link>
          <Link href="/login" style={{background:"#FFD21A",color:"#111318",fontSize:13,fontWeight:900,textDecoration:"none",padding:"11px 18px",borderRadius:999}}>Entrar</Link>
        </nav>
      </header>

      <section style={{maxWidth:1160,margin:"0 auto",padding:"22px 24px 42px"}}>
        <div style={{position:"relative",isolation:"isolate",overflow:"hidden",minHeight:440,borderRadius:30,border:"1px solid #ffffff18",background:"#111827",display:"flex",alignItems:"center"}}>
          <div aria-hidden="true" style={{position:"absolute",inset:0,zIndex:-2,backgroundImage:"url('/banners.jpg')",backgroundSize:"cover",backgroundPosition:"center 35%",opacity:.42}}/>
          <div aria-hidden="true" style={{position:"absolute",inset:0,zIndex:-1,background:"linear-gradient(90deg,rgba(8,11,20,.98) 0%,rgba(8,11,20,.88) 48%,rgba(8,11,20,.35) 100%),linear-gradient(0deg,rgba(8,11,20,.55),transparent 65%)"}}/>
          <div style={{padding:"clamp(30px,6vw,72px)",maxWidth:760}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,color:"#FFD21A",fontSize:11,fontWeight:900,letterSpacing:2.2,textTransform:"uppercase",marginBottom:20}}>
              <span aria-hidden="true">🍿</span> Seu universo de entretenimento
            </div>
            <h1 style={{fontSize:"clamp(38px,6vw,68px)",lineHeight:1.02,letterSpacing:-2.5,fontWeight:900,margin:"0 0 22px",maxWidth:720}}>
              Sua próxima maratona começa <span style={{color:"#FFD21A"}}>aqui.</span>
            </h1>
            <p style={{fontSize:"clamp(15px,2vw,18px)",lineHeight:1.75,color:"#D0D5E0",maxWidth:610,margin:"0 0 30px"}}>
              O Maratonei App é uma plataforma para quem ama filmes e séries. Organize o que deseja assistir, acompanhe cada episódio e compartilhe suas descobertas com uma comunidade de fãs.
            </p>
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12}}>
              <Link href="/login" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#FFD21A",color:"#111318",padding:"14px 23px",borderRadius:999,fontWeight:900,fontSize:14,textDecoration:"none"}}>
                Acessar o Maratonei <span aria-hidden="true" style={{marginLeft:9,fontSize:18}}>→</span>
              </Link>
              <a href="#recursos" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",border:"1px solid #ffffff50",color:"#F5F6FA",padding:"13px 21px",borderRadius:999,fontWeight:700,fontSize:13,textDecoration:"none"}}>
                Conhecer recursos
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" style={{maxWidth:1160,margin:"0 auto",padding:"30px 24px 76px"}}>
        <div style={{maxWidth:650,marginBottom:28}}>
          <div style={{color:"#FFD21A",fontSize:10,fontWeight:900,letterSpacing:2.4,textTransform:"uppercase",marginBottom:10}}>Muito além de uma lista</div>
          <h2 style={{fontSize:"clamp(27px,4vw,42px)",lineHeight:1.15,letterSpacing:-1.2,margin:"0 0 13px",fontWeight:900}}>Tudo o que você acompanha. Tudo o que você compartilha.</h2>
          <p style={{color:"#AEB7C8",fontSize:14,lineHeight:1.75,margin:0}}>O Maratonei reúne organização pessoal e experiências sociais para deixar suas sessões de filmes e séries ainda mais completas.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14}}>
          {features.map(feature => (
            <article key={feature.number} style={{padding:24,borderRadius:20,background:"linear-gradient(145deg,#151B2A,#101521)",border:"1px solid #ffffff13",minHeight:205}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
                <span style={{width:42,height:42,borderRadius:13,display:"grid",placeItems:"center",background:"#FFD21A18",color:"#FFD21A",fontSize:22}}>{feature.symbol}</span>
                <span style={{fontSize:11,color:"#727D91",fontWeight:800,letterSpacing:1.5}}>{feature.number}</span>
              </div>
              <h3 style={{fontSize:17,fontWeight:900,margin:"0 0 10px"}}>{feature.title}</h3>
              <p style={{fontSize:13,lineHeight:1.7,color:"#AEB7C8",margin:0}}>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{maxWidth:1160,margin:"0 auto",padding:"0 24px 76px"}}>
        <div style={{borderRadius:24,padding:"30px clamp(22px,5vw,48px)",background:"linear-gradient(110deg,#24243A,#171D2C)",border:"1px solid #ffffff16",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:22}}>
          <div style={{maxWidth:650}}>
            <div style={{color:"#FFD21A",fontSize:10,fontWeight:900,letterSpacing:2,textTransform:"uppercase",marginBottom:9}}>Sua comunidade de maratonas</div>
            <h2 style={{fontSize:"clamp(22px,3vw,30px)",lineHeight:1.2,margin:"0 0 9px",fontWeight:900}}>Cada episódio rende uma conversa.</h2>
            <p style={{fontSize:13,lineHeight:1.7,color:"#B8C0D0",margin:0}}>Descubra o que seus amigos estão assistindo, acompanhe check-ins e participe de conversas sobre filmes e episódios.</p>
          </div>
          <Link href="/login" style={{background:"#FFD21A",color:"#111318",padding:"13px 21px",borderRadius:999,fontSize:13,fontWeight:900,textDecoration:"none",whiteSpace:"nowrap"}}>Começar agora</Link>
        </div>
      </section>

      <footer style={{borderTop:"1px solid #ffffff16",padding:"28px 24px 36px",color:"#8E98AA"}}>
        <div style={{maxWidth:1160,margin:"0 auto",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#F5F6FA",marginBottom:5}}>Maratonei <span style={{color:"#FFD21A"}}>App</span></div>
            <p style={{fontSize:11,lineHeight:1.6,margin:0}}>Uma plataforma independente para acompanhar filmes, séries e compartilhar experiências.</p>
          </div>
          <nav aria-label="Links institucionais" style={{display:"flex",flexWrap:"wrap",gap:18,fontSize:12}}>
            <Link href="/politica-de-privacidade" style={{color:"#C3CAD6"}}>Política de Privacidade</Link>
            <Link href="/termos-de-uso" style={{color:"#C3CAD6"}}>Termos de Uso</Link>
            <a href="mailto:contatomaratoneiapp@gmail.com" style={{color:"#C3CAD6"}}>Contato</a>
          </nav>
        </div>
        <p style={{maxWidth:1160,margin:"22px auto 0",fontSize:10,lineHeight:1.7,color:"#697386"}}>
          O Maratonei App utiliza os serviços do Google para autenticação e envio de comunicações por e-mail. O uso das informações recebidas das APIs do Google segue os requisitos de uso limitado (Limited Use) do Google. Não utiliza APIs do Google para criar, gerar ou distribuir imagens íntimas não consensuais (NCII), inclusive conteúdo gerado por inteligência artificial.
        </p>
        <p style={{maxWidth:1160,margin:"10px auto 0",fontSize:10,color:"#596477"}}>© {new Date().getFullYear()} Maratonei App. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
