# Notificações por e-mail — revisão e ativação controlada

Esta funcionalidade permanece em uma pull request **draft**. O código, a migration, os segredos e o webhook ainda não foram ativados em produção. A existência do escopo OAuth `gmail.send` no Google Cloud não significa que o envio esteja aprovado ou operacional.

## Escopo da primeira etapa

- E-mail de boas-vindas após novo cadastro, enfileirado pelo gatilho de `auth.users` e enviado uma única vez por cadastro.\n- E-mail de novo seguidor, somente se o destinatário ativar essa preferência.
- E-mail de comentário em episódio, somente se o destinatário ativar essa preferência.
- Preferências individuais começam desativadas.
- Curtidas não estão incluídas.
- Alertas de novos episódios ficam para uma segunda etapa, com monitoramento e deduplicação próprios.

## Componentes

- `notification_email_preferences`: preferências individuais, protegidas por RLS.
- `notification_email_outbox`: fila sem acesso direto para `anon` ou `authenticated`; `notification_id` é opcional apenas para eventos transacionais de boas-vindas, que não dependem de uma notificação social.
- Gatilhos PostgreSQL nas tabelas de origem (`seguidores` e `comentarios_episodios`): criam a notificação visual e, na mesma transação, enfileiram o e-mail quando há opt-in. Inserções diretas em `notificacoes` não disparam e-mail.
- Endpoint Next.js: valida o segredo do webhook, reivindica a linha pendente de forma atômica e envia pela Gmail API.
- O endpoint não faz retry automático. Uma falha é registrada para análise; isso evita reenvio automático acidental.
- A fila registra `processing_started_at` no claim atômico e limpa o campo ao concluir em `sent` ou `failed`. Esse horário apoia o diagnóstico, mas não autoriza reenvio sem verificar se o Gmail aceitou a mensagem.

## Estado de segurança / autorização

- A migration `supabase/migrations/202611020001_notification_email_preferences.sql` está apenas no GitHub e **não foi aplicada**.
- A tabela de preferências concede explicitamente SELECT/INSERT/UPDATE apenas a `authenticated`, com RLS limitando cada linha ao próprio `auth.uid()`; `anon` não recebe privilégios.
- A fila não concede privilégios a `anon` ou `authenticated`; acesso administrativo fica restrito a `service_role`.
- A função auxiliar de enfileiramento `SECURITY DEFINER` fica no schema não exposto `private`, usa `search_path` vazio, qualifica as referências aos objetos e tem EXECUTE revogado para `PUBLIC`, `anon` e `authenticated`. As funções dos gatilhos sociais também usam `SECURITY DEFINER` e `search_path` vazio para preservar a criação das notificações e chamar a auxiliar.
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

A suíte Node cobre escape de HTML, validação do destinatário contra injeção de cabeçalhos, restrição dos links ao domínio configurado e estrutura MIME multipart/base64url. O teste SQL em PostgreSQL descartável verifica eventos reais de seguir e comentar, preservação das notificações no aplicativo, respeito ao opt-in e rejeição de e-mail provocado por inserção direta em `notificacoes`. Esses testes não enviam mensagens nem alteram o banco real.

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
- O enfileiramento é chamado pelos gatilhos de origem (`seguidores` e `comentarios_episodios`), não por inserções genéricas em `notificacoes`; validar em banco isolado antes de ativar.
- As rotas de destino dos e-mails devem permanecer no domínio oficial do Maratonei.

## Segurança e privacidade

- O endereço destinatário é obtido do registro de usuário no Supabase, não de um campo livre enviado pelo navegador.
- As preferências começam desativadas.
- A fila não concede acesso direto a usuários comuns.
- A chave administrativa e os tokens OAuth ficam exclusivamente no servidor.
- Não há campanha de marketing nem envio a quem não ativou a categoria correspondente.
## Integração contínua

O workflow `.github/workflows/notification-email-tests.yml` executa `npm run test:email` com Node.js 20 em pushes desta branch e em pull requests direcionados à `main`. Ele não recebe segredos e não se conecta ao Supabase nem ao Gmail. O resultado da execução deve ser conferido no GitHub Actions antes de considerar a suíte aprovada.


## Preferências adicionais — catálogo e comunicados

A migration `202611090001_catalog_email_preferences.sql` adiciona duas opções à tabela de preferências:
- `email_novidades_catalogo`: inscrição para todos os avisos editoriais de novas séries, filmes e episódios, sem filtrar por lista pessoal.
- `email_comunicados`: inscrição separada para mensagens gerais que a administração decidir enviar.

A tela `/configuracoes` passa a exibir essas opções e salva os quatro opt-ins no mesmo registro do usuário. As opções iniciam desativadas. A migration permanece apenas na branch e ainda não foi aplicada ao Supabase.

## Fonte e automação do catálogo — pendente de implementação

A aplicação atualmente consulta títulos diretamente na API do TMDB a partir do navegador. Isso não fornece um catálogo central persistente nem eventos confiáveis de publicação. Para evitar alertas falsos ou repetidos, a próxima etapa deverá:
1. Criar uma rotina agendada no servidor para consultar as fontes do catálogo.
2. Persistir os lançamentos/episódios já processados, com identificador externo e chave única por evento.
3. Inserir eventos elegíveis em uma fila de e-mail, respeitando `email_novidades_catalogo = true`.
4. Enviar em lotes controlados, com deduplicação e registro de falhas.
5. Permitir comunicados manuais apenas por ação administrativa autenticada, filtrando `email_comunicados = true`.

Não existe ainda uma rotina de monitoramento TMDB, um catálogo central, um painel administrativo de campanhas ou um fluxo de boas-vindas. Esses itens não devem ser considerados ativos até implementação e testes isolados.


## Boas-vindas — fluxo preparado

A migration `202611090002_welcome_email.sql` adiciona um gatilho separado em `auth.users`. No primeiro INSERT do usuário, o gatilho enfileira uma mensagem transacional para o e-mail registrado no próprio Supabase Auth. A mensagem não depende de preferências promocionais e não é disparada por atualizações de perfil. A fila usa `notification_id = NULL` para esse tipo de evento; a unicidade de `notification_id` continua deduplicando eventos sociais.

O endpoint de entrega reconhece o tipo `boas_vindas` e usa texto de rodapé transacional, diferente do texto usado para mensagens opt-in. A migration e o endpoint ainda não foram ativados no Supabase de produção e nenhum e-mail foi enviado.
