import LoginButton from './LoginButton';

export const dynamic = 'force-dynamic';

export default function LoginPage(){
  return (
    <div style={{minHeight:'100vh', background:'#080e1f', color:'white', fontFamily:'Inter, sans-serif'}}>
      <div style={{position:'relative', height:'380px', overflow:'hidden', background:'#050a18'}}>
        <img src="/banners.jpg" alt="banners" style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.7}}/>
        <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(8,14,31,0.1) 0%, #080e1f 92%)'}}/>
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'20px'}}>
          <img src="/icon-192.png" alt="Maratonei App" width={88} height={88} style={{borderRadius:'20px', background:'white', marginBottom:'14px'}}/>
          <h1 style={{fontSize:'38px', fontWeight:'900', margin:0}}>Maratonei<span style={{color:'#f5c518'}}>App</span></h1>
          <p style={{fontSize:'14px', color:'#cbd5e1', margin:'6px 0 18px'}}>Check-list diário • Sem burocracia</p>
          <LoginButton />
        </div>
      </div>
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'28px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'12px'}}>
        <div style={{background:'#111a33', padding:'18px', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.07)'}}>✅ Check-list diário</div>
        <div style={{background:'#111a33', padding:'18px', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.07)'}}>🎬 Filmes e séries</div>
        <div style={{background:'#111a33', padding:'18px', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.07)'}}>⚡️ Sem burocracia</div>
      </div>
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'20px', color:'#94a3b8', fontSize:'14px'}}>
        <h2 style={{color:'white'}}>O que é o Maratonei App?</h2>
        <p>O Maratonei App organiza suas maratonas de séries e filmes com check-list diário.</p>
      </div>
    </div>
  )
}
