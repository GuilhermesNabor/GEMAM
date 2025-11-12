-- Cria a tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    logo_path TEXT,
    is_blocked INTEGER DEFAULT 0 -- 0 = false, 1 = true (Bloqueio da APS)
);

-- Cria a tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('APS', 'ADMIN', 'STANDARD')),
    is_pending_approval INTEGER DEFAULT 0, -- 1 = aguardando aprovação da APS
    is_active INTEGER DEFAULT 1, -- 1 = ativo, 0 = inativo/bloqueado individualmente
    FOREIGN KEY (company_id) REFERENCES companies (id)
);

-- Cria a tabela de logs de ação (Requisito de segurança)
CREATE TABLE IF NOT EXISTS action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS destination_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_by_user_id INTEGER, -- Quem cadastrou
    
    -- Campos da Imagem (IV - Dados da destinação final)
    razao_social TEXT NOT NULL,
    inscricao_estadual TEXT,
    cnpj TEXT NOT NULL,
    licenca_ibama TEXT,
    data_vencimento DATE,
    endereco TEXT,
    municipio_uf TEXT,
    cep TEXT,
    email_contato TEXT,
    telefone_contato TEXT,
    responsavel_tecnico TEXT,
    registro_profissional TEXT,
    
    -- Arquivos Obrigatórios
    path_licenca_operacao TEXT NOT NULL,
    path_alvara TEXT NOT NULL,
    path_comprovante_ctf TEXT NOT NULL,
    
    -- Controle da APS
    status TEXT DEFAULT 'PENDING', 'REJECTED'
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

-- Insere um usuário master 'APS' para podermos começar
-- Senha: "aps123"
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, is_pending_approval, is_active)
VALUES (1, 'APS Admin', 'aps@aps.gov.br', '$2b$10$R/czLZUsrzB/axmmqvVW4uCsjXUnWq3gdJtvuLCJCH1KoAFa34fsG', 'APS', 0, 1);