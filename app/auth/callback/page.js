'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const params = new URLSearchParams(window.location.search);
    const requestedPath = params.get('next') || '/';
    const destination = requestedPath.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/';

    let redirected = false;
    const goToDestination = () => {
      if (redirected) return;
      redirected = true;
      router.replace(destination);
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) goToDestination();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goToDestination();
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{minHeight:'100vh', background:'#080e1f', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'24px', marginBottom:'12px'}}>🔄</div>
        <div style={{fontWeight:'700'}}>Concluindo seu acesso...</div>
        <div style={{color:'#94a3b8', fontSize:'13px', marginTop:'4px'}}>Só um segundo</div>
      </div>
    </div>
  );
}
