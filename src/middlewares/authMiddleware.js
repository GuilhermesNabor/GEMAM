const { getDb } = require('../config/database');

async function authMiddleware(req, res, next) {
    // 1. Verifica se a SESSÃO existe (em vez de um token)
    console.log('--- RODANDO O AUTH DE SESSÃO (CORRETO) ---');
    if (!req.session || !req.session.user) {
        // Se for uma chamada de API, retorna JSON (não redireciona)
        return res.status(401).json({ error: 'Acesso negado. Sessão inválida ou expirada.' });
    }

    const user = req.session.user;

    // 2. Verificação de segurança (Bloqueio da empresa)
    // Isso é importante manter para chamadas de API
    try {
        if (user.role !== 'APS' && user.company_id) {
            const db = getDb();
            const company = await db.get('SELECT is_blocked FROM companies WHERE id = ?', user.company_id);
            if (company && company.is_blocked === 1) {
                return res.status(403).json({ error: 'Acesso negado. A empresa está bloqueada pela APS.' });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno ao verificar o status da empresa.' });
    }
    
    // 3. Anexa o usuário da SESSÃO ao 'req.user'
    // Isso faz o 'roleMiddleware' (isAPS, isAdmin) funcionar
    req.user = user;
    next();
}

module.exports = authMiddleware;