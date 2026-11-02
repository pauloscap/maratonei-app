# Runbook de notificações por e-mail

Esta branch permanece em revisão. Não aplicar migration, criar webhook, enviar mensagens reais ou alterar produção sem autorização explícita.

## Diagnóstico somente leitura

```sql
select id, notification_type, status, attempts, created_at, sent_at, left(last_error, 300) as error_excerpt
from public.notification_email_outbox
where status in ('pending', 'processing', 'failed')
order by created_at asc
limit 200;
```

## Recuperação

- pending: aguarda o webhook.
- processing: verificar logs e a pasta Enviados antes de qualquer ação.
- failed: corrigir a causa antes de considerar reenvio.
- Nunca redefinir processing ou failed para pending sem confirmar que o Gmail não aceitou a mensagem. A API pode ter aceitado o envio mesmo se a gravação do status falhar.

A versão atual ainda não registra um horário próprio de início do processamento; por isso, created_at não prova há quanto tempo a mensagem está em processing. A próxima revisão técnica deve adicionar processing_started_at, preenchido ao reivindicar a linha e limpo ao concluir.

## Limite de escopo

Esta fila é somente para notificações sociais transacionais. Notícias, newsletter e campanhas manuais exigem consentimento separado, descadastro e provedor próprio para campanhas. Não reutilizar preferências sociais nem Gmail API como solução de disparo em massa.

## OAuth Google

A documentação oficial informa que refresh tokens emitidos para projetos OAuth externos em status Testing expiram em sete dias quando há escopos Gmail. Confirmar publicação e requisitos de verificação antes da ativação contínua: https://developers.google.com/identity/protocols/oauth2.
