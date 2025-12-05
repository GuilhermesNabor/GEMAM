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

-- Tabela para os Certificados de Retirada de Resíduos de Embarcação (CRRE)
CREATE TABLE IF NOT EXISTS crres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crre_number TEXT NOT NULL UNIQUE,
    issue_date TEXT NOT NULL,

    -- Dados da Instalação Portuária
    port_installation TEXT NOT NULL DEFAULT 'Porto de Santos',

    -- Informações da Embarcação
    vessel_name TEXT NOT NULL,
    imo_number TEXT,
    nationality TEXT NOT NULL,
    navigation_company TEXT NOT NULL,
    armador_name TEXT,
    docking_location TEXT,

    -- Informações do Serviço
    service_start_date TEXT NOT NULL,
    service_start_time TEXT NOT NULL,
    service_end_date TEXT NOT NULL,
    service_end_time TEXT NOT NULL,
    retrieval_mode TEXT NOT NULL,
    
    -- Empresa Prestadora do Serviço (Autopreenchimento)
    company_id INTEGER NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- Dados da Destinação Final (FK para destination_companies)
    destination_company_id INTEGER,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ISSUED', -- 'ISSUED' (Emitido) / 'DRAFT' (Rascunho)
    
    -- Auditoria
    created_by_user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (destination_company_id) REFERENCES destination_companies(id)
);

-- Tabela para os Resíduos Coletados (Linhas Dinâmicas da Seção III)
CREATE TABLE IF NOT EXISTS crre_residues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crre_id INTEGER NOT NULL,
    
    waste_number INTEGER NOT NULL,
    unit TEXT NOT NULL,
    quantity REAL NOT NULL,
    observations TEXT,

    -- Campos Condicionais
    category TEXT,
    mtr_number TEXT,
    temporary_storage INTEGER DEFAULT 0,

    FOREIGN KEY (crre_id) REFERENCES crres(id) ON DELETE CASCADE
);

-- Insere um usuário master 'APS' para podermos começar
-- Senha: "aps123"
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, is_pending_approval, is_active)
VALUES (1, 'APS Admin', 'aps@aps.gov.br', '$2b$10$R/czLZUsrzB/axmmqvVW4uCsjXUnWq3gdJtvuLCJCH1KoAFa34fsG', 'APS', 0, 1);