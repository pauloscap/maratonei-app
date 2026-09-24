'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback(){
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // O Supabase já salva a sessão automaticamente quando tem #access_token na URL
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/'); // muda pra '/series' ou '/ranking' se quiser
      } else {
        // Se ainda não pegou, espera o evento de login
        supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            router.push('/');
          }
        });
      }
    };

    checkSession();
  }, [router]);

  return (
    <div style={{minHeight:'100vh', background:'#080e1f', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'24px', marginBottom:'12px'}}>🔄</div>
        <div style={{fontWeight:'700'}}>Entrando...</div>
        <div style={{color:'#94a3b8', fontSize:'13px', marginTop:'4px'}}>Só um segundo</div>
      </div>
    </div>
  )
}
