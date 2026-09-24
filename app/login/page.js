export const dynamic = 'force-dynamic';

export default function LoginPage(){
  return (
    <div style={{minHeight:'100vh', background:'#0a0f1e', color:'white', fontFamily:'Inter, sans-serif'}}>
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'60px 24px', textAlign:'center'}}>
        
        <h1 style={{fontSize:'48px', fontWeight:'900', marginBottom:'16px'}}>
          <span style={{color:'#f5c518'}}>Maratonei</span> App
        </h1>
        
        <h2 style={{fontSize:'20px', color:'#cbd5e1', maxWidth:'600px', margin:'0 auto 32px', lineHeight:'1.4'}}>
          Pare de se perder no que já assistiu. Organize suas séries e filmes em uma watchlist inteligente.
        </h2>
        
        <a href="/api/auth/google" style={{
          display:'inline-flex', alignItems:'center', gap:'12px',
          background:'white', color:'black', padding:'16px 32px',
          borderRadius:'12px', fontWeight:'bold', fontSize:'18px',
          textDecoration:'none'
        }}>
          <img src="https://www.google.com/favicon.ico" style={{width:'20px', height:'20px'}} alt="Google"/> 
          Entrar com Google
        </a>
        <p style={{fontSize:'12px', color:'#64748b', marginTop:'12px'}}>Grátis, rápido e seguro • 18 usuários • 221 títulos salvos</p>

        <div style={{marginTop:'48px', background:'#151a2d', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'16px', textAlign:'left'}}>
          <div style={{background:'#0a0f1e', borderRadius:'12px', padding:'16px', color:'#94a3b8', fontSize:'14px'}}>
            📊 Hoje: 18 usuários • 221 watchlists • Top: Minha Melhor Amiga (4 saves) • Gêneros: Aventura 79x
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px', marginTop:'32px', textAlign:'left'}}>
          <div style={{background:'#151a2d', padding:'24px', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontWeight:'bold', marginBottom:'8px'}}>Sua Watchlist em um lugar</h3>
            <p style={{color:'#94a3b8', fontSize:'14px'}}>Salve filmes e séries que quer assistir e marque como visto.</p>
          </div>
          <div style={{background:'#151a2d', padding:'24px', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontWeight:'bold', marginBottom:'8px'}}>Acompanhe seu progresso</h3>
            <p style={{color:'#94a3b8', fontSize:'14px'}}>Média por usuário e seus gêneros favoritos em tempo real.</p>
          </div>
          <div style={{background:'#151a2d', padding:'24px', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontWeight:'bold', marginBottom:'8px'}}>Top da galera</h3>
            <p style={{color:'#94a3b8', fontSize:'14px'}}>Descubra o que todo mundo está maratonando agora.</p>
          </div>
        </div>

        <div style={{marginTop:'48px', color:'#64748b', fontSize:'14px', lineHeight:'1.6'}}>
          <h3 style={{color:'white', fontWeight:'bold', marginBottom:'8px'}}>O que é o Maratonei App?</h3>
          <p>O Maratonei App é a ferramenta definitiva para quem ama maratonar séries e filmes. Crie sua lista pessoal e veja estatísticas reais do que está bombando.</p>
        </div>

      </div>
    </div>
  )
}
