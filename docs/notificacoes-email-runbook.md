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

Esta fila é somente para notificações sociais transacionais. Notícias, newsletter e campanhas manuais exigem consentimento separado, descadastro e provedor próprio para campanhas. Não reutilizar preferências sociais nem Gmail API como solução de disparo em massa.

## OAuth Google

A documentação oficial informa que refresh tokens emitidos para projetos OAuth externos em status Testing expiram em sete dias quando há escopos Gmail. Confirmar publicação e requisitos de verificação antes da ativação contínua: https://developers.google.com/identity/protocols/oauth2.
