# GRASSI PDV

MVP web de um sistema PDV e ERP whitelabel, criado para uma operação comercial boliviana com vendas no varejo e no atacado.

O projeto usa espanhol como idioma principal e exibe valores em bolivianos (`Bs`). A experiência operacional toma como referência a agilidade de sistemas como o NEX, mantendo interface e identidade próprias.

## Funcionalidades disponíveis

- painel geral com vendas, estoque, contas a receber e atividade recente;
- PDV rápido com pesquisa, leitura por código, carrinho, preço varejista/atacadista e atalho `F2`;
- pagamentos por dinheiro, PIX, QR, transferência e conta do cliente;
- cadastro e controle de produtos, estoque mínimo, custo e dois preços de venda;
- cadastro de clientes com foto, classificação e conta corrente de crédito/débito;
- cadastro de funcionários com foto e métricas individuais de vendas, faturamento, ticket médio e metas;
- fluxo financeiro com entradas, saídas, saldo e fechamento de caixa;
- relatórios imprimíveis;
- personalização whitelabel de nome, razão social, NIT, cidade e cor principal;
- exportação e importação CSV de produtos, clientes e funcionários;
- backup e restauração completa em JSON;
- layout responsivo para computador, tablet e celular;
- persistência local para que a demonstração continue funcionando após atualizar a página.

## Executar localmente

Não há dependências ou processo de build. Abra `index.html` diretamente ou use um servidor estático:

```bash
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.

## Publicação

O projeto é estático e funciona diretamente no GitHub Pages ou na Vercel.

### GitHub Pages

Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e diretório `/ (root)`.

### Vercel

Importe o repositório e mantenha as configurações padrão. O arquivo `vercel.json` já está incluído.

## Arquitetura atual e próxima fase

Esta primeira versão é uma demonstração funcional e salva dados no `localStorage` do navegador. A evolução para produção deverá adicionar:

- autenticação e permissões por cargo;
- banco PostgreSQL/Supabase com isolamento por empresa;
- API para sincronização web, aplicativo e executável;
- operação offline com fila de sincronização;
- impressão térmica, leitor, balança e gaveta de dinheiro;
- auditoria, cancelamentos, trocas e devoluções;
- contas a pagar/receber, fornecedores, compras e DRE completa;
- adequação fiscal e documental conforme a operação na Bolívia;
- armazenamento seguro de imagens e backups automáticos.

## Aviso

Os dados incluídos são fictícios e existem apenas para demonstração da interface e dos fluxos.
