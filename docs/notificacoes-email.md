# Notificações por e-mail — preparação

Esta funcionalidade está preparada em branch separada e **não deve ser ativada em produção antes da aprovação da migration, da autorização OAuth do Gmail e da configuração dos segredos**.

## O que está incluído

- Preferências individuais e opt-in para e-mails de novo seguidor e comentário em episódio.
- Fila de saída vinculada à notificação interna já existente.
- Gatilho PostgreSQL que cria uma mensagem na fila somente quando o usuário ativar a categoria correspondente.
- Endpoint Next.js que valida um segredo, consulta a fila com a chave administrativa e envia pela API oficial do Gmail.
- O endpoint marca mensagens como enviadas ou falhas; não faz repetição automática para evitar e-mails duplicados.

## Migration

Revisar e aplicar manualmente, somente após autorização:

`supabase/migrations/202611020001_notification_email_preferences.sql`

A migration cria:
- `notification_email_preferences`: preferências do próprio usuário, protegidas por RLS.
- `notification_email_outbox`: fila sem acesso direto para usuários anon/authenticated.
- Trigger `trigger_enqueue_notification_email` em `public.notificacoes`.

## Configuração do Google

A conta remetente será **contatomaratoneiapp@gmail.com**. O envio usa Gmail API com OAuth 2.0 e solicita somente o escopo `https://www.googleapis.com/auth/gmail.send` (enviar e-mail em nome da conta). O aplicativo não recebe nem armazena a senha do Gmail.

1. No Google Cloud Console, crie ou selecione um projeto e habilite **Gmail API**.
2. Configure a tela de consentimento OAuth. Adicione a conta remetente como usuário de teste enquanto o app estiver em teste.
3. Crie um OAuth Client ID do tipo **Web application**.
4. Para obter o token inicial, use o OAuth 2.0 Playground com suas próprias credenciais OAuth: marque a opção para usar seu próprio OAuth client, informe Client ID e Client Secret, selecione o escopo `https://www.googleapis.com/auth/gmail.send`, autorize com **contatomaratoneiapp@gmail.com** e troque o código por tokens.
5. Guarde o **refresh token** gerado em local seguro. Não o envie pelo chat, não o coloque no código e não o compartilhe.

A autorização precisa ser concedida pela própria conta remetente. O token de atualização permite renovar tokens de acesso sem nova interação. Se a tela OAuth permanecer em modo de teste, o Google pode limitar a duração do refresh token; antes de produção, é necessário revisar o status de publicação e os requisitos de verificação aplicáveis ao escopo Gmail.

## Variáveis necessárias na Vercel

Configurar como variáveis **Sensitive/Encrypted**, inicialmente apenas no ambiente Production, depois da revisão:

- `SUPABASE_SERVICE_ROLE_KEY`: chave service_role do projeto Supabase (nunca expor no browser).
- `GMAIL_CLIENT_ID`: Client ID OAuth criado no Google Cloud.
- `GMAIL_CLIENT_SECRET`: Client Secret OAuth.
- `GMAIL_REFRESH_TOKEN`: refresh token autorizado pela conta contatomaratoneiapp@gmail.com.
- `SUPABASE_EMAIL_WEBHOOK_SECRET`: segredo aleatório forte compartilhado com o webhook.
- `NEXT_PUBLIC_APP_URL`: URL canônica do Maratonei, por exemplo `https://maratoneiapp.com.br`.

A variável `NEXT_PUBLIC_SUPABASE_URL` já é usada pelo aplicativo. Não criar uma segunda chave pública. Não adicionar credenciais Google com prefixo `NEXT_PUBLIC_`.

## Webhook no Supabase

Depois de aplicar a migration e publicar o endpoint:
1. No Dashboard do Supabase, abrir Database → Webhooks.
2. Criar webhook para tabela `public.notification_email_outbox`, evento `INSERT`.
3. Método `POST`, URL `https://maratoneiapp.com.br/api/webhooks/notification-email`.
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
- A chave service_role, o Client Secret e o refresh token ficam somente no servidor.
- O outbox não recebe políticas de leitura/escrita para anon ou authenticated.
- Nenhuma migration, credencial ou webhook deve ser aplicado por automação a produção sem revisão e autorização.
