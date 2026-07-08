'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Login() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.push('/')
    }
  }

  async function signInWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    
    if (error) {
      console.error('Erro ao fazer login:', error)
      setLoading(false)
    }
  }

  return (
    <main className="main" style={{
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '400px', 
        width: '100%', 
        textAlign: 'center',
        padding: '40px 24px'
      }}>
        <h1 style={{
          color: '#FACC15', 
          fontSize: '32px', 
          marginBottom: '8px',
          fontWeight: 'bold'
        }}>
          Maratonei
        </h1>
        
        <p style={{
          color: '#94A3B8', 
          marginBottom: '32px',
          fontSize: '16px'
        }}>
          Controle suas maratonas de séries
        </p>
        
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#94A3B8' : '#fff',
            color: '#000',
            border: 'none',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            'Carregando...'
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        <p style={{
          color: '#64748B', 
          fontSize: '12px', 
          marginTop: '24px',
          lineHeight: '1.5'
        }}>
          Ao entrar, você concorda em salvar seu progresso de forma segura
        </p>
      </div>
    </main>
  )
}
