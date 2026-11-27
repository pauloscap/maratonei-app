"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupa } from "../../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando seu acesso...");

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      const supabase = getSupa();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const authError =
        params.get("error_description") ||
        params.get("error");

      if (authError) {
        if (active) setMessage("Não foi possível concluir o login. Volte e tente novamente.");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Falha ao trocar código OAuth por sessão:", error.message);
          if (active) setMessage("Não foi possível confirmar seu acesso. Tente entrar novamente.");
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setMessage("Não encontramos uma sessão ativa. Volte e entre novamente.");
        return;
      }

      router.replace("/");
    }

    finishLogin().catch((error) => {
      console.error("Erro ao finalizar autenticação:", error);
      if (active) setMessage("Ocorreu um erro ao concluir o login. Tente novamente.");
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main style={{minHeight:"100vh",background:"#080e1f",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter, sans-serif",padding:24}}>
      <div style={{textAlign:"center",maxWidth:340}}>
        <div style={{fontSize:24,marginBottom:12}}>🔄</div>
        <div style={{fontWeight:700}}>Entrando no Maratonei...</div>
        <div style={{color:"#94a3b8",fontSize:13,marginTop:8}}>{message}</div>
      </div>
    </main>
  );
}
