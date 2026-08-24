# GRASSI PDV

MVP web de um sistema PDV e ERP whitelabel, criado para uma operação comercial boliviana com vendas no varejo e no atacado.

O projeto usa espanhol como idioma principal e exibe valores em bolivianos (`Bs`). A experiência operacional e a arquitetura visual foram redesenhadas após um estudo do NEX Web: menu lateral compacto, páginas orientadas a tabelas, formulários em tela própria e PDV em tela cheia dividido entre itens e resumo. A identidade e a implementação permanecem próprias.

## Funcionalidades disponíveis

- histórico de vendas como tela inicial, com pedidos e orçamentos;
- login separado para administrador e funcionário, permissões e sessão persistente;
- PDV em tela cheia com pesquisa, leitura por código, carrinho, preço varejista/atacadista, abertura dedicada por `F3` e orçamento de compra teste por `F7`;
- terminal independente em `pdv.html`, responsivo para celular, tablet e computador;
- editor visual do PDV com controles arrastáveis, posição lateral/inferior e densidade configurável;
- pagamentos por dinheiro, PIX, QR, transferência e conta do cliente, com escolha do cliente dentro do próprio pagamento;
- cadastro e controle de produtos, estoque mínimo, custo e dois preços de venda;
- cadastro de clientes com foto, classificação e conta corrente de crédito/débito;
- venda em conta lançada automaticamente no banco e exibida no extrato do cliente selecionado;
- cadastro de funcionários com foto e métricas individuais de vendas, faturamento, ticket médio e metas;
- fluxo financeiro com entradas, saídas, saldo e fechamento de caixa;
- relatórios imprimíveis com modelos operacionais de resumo de caixa, recibo A4 e factura comercial de Zona Franca;
- personalização whitelabel de nome, razão social, NIT e cidade;
- modo claro, escuro ou automático e cinco paletas de cor;
- importação universal de produtos e clientes com prévia, mapeamento de colunas, modelos CSV e suporte a CSV, TSV, XLS e XLSX;
- logs de auditoria com usuário, horário, módulo, terminal/dispositivo e console de eventos somente leitura;
- exportação CSV de produtos, clientes e funcionários;
- backup e restauração completa em JSON;
- layout compacto inspirado no fluxo operacional do NEX Web e responsivo para computador, tablet e celular;
- navegação SPA sem recarregar a página ou voltar para o início durante cadastros;
- persistência local para que a demonstração continue funcionando após atualizar a página;
- demonstração sem baixa de estoque por padrão, com simulação opcional nas configurações;
- PWA instalável com shell offline;
- integração Supabase preparada, com PostgreSQL, RLS multiempresa e venda transacional com baixa obrigatória e atômica de estoque.

## Acessos da demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@example.invalid` | `admin123` |
| Funcionário | `employee@example.invalid` | `func123` |

O modo demonstração é definido em `config.js`. Não use essas credenciais como usuários reais.

## Executar localmente

Não há dependências ou processo de build. Abra `index.html` diretamente ou use um servidor estático:

```bash
python3 -m http.server 4173
```

Depois acesse:

- painel ERP: `http://localhost:4173/index.html`;
- terminal PDV separado: `http://localhost:4173/pdv.html`.

## Publicação

O projeto é estático e funciona diretamente no GitHub Pages ou na Vercel.

### GitHub Pages

Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e diretório `/ (root)`.

### Vercel

Importe o repositório e mantenha as configurações padrão. O arquivo `vercel.json` já está incluído.

## Integração Supabase opcional

O sistema continua operacional sem um projeto Supabase. Quando houver um projeto disponível, siga [docs/PRODUCTION.md](docs/PRODUCTION.md). A preparação inclui:

- `backend.js`: adaptador entre modo local e Supabase;
- `supabase/schema.sql`: tabelas, índices, RLS, permissões e RPCs atômicas;
- `supabase/bootstrap.sql.example`: criação segura da primeira empresa/administrador;
- `supabase/functions/invite-user`: base para convite de funcionários sem expor `service_role`.

O resumo de caixa e o recibo usam os dados já registrados no ERP e podem ser impressos ou salvos em PDF. A factura de Zona Franca é um modelo comercial: código de autorização e QR fiscal só devem ser emitidos por uma integração homologada com o SIN.

Pendências antes de uma operação comercial real: homologar a emissão fiscal com o SIN na Bolívia, cancelamentos/devoluções, fila de vendas offline e backups monitorados.

## Aviso

Os dados incluídos são fictícios e existem apenas para demonstração da interface e dos fluxos.
