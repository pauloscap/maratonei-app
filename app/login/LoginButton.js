'use client';
import { createClient } from '@supabase/supabase-js';

export default function LoginButton(){
  const login = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  };
  return (
    <button onClick={login} style={{background:'white', color:'black', padding:'12px 24px', borderRadius:'100px', fontWeight:'800', border:'none', cursor:'pointer'}}>
      Entrar com Google
    </button>
  )
}
