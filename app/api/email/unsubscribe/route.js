import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

function getUserIdAndValidate(token, secret) {
  const [userId, signature, extra] = String(token || '').split('.')
  if (extra || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || '') || !signature) return ''
  const expected = createHmac('sha256', secret).update(userId).digest('hex')
  const suppliedBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return ''
  return userId
}

function htmlPage(message, form = '') {
  return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preferências de e-mail • Maratonei</title><body style="margin:0;background:#080B1F;color:#fff;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px"><main style="max-width:440px;background:#12182F;border:1px solid #ffffff20;border-radius:16px;padding:28px;text-align:center"><div style="font-size:25px;font-weight:900;color:#FACC15">🍿 MARATONEI</div><h1 style="font-size:22px;margin:22px 0 12px">Preferências da newsletter</h1><p style="color:#CBD5E1;line-height:1.6">' + message + '</p>' + form + '</main></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function getContext(request) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!secret || !supabaseUrl) return { error: true }
  const token = new URL(request.url).searchParams.get('token')
  const userId = getUserIdAndValidate(token, secret)
  if (!userId) return { error: true }
  const supabase = createClient(supabaseUrl, secret, { auth: { autoRefreshToken: false, persistSession: false } })
  return { userId, supabase }
}

export async function GET(request) {
  const context = getContext(request)
  if (context.error) return htmlPage('Este link é inválido ou expirou. Se precisar, entre em contato com o Maratonei.')
  const token = new URL(request.url).searchParams.get('token')
  const form = '<form method="post" action="/api/email/unsubscribe?token=' + encodeURIComponent(token) + '"><button type="submit" style="background:#FACC15;color:#080B1F;border:0;border-radius:9px;padding:13px 18px;font-weight:900;cursor:pointer">Cancelar recebimento</button></form>'
  return htmlPage('Se não quiser mais receber as newsletters do Maratonei, confirme abaixo. Isso não exclui sua conta.', form)
}

export async function POST(request) {
  const context = getContext(request)
  if (context.error) return htmlPage('Este link é inválido ou expirou. Não foi possível alterar suas preferências.')
  const { data: userData, error: userError } = await context.supabase.auth.admin.getUserById(context.userId)
  if (userError || !userData?.user?.email) return htmlPage('Não foi possível localizar a conta associada a este link.')
  const { error } = await context.supabase.from('newsletter_unsubscribes').upsert({
    user_id: context.userId,
    email: userData.user.email,
    unsubscribed_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
  if (error) return htmlPage('Não foi possível salvar seu cancelamento agora. Tente novamente mais tarde.')
  return htmlPage('Pronto! O recebimento de newsletters foi cancelado para este endereço. Sua conta e as demais notificações não foram alteradas.')
}
