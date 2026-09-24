export const dynamic = 'force-dynamic';

export default function LoginPage(){
  return (
    <div style={{minHeight:'100vh', background:'#080e1f', color:'white', fontFamily:'Inter, system-ui, sans-serif', overflowX:'hidden'}}>
      
      {/* TOPO - MOSAICO DE BANNERS REAIS igual sua referência */}
      <div style={{position:'relative', height:'420px', overflow:'hidden', background:'#050a18'}}>
        {/* usa a imagem que você mandou */}
        <img 
          src="/banners.jpg" 
          alt="Séries e filmes"
          style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.85}}
          onError={(e)=> e.target.style.display='none'}
        />
        {/* fallback se não tiver banners.jpg - grade de títulos reais */}
        <div style={{
          position:'absolute', inset:0, display:'grid', 
          gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'4px', padding:'8px',
          opacity:0.6
        }}>
          {[
            'GAME OF THRONES','BREAKING BAD','STRANGER THINGS','FRIENDS','THE CROWN',
            'THE OFFICE','PEAKY BLINDERS','SHERLOCK','BETTER CALL SAUL','MONEY HEIST',
            'DEXTER','HOUSE','SUCCESSION','THE WITCHER','LOST','TWIN PEAKS',
            'OZARK','NARCOS','TRUE DETECTIVE','AVATAR','MANDALORIAN','SUITS',
            'ATLANTA','THE QUEEN GAMBIT','TED LASSO','VIKINGS','DARK','ARRESTED DEVELOPMENT'
          ].map(t=>(
            <div key={t} style={{
              background:`linear-gradient(135deg, #151e35 0%, #0f172a 100%)`,
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:'4px',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'10px', fontWeight:'900', letterSpacing:'1px',
              color:'rgba(255,255,255,0.7)', padding:'20px 8px', textAlign:'center'
            }}>{t}</div>
          ))}
        </div>

        {/* DEGRADE PRA AZUL ESCURO DOMINAR */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(8,14,31,0.2) 0%, rgba(8,14,31,0.6) 50%, #080e1f 100%)'
        }}/>

        {/* LOGO + CTA SOBRE O MOSAICO */}
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'24px'}}>
          <img 
            src="/icon-192.png" 
            alt="Maratonei"
            style={{width:'96px', height:'96px', borderRadius:'22px', boxShadow:'0 12px 32px rgba(0,0,0,0.5)', marginBottom:'16px', background:'white'}}
          />
          <h1 style={{fontSize:'42px', fontWeight:'900', margin:0, letterSpacing:'-1px', textShadow:'0 2px 20px rgba(0,0,0,0.6)'}}>
            Maratonei<span style={{color:'#f5c518'}}>App</span>
          </h1>
          <p style={{fontSize:'15px', color:'#cbd5e1', maxWidth:'520px', margin:'8px 0 20px', lineHeight:'1.4', textShadow:'0 1px 8px rgba(0,0,0,0.8)'}}>
            Sua maratona organizada. Check-list diário, sem burocracia.
          </p>
          <a href="/api/auth/google" style={{
            display:'inline-flex', alignItems:'center', gap:'10px',
            background:'white', color:'black', padding:'14px 28px',
            borderRadius:'100px', fontWeight:'800', fontSize:'15px',
            textDecoration:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <img src="https://www.google.com/favicon.ico" style={{width:'18px', height:'18px'}} alt=""/> Entrar com Google
          </a>
        </div>
      </div>

      {/* FEATURES - AZUL ESCURO DOMINANTE */}
      <div style={{maxWidth:'980px', margin:'0 auto', padding:'36px 24px 60px'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px'}}>
          <div style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.08)', padding:'22px', borderRadius:'16px'}}>
            <div style={{fontSize:'24px', marginBottom:'8px'}}>✅</div>
            <h3 style={{fontWeight:'800', margin:'0 0 6px', fontSize:'15px'}}>Check-list diário</h3>
            <p style={{color:'#94a3b8', fontSize:'13px', margin:0, lineHeight:'1.4'}}>Marque o que assistiu hoje em 1 clique. Histórico salvo na nuvem.</p>
          </div>
          <div style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.08)', padding:'22px', borderRadius:'16px'}}>
            <div style={{fontSize:'24px', marginBottom:'8px'}}>🎬</div>
            <h3 style={{fontWeight:'800', margin:'0 0 6px', fontSize:'15px'}}>Filmes e séries organizados</h3>
            <p style={{color:'#94a3b8', fontSize:'13px', margin:0, lineHeight:'1.4'}}>Listas separadas e busca rápida. Sem bagunça.</p>
          </div>
          <div style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.08)', padding:'22px', borderRadius:'16px'}}>
            <div style={{fontSize:'24px', marginBottom:'8px'}}>⚡️</div>
            <h3 style={{fontWeight:'800', margin:'0 0 6px', fontSize:'15px'}}>Sem burocracia</h3>
            <p style={{color:'#94a3b8', fontSize:'13px', margin:0, lineHeight:'1.4'}}>Entrou com Google, já pode usar. Zero cadastro chato.</p>
          </div>
        </div>

        <div style={{textAlign:'center', marginTop:'36px', color:'#475569', fontSize:'12px'}}>
          Maratonei App • Organize suas maratonas • Feito pra quem ama cinema
        </div>
      </div>
    </div>
  )
}
