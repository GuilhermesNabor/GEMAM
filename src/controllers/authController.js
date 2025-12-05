const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { logAction } = require('../middlewares/logMiddleware');

class AuthController {
    // ESTA ROTA (POST /login) É CHAMADA PELO FORMULÁRIO HTML
    async login(req, res) {
        const { email, password } = req.body;
        const db = getDb();

        try {
            const user = await db.get('SELECT * FROM users WHERE email = ?', email ? email.trim() : null);

            if (!user) {
                // Falhou: Renderiza a página de login de novo, com erro
                return res.status(401).render('login', { error: 'Credenciais inválidas.' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).render('login', { error: 'Credenciais inválidas.' });
            }

            // Verificações de conta (ativo, pendente, bloqueado)
            if (user.is_active === 0) {
                return res.status(403).render('login', { error: 'Sua conta está inativa ou bloqueada.' });
            }
            if (user.role === 'ADMIN' && user.is_pending_approval === 1) {
                return res.status(403).render('login', { error: 'Sua conta de administrador está pendente de aprovação pela APS.' });
            }
            if (user.role !== 'APS' && user.company_id) {
                const company = await db.get('SELECT is_blocked FROM companies WHERE id = ?', user.company_id);
                if (company && company.is_blocked === 1) {
                    return res.status(403).render('login', { error: 'Sua empresa está bloqueada pela APS.' });
                }
            }

            // Salva o usuário na SESSÃO (não no localStorage)
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company_id: user.company_id
            };

            await logAction(user.id, 'USER_LOGIN', `Usuário ${user.email} logou.`);

            req.session.save((err) => {
                if (err) {
                    console.error('Erro ao salvar a sessão:', err);
                    return res.status(500).render('login', { error: 'Erro interno ao salvar a sessão.' });
                }
                // Redireciona para o dashboard apenas após salvar
                res.redirect('/dashboard');
            });

        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).render('login', { error: 'Erro interno do servidor.' });
        }
    }
}

module.exports = new AuthController();