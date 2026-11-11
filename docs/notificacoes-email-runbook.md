# Runbook de notificações por e-mail

Esta branch permanece em revisão. Não aplicar migration, criar webhook, enviar mensagens reais ou alterar produção sem autorização explícita.

## Diagnóstico somente leitura

```sql
select id, notification_type, status, attempts, created_at, processing_started_at, sent_at, left(last_error, 300) as error_excerpt
from public.notification_email_outbox
where status in ('pending', 'processing', 'failed')
order by created_at asc
limit 200;
```

## Recuperação

A função auxiliar de enfileiramento fica no schema `private`, fora da Data API, com `search_path` vazio e referências qualificadas. Ela é chamada apenas pelos gatilhos sociais de `seguidores` e `comentarios_episodios`; os gatilhos preservam a notificação visual e enfileiram o e-mail na mesma transação. Inserir diretamente em `notificacoes` não dispara e-mail. O EXECUTE da auxiliar permanece revogado para `PUBLIC`, `anon` e `authenticated`.

- pending: aguarda o webhook.
- processing: verificar logs e a pasta Enviados antes de qualquer ação.
- failed: corrigir a causa antes de considerar reenvio.
- Nunca redefinir processing ou failed para pending sem confirmar que o Gmail não aceitou a mensagem. A API pode ter aceitado o envio mesmo se a gravação do status falhar.

A fila agora registra processing_started_at no claim atômico e limpa esse campo ao concluir em sent ou failed. Se uma linha permanecer em processing, use esse horário para priorizar a investigação — ele não autoriza reenvio automático. Antes de qualquer recuperação, confirme nos logs e na pasta Enviados se o Gmail aceitou a mensagem.

## Limite de escopo

Esta fila atende notificações sociais, boas-vindas e avisos pontuais do catálogo. Os avisos do catálogo usam `email_novidades_catalogo`, são enfileirados para todos os inscritos e são deduplicados por `user_id + event_key`. Comunicados gerais continuam separados por `email_comunicados` e exigem ação administrativa autenticada. Não reutilizar preferências sociais nem Gmail API como solução de disparo em massa.

## OAuth Google

A documentação oficial informa que refresh tokens emitidos para projetos OAuth externos em status Testing expiram em sete dias quando há escopos Gmail. Confirmar publicação e requisitos de verificação antes da ativação contínua: https://developers.google.com/identity/protocols/oauth2.


## Monitoramento do catálogo

- Rota: `GET /api/cron/catalog-email`.
- Agenda: diariamente às 10h UTC (entre 7h e 7h59 em Belém, devido à janela de execução do plano Hobby).
- Proteção: header `Authorization: Bearer <CRON_SECRET>`.
- A rotina consulta TMDB, registra eventos únicos em `notification_catalog_events`, enfileira para opt-ins de catálogo e tenta entregar até 40 mensagens pendentes por execução.
- A rotina só é acionada automaticamente em deployment de produção. O Preview não executa Cron Jobs.
- Antes de ativar, aplicar a migration `202611090003_catalog_email_events.sql` somente após revisão e configurar `CRON_SECRET` no ambiente Production, além das variáveis Supabase e Gmail já previstas.
- Se houver mais de 40 mensagens pendentes, o restante permanece na fila para as próximas execuções diárias.


## Comunicados administrativos

- Tela: `/admin/comunicados`.
- API: `POST /api/admin/email-campaign`.
- Autorização: sessão Supabase Auth válida e e-mail idêntico a `MARATONEI_ADMIN_EMAIL`, configurado apenas no servidor. Não usar `user_metadata` nem valores controlados pelo navegador para conceder acesso.
- Público: somente usuários com `email_comunicados = true`.
- A API apenas coloca os e-mails na fila; ela não dispara mensagens no momento da ação.
- O cron processa até 20 mensagens pendentes por execução diária, em lotes concorrentes de cinco. Campanhas maiores serão entregues gradualmente.
- Antes de habilitar, configurar `MARATONEI_ADMIN_EMAIL` em Preview para teste e em Production somente após autorização. Também é necessário aplicar as migrations de preferências, boas-vindas e eventos de catálogo.
- Não usar esta ferramenta para disparos em massa; o Gmail pessoal tem limites e o OAuth em modo Testing não é estável para operação contínua.
