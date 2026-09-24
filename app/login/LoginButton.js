'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginButton(){
  const supabase = createClientComponentClient();
  
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  return (
    <button 
      onClick={handleLogin}
      style={{
        display:'inline-flex', alignItems:'center', gap:'8px',
        background:'white', color:'black', padding:'12px 24px',
        borderRadius:'100px', fontWeight:'800', fontSize:'14px',
        border:'none', cursor:'pointer'
      }}
    >
      <img src="https://www.google.com/favicon.ico" style={{width:'16px', height:'16px'}} alt=""/> 
      Entrar com Google
    </button>
  )
}
