const UserService = require('../services/UserService'); 
const { logAction } = require('../middlewares/logMiddleware');
const { getDb } = require('../config/database');

class ApsController {
    
    // Rota APS: Aprovar admin
    async approveAdmin(req, res) {
        try {
            const { userIdToApprove } = req.params;
            const apsUser = req.user;

            const result = await UserService.approveAdmin(userIdToApprove);
            
            await logAction(apsUser.id, 'ADMIN_APPROVED', `Admin ID: ${userIdToApprove}`);
            
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Rota APS: Bloquear empresa
    async blockCompany(req, res) {
        try {
            const { companyId } = req.params;
            const apsUser = req.user;

            const result = await UserService.blockCompany(companyId);

            await logAction(apsUser.id, 'COMPANY_BLOCKED', `Company ID: ${companyId}`);

            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async declineAdmin(req, res) {
        try {
            // Pega o ID da URL
            const { adminUserIdToDecline } = req.params;
            const apsUser = req.user; // Pega o usuário APS da sessão

            // Chama o serviço para fazer a lógica
            const result = await UserService.declineAdmin(adminUserIdToDecline);
            
            // Registra a ação no log
            await logAction(apsUser.id, 'ADMIN_DECLINED', `Admin ID: ${adminUserIdToDecline}`);
            
            res.status(200).json(result);
        } catch (error) {
            // Se algo der errado (ex: usuário não encontrado), envia o erro
            res.status(400).json({ error: error.message });
        }
    }
    
    async getPendingAdmins(req, res) {
        const db = getDb();
        try {
            const pendingAdmins = await db.all(`
                SELECT u.id, u.name, u.email, c.cnpj, c.razao_social
                FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.role = 'ADMIN' AND u.is_pending_approval = 1
            `);
            await logAction(req.user.id, 'VIEW_PENDING_ADMINS');
            res.status(200).json({ admins: pendingAdmins });
        } catch (error) {
            console.error('Erro ao buscar admins pendentes:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
}

module.exports = new ApsController();