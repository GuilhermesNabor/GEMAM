const { getDb } = require('../config/database');

async function authMiddleware(req, res, next) {
    // Verifica se a SESSÃO existe (em vez de um token)
    console.log('--- RODANDO O AUTH DE SESSÃO (CORRETO) ---');
    if (!req.session || !req.session.user) {
        // Verifica o que o cliente prefere receber: HTML ou JSON.
        const preferred = req.accepts(['html', 'json']);
        
        if (preferred === 'html') {
            // Se for um navegador pedindo uma página, redireciona para o login.
            return res.redirect('/login');
        } else {
            // Senão, é uma API call, então retorna JSON.
            return res.status(401).json({ error: 'Acesso negado. Sessão inválida ou expirada.' });
        }
    }

    const user = req.session.user;

    // Verificação de segurança (Bloqueio da empresa)
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
    
    // Anexa o usuário da SESSÃO ao 'req.user'
    req.user = user;
    next();
}

module.exports = authMiddleware;