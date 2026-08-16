# Ativação de produção

O repositório funciona agora em `mode: 'demo'`, sem serviço externo. Produtos, clientes, vendas, caixa, layouts e tema são mantidos no navegador. A integração Supabase já está separada em `backend.js` e pode ser ativada quando houver um projeto disponível.

## 1. Criar e preparar o projeto

1. Crie um projeto Supabase.
2. No SQL Editor, execute `supabase/schema.sql` uma única vez.
3. Em Authentication > Users, crie o primeiro usuário administrador com e-mail e senha.
4. Copie o UUID desse usuário, substitua `first_admin` em `supabase/bootstrap.sql.example` e execute o script.
5. Em Project Settings > API, copie a URL do projeto e a chave **publishable/anon**.

Não coloque a chave `service_role` em `config.js`, no GitHub Pages ou no navegador.

## 2. Ativar o frontend

Edite somente estas propriedades em `config.js`:

```js
window.GRASSI_CONFIG = {
  mode: 'supabase',
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabasePublishableKey: 'SUA_CHAVE_PUBLICA'
}
```

Depois publique novamente. O painel principal usa `index.html`; o terminal separado e responsivo usa `pdv.html`.

## 3. Funcionários

A criação de usuários não deve acontecer com uma chave administrativa no frontend. O diretório `supabase/functions/invite-user` contém uma Edge Function preparada para convite seguro. Implante-a com a CLI do Supabase e mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas nos secrets da função. Até essa função ser ligada à interface, crie usuários em Authentication e insira a associação correspondente em `memberships` pelo SQL Editor.

## 4. Segurança já preparada

- login por e-mail e senha;
- sessão renovável;
- isolamento por empresa (`business_id`);
- Row Level Security em todas as tabelas;
- produtos e configurações graváveis somente por administrador;
- métricas e relatórios filtrados pelo funcionário;
- venda atômica: valida e baixa stock, grava itens, caixa, conta do cliente e métricas na mesma transação;
- pedidos e orçamentos são registrados sem baixar estoque; somente a venda confirmada movimenta inventário e caixa;
- no PDV, `F7` alterna entre venda e orçamento/simulação, com aviso visual durante todo o fluxo e no comprovante;
- auditoria centralizada por empresa, com leitura exclusiva para administradores e gravação autenticada por RPC;
- chave administrativa ausente do frontend.

## 5. Antes do uso real

Configure domínio, recuperação de senha, SMTP, backups e política de retenção no Supabase. Valide também regras fiscais, impressão e emissão documental aplicáveis à operação na Bolívia. O service worker mantém a interface disponível, mas vendas offline com sincronização posterior devem ser homologadas antes de permitir operação sem internet.
