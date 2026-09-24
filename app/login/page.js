export const dynamic = 'force-dynamic';

export default function LoginPage(){
  return (
    <div style={{
      minHeight:'100vh', background:'#6ec1e4', position:'relative', overflow:'hidden',
      fontFamily:'Inter, system-ui, sans-serif'
    }}>
      {/* FILMES NO FUNDO - animado */}
      <div style={{
        position:'absolute', inset:'-40px', opacity:0.35,
        display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'10px',
        transform:'rotate(-4deg) scale(1.2)', pointerEvents:'none'
      }}>
        {[
          '#ff6b6b','#feca57','#48dbfb','#1dd1a1','#5f27cd','#ff9ff3','#54a0ff',
          '#00d2d3','#ff9f43','#10ac84','#ee5253','#0abde3','#f368e0','#00d2d3',
          '#ff9f43','#5f27cd','#48dbfb','#feca57','#ff6b6b','#1dd1a1','#54a0ff'
        ].map((c,i)=>(
          <div key={i} style={{
            height:'150px', borderRadius:'10px', background:c,
            border:'3px solid white', boxShadow:'0 6px 16px rgba(0,0,0,0.15)',
            transform:`rotate(${i%2?3:-3}deg)`, 
            animation:`float ${3+i%3}s ease-in-out infinite`
          }}/>
        ))}
      </div>

      <div style={{position:'relative', maxWidth:'980px', margin:'0 auto', padding:'48px 24px'}}>
        
        {/* LOGO OFICIAL */}
        <div style={{textAlign:'center', marginBottom:'28px'}}>
          <img 
            src="/logo.png" 
            alt="Maratonei App"
            style={{
              width:'140px', height:'140px', borderRadius:'32px',
              boxShadow:'0 16px 40px rgba(0,0,0,0.25)', margin:'0 auto 20px',
              display:'block', background:'white'
            }}
          />
          <h1 style={{fontSize:'48px', fontWeight:'900', color:'white', margin:0, textShadow:'0 2px 12px rgba(0,0,0,0.2)', letterSpacing:'-1px'}}>
            Maratonei<span style={{color:'#FFD600'}}>App</span>
          </h1>
        </div>

        {/* HERO */}
        <div style={{textAlign:'center', maxWidth:'640px', margin:'0 auto', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', borderRadius:'24px', padding:'32px 28px', boxShadow:'0 16px 40px rgba(0,0,0,0.15)', border:'2px solid white'}}>
          <h2 style={{fontSize:'26px', fontWeight:'800', color:'#0f172a', lineHeight:'1.2', margin:'0 0 12px'}}>
            Sua maratona, organizada. De verdade.
          </h2>
          <p style={{fontSize:'16px', color:'#475569', lineHeight:'1.5', margin:'0 0 24px'}}>
            Chega de anotar no bloco de notas. Controle o que já viu e o que quer ver, sem burocracia.
          </p>

          <a href="/api/auth/google" style={{
            display:'inline-flex', alignItems:'center', gap:'12px',
            background:'#0f172a', color:'white', padding:'16px 32px',
            borderRadius:'100px', fontWeight:'bold', fontSize:'17px',
            textDecoration:'none', boxShadow:'0 8px 20px rgba(0,0,0,0.2)'
          }}>
            <span style={{background:'white', borderRadius:'50%', width:'22px', height:'22px', display:'flex', alignItems:'center', justifyContent:'center', color:'black', fontWeight:'900'}}>G</span>
            Entrar com Google
          </a>
        </div>

        {/* 3 FEATURES PEDIDAS */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'16px', marginTop:'28px'}}>
          <div style={{background:'white', padding:'22px', borderRadius:'20px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
            <div style={{fontSize:'26px'}}>✅</div>
            <h3 style={{fontWeight:'800', color:'#0f172a', margin:'8px 0 6px'}}>Check-list diário</h3>
            <p style={{color:'#64748b', fontSize:'14px', margin:0, lineHeight:'1.4'}}>Marque o que assistiu hoje em 1 clique. Seu histórico fica salvo.</p>
          </div>
          <div style={{background:'white', padding:'22px', borderRadius:'20px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
            <div style={{fontSize:'26px'}}>🎬</div>
            <h3 style={{fontWeight:'800', color:'#0f172a', margin:'8px 0 6px'}}>Filmes e séries organizados</h3>
            <p style={{color:'#64748b', fontSize:'14px', margin:0, lineHeight:'1.4'}}>Listas separadas, busca rápida e sem bagunça. Tudo no seu jeito.</p>
          </div>
          <div style={{background:'white', padding:'22px', borderRadius:'20px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
            <div style={{fontSize:'26px'}}>⚡️</div>
            <h3 style={{fontWeight:'800', color:'#0f172a', margin:'8px 0 6px'}}>Sem burocracia</h3>
            <p style={{color:'#64748b', fontSize:'14px', margin:0, lineHeight:'1.4'}}>Entrou com Google, já está dentro. Nada de formulários chatos.</p>
          </div>
        </div>

      </div>

      <style>{`@keyframes float{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-6px) rotate(var(--r,0deg))}}`}</style>
    </div>
  )
}
