export const dynamic = 'force-dynamic';

export default function LoginPage(){
  return (
    <div style={{minHeight:'100vh', background:'#080e1f', color:'white', fontFamily:'Inter, system-ui, sans-serif'}}>
      
      {/* TOPO OTIMIZADO - só imagem OU grade, não os 2 */}
      <div style={{position:'relative', height:'380px', overflow:'hidden', background:'#050a18'}}>
        
        {/* Imagem otimizada - se falhar, mostra cor sólida, não 28 divs */}
        <img 
          src="/banners.jpg" 
          alt=""
          loading="eager"
          style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.7}}
        />

        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(8,14,31,0.1) 0%, #080e1f 92%)'
        }}/>

        {/* CONTEÚDO CENTRAL */}
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'20px'}}>
          <img 
            src="/icon-192.png" 
            alt="Maratonei"
            width={88} height={88}
            style={{borderRadius:'20px', boxShadow:'0 10px 28px rgba(0,0,0,0.5)', marginBottom:'14px', background:'white'}}
          />
          <h1 style={{fontSize:'38px', fontWeight:'900', margin:0, letterSpacing:'-1px'}}>
            Maratonei<span style={{color:'#f5c518'}}>App</span>
          </h1>
          <p style={{fontSize:'14px', color:'#cbd5e1', margin:'6px 0 18px'}}>
            Check-list diário • Organização sem burocracia
          </p>
          <a href="/api/auth/google" style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'white', color:'black', padding:'12px 24px',
            borderRadius:'100px', fontWeight:'800', fontSize:'14px',
            textDecoration:'none'
          }}>
            Entrar com Google
          </a>
        </div>
      </div>

      {/* FEATURES - bem leve */}
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'28px 20px 50px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'12px'}}>
        {[
          ['✅','Check-list diário','Marque em 1 clique'],
          ['🎬','Filmes e séries','Tudo separado'],
          ['⚡️','Sem burocracia','Entrou, usou'],
        ].map(([icon,t,d])=>(
          <div key={t} style={{background:'#111a33', border:'1px solid rgba(255,255,255,0.07)', padding:'18px', borderRadius:'14px'}}>
            <div style={{fontSize:'20px'}}>{icon}</div>
            <div style={{fontWeight:'700', fontSize:'14px', margin:'6px 0 2px'}}>{t}</div>
            <div style={{color:'#94a3b8', fontSize:'12px'}}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
