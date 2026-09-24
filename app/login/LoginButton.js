'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LoginButton(){
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        alert('Erro: Variáveis do Supabase não configuradas');
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        alert('Erro: ' + error.message);
        setLoading(false);
      }
      
    } catch (err) {
      alert('Erro: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogin} 
      disabled={loading}
      style={{
        display:'inline-flex', alignItems:'center', gap:'8px',
        background:'white', color:'black', padding:'12px 24px',
        borderRadius:'100px', fontWeight:'800', fontSize:'14px',
        border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1
      }}
    >
      <img src="https://www.google.com/favicon.ico" style={{width:'16px', height:'16px'}} alt=""/>
      {loading ? 'Carregando...' : 'Entrar com Google'}
    </button>
  )
}
