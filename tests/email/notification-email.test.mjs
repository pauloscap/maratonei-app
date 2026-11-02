import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRawEmail, escapeHtml, isValidRecipient, resolveActionUrl } from '../../lib/email/notification-email.mjs'

test('HTML escaping neutralizes markup and quotes', () => {
  assert.equal(escapeHtml('<script a="x">&\'ok\'</script>'), '&lt;script a=&quot;x&quot;&gt;&amp;&#39;ok&#39;&lt;/script&gt;')
})

test('recipient validation rejects malformed addresses and header injection', () => {
  assert.equal(isValidRecipient('teste@example.com'), true)
  assert.equal(isValidRecipient('not-an-email'), false)
  assert.equal(isValidRecipient('victim@example.com\\r\\nBcc:attacker@example.com'), false)
  assert.equal(isValidRecipient('victim@example.com\r\nBcc:attacker@example.com'), false)
})

test('action URLs stay on the configured origin', () => {
  assert.equal(resolveActionUrl('/perfil/123', 'https://maratoneiapp.com.br').toString(), 'https://maratoneiapp.com.br/perfil/123')
  assert.equal(resolveActionUrl('//evil.example/path').origin, 'https://maratoneiapp.com.br')
  assert.equal(resolveActionUrl('https://evil.example/path').origin, 'https://maratoneiapp.com.br')
  assert.equal(resolveActionUrl('/\\\\evil.example').origin, 'https://maratoneiapp.com.br')
})

test('MIME message is base64url encoded and includes both text and HTML alternatives', () => {
  const raw = buildRawEmail({
    from: 'contatomaratoneiapp@gmail.com',
    to: 'teste@example.com',
    subject: 'Novidade no Maratonei',
    text: 'Olá! Veja a novidade.',
    html: '<p>Olá!</p>'
  })
  const decoded = Buffer.from(raw, 'base64url').toString('utf8')
  assert.match(raw, /^[A-Za-z0-9_-]+$/)
  assert.ok(decoded.includes('multipart/alternative'))
  assert.ok(decoded.includes('text/plain; charset="UTF-8"'))
  assert.ok(decoded.includes('text/html; charset="UTF-8"'))
  assert.ok(decoded.includes('Subject: =?UTF-8?B?' + Buffer.from('Novidade no Maratonei', 'utf8').toString('base64') + '?='))
})
