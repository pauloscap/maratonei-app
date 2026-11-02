# Notificações por e-mail — revisão e ativação controlada

Esta funcionalidade permanece em uma pull request **draft**. O código, a migration, os segredos e o webhook ainda não foram ativados em produção. A existência do escopo OAuth `gmail.send` no Google Cloud não significa que o envio esteja aprovado ou operacional.

## Escopo da primeira etapa

- E-mail de novo seguidor, somente se o destinatário ativar essa preferência.
- E-mail de comentário em episódio, somente se o destinatário ativar essa preferência.
- Preferências individuais começam desativadas.
- Curtidas não estão incluídas.
- Alertas de novos episódios ficam para uma segunda etapa, com monitoramento e deduplicação próprios.

## Componentes

- `notification_email_preferences`: preferências individuais, protegidas por RLS.
- `notification_email_outbox`: fila sem acesso direto para `anon` ou `authenticated`.
- Trigger PostgreSQL: valida o evento, verifica a preferência e cria uma linha na fila.
- Endpoint Next.js: valida o segredo do webhook, reivindica a linha pendente de forma atômica e envia pela Gmail API.
- O endpoint não faz retry automático. Uma falha é registrada para análise; isso evita reenvio automático acidental.

## Estado de segurança / autorização

- A migration `supabase/migrations/202611020001_notification_email_preferences.sql` está apenas no GitHub e **não foi aplicada**.
- A tabela de preferências concede explicitamente SELECT/INSERT/UPDATE apenas a `authenticated`, com RLS limitando cada linha ao próprio `auth.uid()`; `anon` não recebe privilégios.
- A fila não concede privilégios a `anon` ou `authenticated`; acesso administrativo fica restrito a `service_role`.
- A função de trigger é `SECURITY DEFINER`, fixa o `search_path` e tem EXECUTE revogado para `PUBLIC`, `anon` e `authenticated`; ela deve ser invocada somente pelo trigger.
- Nenhum Database Webhook foi criado.
- Nenhuma variável Gmail está configurada em Production.
- As credenciais Gmail existentes estão limitadas ao ambiente Preview e à branch de trabalho, mas Preview aponta para o projeto Supabase real. Portanto, não executar testes que escrevam no banco de Preview.
- Não adicionar `SUPABASE_SERVICE_ROLE_KEY`, segredos ou refresh token ao navegador nem a variáveis `NEXT_PUBLIC_*`.
- Não fazer merge, deploy de produção, migration, webhook ou ativação sem autorização explícita.

## Google OAuth

A conta remetente prevista é `contatomaratoneiapp@gmail.com`. O endpoint usa somente o escopo `https://www.googleapis.com/auth/gmail.send`, destinado ao envio de mensagens em nome da conta autorizadora. O fluxo não lê a caixa de entrada dos usuários do Maratonei.

O projeto Google está em modo **Teste**. A duração do refresh token e os requisitos de verificação precisam ser confirmados nas regras vigentes do Google antes de qualquer operação pública. Não presumir que o token de teste seja permanente.

## Testes automatizados locais

Os utilitários puros de e-mail foram isolados em `lib/email/notification-email.mjs`. Para executar as verificações sem acessar Supabase nem Gmail:

```bash
npm run test:email
```

A suíte cobre escape de HTML, validação do endereço destinatário contra injeção de cabeçalhos, restrição dos links ao domínio configurado e estrutura MIME multipart/base64url. Esses testes não enviam mensagens nem alteram dados.

## Pré-requisitos antes de ativar

1. Revisar o esquema e a migration com base no banco real, sem aplicar alterações.
2. Executar build e testes automatizados em ambiente isolado, sem conexão de escrita ao Supabase de produção.
3. Definir um ambiente de teste com banco isolado e usuário destinatário controlado.
4. Validar renovação OAuth e envio de um e-mail de teste, sem notificar usuários reais.
5. Confirmar registro de sucesso/falha, deduplicação, proteção do endpoint e comportamento de opt-in.
6. Revisar a Política de Privacidade para refletir exatamente o funcionamento efetivamente ativado.
7. Só então preparar a demonstração em vídeo e a justificativa do escopo para o Google.

## Variáveis de ambiente necessárias no servidor

- `SUPABASE_SERVICE_ROLE_KEY`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `SUPABASE_EMAIL_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL` (já utilizada pelo app)

Configurar segredos apenas no ambiente aprovado, após revisão. Não copiar valores de credenciais para issues, logs, commits ou mensagens.

## Webhook — não criar ainda

Depois de migration e endpoint aprovados e publicados, o desenho previsto é um webhook `POST` para INSERT em `public.notification_email_outbox`, enviando o header `Authorization: Bearer <SUPABASE_EMAIL_WEBHOOK_SECRET>`.

**Não criar esse webhook agora.** O Preview usa o Supabase real e não é um ambiente seguro para testar eventos que possam gerar gravações ou e-mails.

## Limitações conhecidas a validar

- O endpoint marca a linha como `processing` antes do envio. Se o processo cair nesse intervalo, será necessária uma rotina operacional de recuperação; não há reprocessamento automático.
- Se o Gmail aceitar a mensagem e a atualização do status falhar, o e-mail pode ter sido entregue enquanto a fila permanece `processing`. Não reenviar automaticamente nesses casos.
- O evento de comentário depende dos campos e do contexto de autenticação presentes na tabela `notificacoes`; validar isso em banco isolado antes de ativar.
- As rotas de destino dos e-mails devem permanecer no domínio oficial do Maratonei.

## Segurança e privacidade

- O endereço destinatário é obtido do registro de usuário no Supabase, não de um campo livre enviado pelo navegador.
- As preferências começam desativadas.
- A fila não concede acesso direto a usuários comuns.
- A chave administrativa e os tokens OAuth ficam exclusivamente no servidor.
- Não há campanha de marketing nem envio a quem não ativou a categoria correspondente.
## Integração contínua

O workflow `.github/workflows/notification-email-tests.yml` executa `npm run test:email` com Node.js 20 em pushes desta branch e em pull requests direcionados à `main`. Ele não recebe segredos e não se conecta ao Supabase nem ao Gmail. O resultado da execução deve ser conferido no GitHub Actions antes de considerar a suíte aprovada.
