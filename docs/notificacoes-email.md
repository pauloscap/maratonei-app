# Notificações por e-mail — preparação

Esta funcionalidade está preparada em branch separada e **não deve ser ativada em produção antes da aprovação da migration e da configuração dos segredos**.

## O que está incluído

- Preferências individuais e opt-in para e-mails de novo seguidor e comentário em episódio.
- Fila de saída vinculada à notificação interna já existente.
- Gatilho PostgreSQL que cria uma mensagem na fila somente quando o usuário ativar a categoria correspondente.
- Endpoint Next.js que valida um segredo, consulta a fila com a chave administrativa e envia pelo Resend.
- O endpoint marca mensagens como enviadas ou falhas; não faz repetição automática para evitar e-mails duplicados.

## Migration

Revisar e aplicar manualmente, somente após autorização:

`supabase/migrations/202611020001_notification_email_preferences.sql`

A migration cria:
- `notification_email_preferences`: preferências do próprio usuário, protegidas por RLS.
- `notification_email_outbox`: fila sem acesso direto para usuários anon/authenticated.
- Trigger `trigger_enqueue_notification_email` em `public.notificacoes`.

## Segredos necessários na Vercel

Configurar como variáveis **Sensitive/Encrypted**, inicialmente apenas no ambiente Production:

- `SUPABASE_SERVICE_ROLE_KEY`: chave service_role do projeto Supabase (nunca expor no browser).
- `RESEND_API_KEY`: chave de API do Resend.
- `RESEND_FROM_EMAIL`: remetente autorizado/verificado no Resend, por exemplo `Maratonei <notificacoes@seudominio.com>`.
- `SUPABASE_EMAIL_WEBHOOK_SECRET`: segredo aleatório forte compartilhado com o webhook.
- `NEXT_PUBLIC_APP_URL`: URL canônica do Maratonei, por exemplo `https://maratoneiapp.com.br`.

A variável `NEXT_PUBLIC_SUPABASE_URL` já é usada pelo aplicativo. Não criar uma segunda chave pública.

## Webhook no Supabase

Depois de aplicar a migration e publicar o endpoint:
1. No Dashboard do Supabase, abrir Database → Webhooks.
2. Criar webhook para tabela `public.notification_email_outbox`, evento `INSERT`.
3. Método `POST), URL `https://maratoneiapp.com.br/api/webhooks/notification-email`.
4. Adicionar header `Authorization: Bearer <mesmo valor de SUPABASE_EMAIL_WEBHOOK_SECRET>`.
5. Salvar e testar com uma conta que tenha optado por receber uma notificação.

O webhook só deve ser habilitado depois de o endpoint e os segredos estarem configurados. Não habilitar em Preview, pois os previews usam o mesmo projeto Supabase real.

## Limites desta primeira versão

- Cobre novos seguidores e comentários em episódios.
- Curtidas não foram incluídas porque o fluxo atual não cria uma notificação interna para elas.
- Alertas de novos episódios ficam para a segunda etapa; exigem monitoramento dos lançamentos e deduplicação por série/temporada/episódio.
- Não há campanha de marketing nem e-mails automáticos para usuários que não deram opt-in.
- O endpoint não reenvia automaticamente mensagens que falharam. A falha fica registrada para análise operacional.

## Segurança e privacidade

- O e-mail de destino vem do usuário autenticado no Supabase, não de um campo livre.
- As preferências começam desativadas.
- A chave service_role e a chave do Resend ficam somente no servidor.
- O outbox não recebe políticas de leitura/escrita para anon ou authenticated.
- Nenhuma migration ou segredo deve ser aplicado por automação a produção sem revisão e autorização.
