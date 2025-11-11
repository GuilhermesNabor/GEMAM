
# Sistema de Gerenciamento GEMAM

Este é um sistema de gerenciamento de usuários e empresas, com um fluxo de aprovação de novos administradores.

## Funcionalidades

- **Cadastro de Empresas e Administradores:** Novos administradores podem se cadastrar, mas precisam ser aprovados por um usuário APS.
- **Aprovação de Administradores:** Usuários APS podem aprovar ou recusar o cadastro de novos administradores.
- **Cadastro de Usuários Padrão:** Administradores aprovados podem cadastrar usuários padrão para suas empresas.
- **Autenticação e Autorização:** O sistema utiliza sessões e cookies para autenticação e middlewares para autorização baseada em papéis (APS, ADMIN, STANDARD).
- **Log de Ações:** Todas as ações importantes são registradas em um log.

## Como Começar

### Pré-requisitos

- Node.js (v14 ou superior)
- npm

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/GuilhermesNabor/GEMAM.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto e adicione a seguinte variável:
   ```
   SESSION_SECRET=seu_segredo_de_sessao
   ```
4. Inicie o servidor:
   ```bash
   node src/server.js
   ```

## Uso

Após iniciar o servidor, acesse `http://localhost:3000` em seu navegador.

- **Login:** Use as credenciais de um usuário APS, ADMIN ou STANDARD para fazer login.
- **Dashboard APS:** Se você fizer login como um usuário APS, verá o painel de administração da APS, onde poderá aprovar ou recusar novos administradores.
- **Dashboard ADMIN:** Se você fizer login como um usuário ADMIN, verá o painel de administração da empresa, onde poderá cadastrar novos usuários padrão.

## Endpoints da API

- `POST /api/auth/register-admin-request`: Envia uma solicitação de cadastro de administrador.
- `POST /api/auth/login`: Autentica um usuário.
- `GET /api/users`: Retorna todos os usuários.
- `POST /api/users/register-standard`: Cadastra um novo usuário padrão.
- `POST /api/aps/approve/admin/:userIdToApprove`: Aprova um administrador.
- `POST /api/aps/decline/admin/:adminUserIdToDecline`: Recusa um administrador.
- `GET /api/aps/pending-admins`: Retorna todos os administradores pendentes.
- `POST /api/aps/block/company/:companyId`: Bloqueia uma empresa.
