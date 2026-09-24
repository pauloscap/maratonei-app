import LoginButton from './LoginButton';

export const dynamic = 'force-dynamic';

export default function LoginPage(){
  return (
    <div style={{minHeight:'100vh', background:'#080e1f', color:'white', fontFamily:'Inter, system-ui, sans-serif'}}>
      
      <div style={{position:'relative', height:'380px', overflow:'hidden', background:'#050a18'}}>
        <img src="/banners.jpg" alt="Maratonei App - séries e filmes" style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.7}}/>
        <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(8,14,31,0.1) 0%, #080e1f 92%)'}}/>
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'20px'}}>
          <img src="/icon-192.png" alt="Maratonei App Logo" width={88} height={88} style={{borderRadius:'20px', background:'white', marginBottom:'14px', boxShadow:'0 10px 28px rgba(0,0,0,0.5)'}}/>
          <h1 style={{fontSize:'38px', fontWeight:'900', margin:0, letterSpacing:'-1px'}}>Maratonei<span style={{color:'#f5c518'}}>App</span></h1>
          <h2 style={{fontSize:'14px', color:'#cbd5e1', margin:'6px 0 18px', fontWeight:'400'}}>Check-list diário • Organização sem burocracia</h2>
          <LoginButton />
        </div>
      </div>

      <div style={{maxWidth:'900px', margin:'0 auto', padding:'28px 20px 0', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'12px'}}>
        <div style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.07)', padding:'18px', borderRadius:'14px'}}>
          <div style={{fontSize:'20px'}}>✅</div>
          <div style={{fontWeight:'700', fontSize:'14px', margin:'6px 0 2px'}}>Check-list diário</div>
          <div style={{color:'#94a3b8', fontSize:'12px'}}>Marque em 1 clique</div>
        </div>
        <div style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.07)', padding:'18px', borderRadius:'14px'}}>
          <div style={{fontSize:'20px'}}>🎬</div>
          <div style={{fontWeight:'700', fontSize:'14px', margin:'6px 0 2px'}}>Filmes e séries</div>
          <div style={{color:'#94a3b8', fontSize:'12px'}}>Tudo separado</div>
        </div>
        <div style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.07)', padding:'18px', borderRadius:'14px'}}>
          <div style={{fontSize:'20px'}}>⚡️</div>
          <div style={{fontWeight:'700', fontSize:'14px', margin:'6px 0 2px'}}>Sem burocracia</div>
          <div style={{color:'#94a3b8', fontSize:'12px'}}>Entrou, usou</div>
        </div>
      </div>

      <div style={{maxWidth:'900px', margin:'0 auto', padding:'48px 20px 60px'}}>
        <div style={{background:'rgba(17,26,51,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'28px'}}>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'white', margin:'0 0 10px'}}>O que é o Maratonei App?</h2>
          <p style={{color:'#94a3b8', fontSize:'14px', lineHeight:'1.6', margin:'0 0 20px'}}>
            O <strong style={{color:'#e2e8f0'}}>Maratonei App</strong> é o aplicativo definitivo para quem ama maratonar séries e filmes. 
            Cansado de esquecer onde parou ou o que queria assistir? Com o Maratonei você cria sua lista pessoal, 
            organiza por filmes e séries e controla seu progresso com um check-list diário simples. 
            Sem cadastro chato, sem burocracia. Entrou com Google, já pode usar.
          </p>
          <h3 style={{fontSize:'15px', fontWeight:'700', color:'white', margin:'0 0 8px'}}>Como funciona?</h3>
          <p style={{color:'#94a3b8', fontSize:'13px', lineHeight:'1.6', margin:'0 0 20px'}}>
            1. Faça login com Google em 5 segundos. 2. Adicione filmes e séries à sua watchlist. 
            3. Marque no check-list diário o que já assistiu. Pronto. Sua maratona fica organizada automaticamente.
          </p>
          <h3 style={{fontSize:'15px', fontWeight:'700', color:'white', margin:'0 0 8px'}}>Por que usar o MaratoneiApp.com.br?</h3>
          <p style={{color:'#94a3b8', fontSize:'13px', lineHeight:'1.6', margin:0}}>
            Diferente de outros apps, o Maratonei App foi feito para ser rápido e sem burocracia. 
            Interface em azul escuro que não cansa a vista, organização inteligente e foco no que importa.
          </p>
        </div>
        <p style={{textAlign:'center', marginTop:'28px', color:'#334155', fontSize:'11px'}}>maratonei app • maratoneiapp.com.br • app de séries e filmes • watchlist</p>
      </div>
    </div>
  )
}
