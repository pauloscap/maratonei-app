'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LoginButton(){
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <button 
      onClick={handleLogin} 
      disabled={loading}
      style={{
        display:'inline-flex',
        alignItems:'center',
        gap:'8px',
        background:'white',
        color:'black',
        padding:'12px 24px',
        borderRadius:'100px',
        fontWeight:'800',
        fontSize:'14px',
        border:'none',
        cursor:'pointer',
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? 'Entrando...' : 'Entrar com Google'}
    </button>
  )
}
