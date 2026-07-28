# Inventory Audit Platform

Aplicação full stack de referência para agendar contagens cíclicas de estoque,
registrar conferências físicas e tratar divergências sem perder a fotografia da
quantidade esperada no início de cada sessão.

O projeto usa exclusivamente dados fictícios e não corresponde a nenhum
ambiente de produção.

## Funcionalidades

- autenticação de operadores com JWT e senhas protegidas por bcrypt;
- cadastro, busca e paginação de produtos;
- criação de sessões de contagem com snapshot do estoque;
- classificação derivada dos itens em `A_CONFERIR`, `CONFERIDO` e
  `FALTANTE_EXCEDENTE`;
- observação obrigatória para divergências;
- salvamento parcial e finalização imutável da contagem;
- API documentada com Swagger;
- interface responsiva em português;
- testes unitários no backend e no frontend.

## Arquitetura

| Camada | Tecnologias |
|---|---|
| API | NestJS 11, TypeScript, Passport/JWT, Swagger |
| Dados | PostgreSQL 17, Drizzle ORM |
| Interface | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Testes | Jest, Testing Library |
| Desenvolvimento local | Yarn e Docker Compose |

O repositório é organizado como um monorepo simples:

```text
inventory-audit-platform/
├── backend/          # API NestJS, migrations Drizzle e seed local
├── frontend/         # aplicação Next.js
├── docker-compose.yml
└── package.json      # comandos unificados
```

### Modelo de dados

```text
employees ─────────── stock_counts
  id (PK)                id (PK)
  nome                   codigo (unique)
  email (unique)         data_agendada
  senha                  responsavel_id (FK)
                         status

products ─── product_stocks       stock_count_items
  id (PK)       produto_id (FK)      contagem_estoque_id (FK)
  codigo        quantidade_sistema   produto_id (FK)
  nome                               quantidade_sistema_snapshot
                                     quantidade_contada
                                     observacao
```

Ao criar uma contagem, a API copia `quantidade_sistema` para
`quantidade_sistema_snapshot`. Alterações posteriores no estoque não mudam a
base daquela auditoria.

## Pré-requisitos

- Node.js 20.9 ou superior;
- Yarn Classic;
- Docker com Docker Compose.

## Configuração local

1. Clone o repositório e instale as dependências:

   ```bash
   git clone <url-do-repositorio>
   cd inventory-audit-platform
   yarn install:all
   ```

2. Copie o arquivo de ambiente e substitua o segredo de desenvolvimento:

   ```bash
   cp backend/.env-example backend/.env
   ```

   `JWT_SECRET` é obrigatório. Gere um valor aleatório exclusivo para seu
   ambiente; não reutilize o valor de exemplo.

   Para conexões PostgreSQL com TLS, defina `DATABASE_SSL=true`. Mantenha
   `DATABASE_SSL_REJECT_UNAUTHORIZED=true`, exceto quando a infraestrutura
   local exigir explicitamente um certificado não verificável.

3. Suba o PostgreSQL e prepare os dados fictícios:

   ```bash
   yarn docker:up
   yarn db:reset
   ```

4. Inicie API e interface:

   ```bash
   yarn dev
   ```

- Interface: <http://localhost:3000>
- Swagger: <http://localhost:3001/api/docs>

### Usuários do seed

As credenciais abaixo existem apenas no banco local criado pelo seed:

| Perfil | Email | Senha |
|---|---|---|
| Administrador local | `admin@example.com` | `123456` |
| Operador um | `operador.um@example.com` | `123456` |
| Operador dois | `operador.dois@example.com` | `123456` |

Nunca use essas credenciais em um ambiente público.

## API

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Autentica um operador |
| `POST` | `/auth/register` | Registra um operador |
| `GET` | `/auth/me` | Retorna o perfil autenticado |

### Produtos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/produtos` | Lista produtos com paginação e busca |
| `GET` | `/produtos/:id` | Retorna um produto |
| `POST` | `/produtos` | Cria um produto |
| `PATCH` | `/produtos/:id` | Atualiza um produto |
| `PATCH` | `/produtos/:id/estoque` | Atualiza a quantidade em estoque |
| `DELETE` | `/produtos/:id` | Remove um produto |

### Contagens

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/contagens-estoque` | Lista contagens com filtros |
| `GET` | `/contagens-estoque/:id` | Retorna uma contagem e seus itens |
| `POST` | `/contagens-estoque` | Cria uma contagem e seu snapshot |
| `PATCH` | `/contagens-estoque/:id/status` | Salva ou finaliza a contagem |
| `PATCH` | `/itens-contagem-estoque/:id` | Registra a conferência de um item |

## Testes e verificações

```bash
yarn lint
yarn test
yarn backend:test:e2e
yarn backend:build
yarn frontend:build
```

Os testes cobrem autenticação, produtos, snapshot de estoque, regras de
divergência, finalização, contratos da interface e comportamento da camada
HTTP.

## Scripts

| Script | Descrição |
|---|---|
| `yarn dev` | Inicia backend e frontend |
| `yarn lint` | Verifica o código do backend e do frontend |
| `yarn test` | Executa os testes unitários |
| `yarn backend:test:e2e` | Executa o smoke test HTTP da API |
| `yarn backend:build` | Compila a API |
| `yarn frontend:build` | Compila a interface |
| `yarn docker:up` | Inicia o PostgreSQL local |
| `yarn docker:down` | Encerra o PostgreSQL local |
| `yarn db:migrate` | Aplica migrations Drizzle |
| `yarn db:seed` | Insere dados fictícios |
| `yarn db:reset` | Aplica migrations e executa o seed |

## Limites de segurança

Esta implementação é adequada para estudo e demonstração local. Antes de uma
implantação real, revise pelo menos:

- política de cadastro de usuários;
- origem permitida pelo CORS;
- armazenamento do token no navegador;
- rotação e gerenciamento de segredos;
- rate limiting, logs de auditoria e recuperação de conta;
- permissões por função e isolamento entre organizações.

Os valores de `docker-compose.yml` e `.env-example` são credenciais locais
fictícias, não segredos de produção.

## Licença e componentes de terceiros

O código autoral está disponível sob a [licença MIT](LICENSE). Consulte
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) para os componentes gerados ou
adaptados de projetos de terceiros.
