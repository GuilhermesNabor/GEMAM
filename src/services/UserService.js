const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {

    // Cadastro de Administrador (requer aprovação)
    async registerAdminRequest(data) {
        const db = getDb();
        const { razao_social, cnpj, logo_path, name, phone, email, password } = data;

        // Verifica se CNPJ ou Email já existem
        const existingCompany = await db.get('SELECT id FROM companies WHERE cnpj = ?', cnpj);
        if (existingCompany) {
            throw new Error('CNPJ já cadastrado.');
        }
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
        if (existingUser) {
            throw new Error('E-mail já cadastrado.');
        }

        const password_hash = await bcrypt.hash(password, 10);

        // Usa transação para garantir consistência
        await db.run('BEGIN TRANSACTION');
        try {
            // Cria a empresa
            const companyResult = await db.run(
                'INSERT INTO companies (cnpj, razao_social, logo_path) VALUES (?, ?, ?)',
                cnpj, razao_social, logo_path
            );
            const company_id = companyResult.lastID;

            // Cria o usuário admin, mas pendente de aprovação
            await db.run(
                `INSERT INTO users (company_id, name, email, phone, password_hash, role, is_pending_approval)
                 VALUES (?, ?, ?, ?, ?, 'ADMIN', 1)`,
                company_id, name, email, phone, password_hash
            );

            await db.run('COMMIT');
            return { message: 'Solicitação de cadastro de administrador enviada para aprovação da APS.' };

        } catch (error) {
            await db.run('ROLLBACK');
            throw new Error('Erro ao processar cadastro: ' + error.message);
        }
    }

    async declineAdmin(adminUserIdToDecline) {
        const db = getDb();
        
        // Encontra o usuário pendente
        const user = await db.get('SELECT * FROM users WHERE id = ? AND role = "ADMIN"', adminUserIdToDecline);

        if (!user) {
            throw new Error('Usuário administrador não encontrado.');
        }

        // Garante que ele está pendente
        if (user.is_pending_approval === 0) {
            throw new Error('Este usuário já foi aprovado e não pode ser recusado.');
        }

        const companyId = user.company_id;

        // Usa uma transação para garantir que tudo seja removido junto
        await db.run('BEGIN TRANSACTION');
        try {
            // Remove o usuário admin pendente
            await db.run('DELETE FROM users WHERE id = ?', adminUserIdToDecline);
            
            // Remove a empresa associada
            if (companyId) {
                // Pega o logo antes de deletar a empresa
                const company = await db.get('SELECT logo_path FROM companies WHERE id = ?', companyId);
                
                await db.run('DELETE FROM companies WHERE id = ?', companyId);
                
                // if (company && company.logo_path) {
                //    fs.unlinkSync(path.join(__dirname, '..', company.logo_path));
                // }
            }
            
            await db.run('COMMIT');
            return { message: 'Solicitação de administrador recusada e removida com sucesso.' };

        } catch (error) {
            await db.run('ROLLBACK');
            throw new Error('Erro ao processar recusa: ' + error.message);
        }
    }
    
    async getCompanyInfo(companyId) {
        const db = getDb();
        const company = await db.get("SELECT * FROM companies WHERE id = ?", companyId);
        if (!company) return { razao_social: '', cnpj: '', logo_path: '' }; // Proteção contra null
        if (!company.logo_path) company.logo_path = ''; 
        return company;
    }

    // Admin cadastra usuário padrão (sem aprovação)
    async registerStandardUser(data, adminUser) {
        const db = getDb();
        const { name, phone, email, password } = data;
        const { company_id } = adminUser; // O ID da empresa vem do Admin logado

        // Verificação extra de segurança
        if (!company_id) {
            throw new Error('Erro: Administrador não possui empresa vinculada.');
        }

        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
        if (existingUser) {
            throw new Error('E-mail já cadastrado.');
        }

        const password_hash = await bcrypt.hash(password, 10);

        await db.run(
            `INSERT INTO users (company_id, name, email, phone, password_hash, role, is_pending_approval, is_active)
             VALUES (?, ?, ?, ?, ?, 'STANDARD', 0, 1)`,
            company_id, name, email, phone, password_hash
        );

        return { message: 'Usuário padrão cadastrado com sucesso.' };
    }

    // APS aprova um admin
    async approveAdmin(adminUserIdToApprove) {
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ? AND role = "ADMIN"', adminUserIdToApprove);

        if (!user) {
            throw new Error('Usuário administrador não encontrado.');
        }

        if (user.is_pending_approval === 0) {
            throw new Error('Este usuário já está aprovado.');
        }

        await db.run(
            'UPDATE users SET is_pending_approval = 0, is_active = 1 WHERE id = ?',
            adminUserIdToApprove
        );

        return { message: 'Administrador aprovado com sucesso.' };
    }

    // APS bloqueia uma empresa (e toda a árvore)
    async blockCompany(companyId) {
        const db = getDb();
        const company = await db.get('SELECT * FROM companies WHERE id = ?', companyId);
        if (!company) {
            throw new Error('Empresa não encontrada.');
        }

        // Bloqueia a empresa. O middleware de autenticação fará o resto.
        await db.run('UPDATE companies SET is_blocked = 1 WHERE id = ?', companyId);
        return { message: 'Empresa e todos os usuários associados foram bloqueados.' };
    }

    async changeAdmin(oldAdminId, newAdminId) {
        const db = getDb();
        // Aprova o novo admin (se pendente)
        await this.approveAdmin(newAdminId);

        // Desativa ou rebaixa o admin antigo
        await db.run("UPDATE users SET role = 'STANDARD', is_active = 0 WHERE id = ?", oldAdminId);

        return { message: 'Administrador alterado com sucesso.' };
    }

    // Buscar Equipe (Para o Admin ver seus usuários)
    async getTeam(companyId) {
        const db = getDb();
        // Busca usuários que tenham O MESMO company_id do admin
        return await db.all(
            "SELECT id, name, email, phone FROM users WHERE company_id = ? AND role = 'STANDARD'", 
            companyId
        );
    }

    // Buscar Logs (Diferente para APS e Admin)
    async getLogs(user) {
        const db = getDb();
        
        if (user.role === 'APS') {
            // APS vê TUDO (limitado aos últimos 50 para não travar)
            return await db.all(`
                SELECT l.action, l.details, l.timestamp, u.name as user_name, u.role 
                FROM action_logs l
                LEFT JOIN users u ON l.user_id = u.id
                ORDER BY l.timestamp DESC LIMIT 50
            `);
        } else {
            // Admin vê apenas logs da SUA empresa
            return await db.all(`
                SELECT l.action, l.details, l.timestamp, u.name as user_name 
                FROM action_logs l
                JOIN users u ON l.user_id = u.id
                WHERE u.company_id = ?
                ORDER BY l.timestamp DESC LIMIT 50
            `, user.company_id);
        }
    }

    // Buscar Admins Ativos (Para a APS poder deletar)
    async getActiveAdmins() {
        const db = getDb();
        return await db.all("SELECT u.*, c.razao_social FROM users u JOIN companies c ON u.company_id = c.id WHERE u.role = 'ADMIN' AND u.is_active = 1");
    }

    // Deletar Usuário (Com lógica de cascata)
    async deleteUser(userIdToDelete, requestingUser) {
        const db = getDb();
        
        // Busca o alvo para saber quem é
        const targetUser = await db.get("SELECT * FROM users WHERE id = ?", userIdToDelete);
        if (!targetUser) throw new Error("Usuário não encontrado.");

        // Regra: Admin só deleta Standard da mesma empresa
        if (requestingUser.role === 'ADMIN') {
            if (targetUser.role !== 'STANDARD' || targetUser.company_id !== requestingUser.company_id) {
                throw new Error("Permissão negada.");
            }
            // Deleta o Standard
            await db.run("DELETE FROM users WHERE id = ?", userIdToDelete);
            return { message: `Usuário ${targetUser.name} removido.` };
        }

        // Regra: APS deleta qualquer um (com cascata)
        if (requestingUser.role === 'APS') {
            if (targetUser.role === 'ADMIN') {
                // Deleta o Admin e todos os seus Standards
                await db.run("BEGIN TRANSACTION");
                try {
                    // Deleta usuários Standard dessa empresa
                    await db.run("DELETE FROM users WHERE company_id = ? AND role = 'STANDARD'", targetUser.company_id);
                    // Deleta o Admin
                    await db.run("DELETE FROM users WHERE id = ?", userIdToDelete);
                    await db.run("COMMIT");
                    return { message: `Administrador ${targetUser.name} e toda sua equipe foram removidos.` };
                } catch (err) {
                    await db.run("ROLLBACK");
                    throw err;
                }
            } else {
                // APS deletando Standard avulso (raro, mas possível)
                await db.run("DELETE FROM users WHERE id = ?", userIdToDelete);
                return { message: "Usuário removido." };
            }
        }
    }
}

module.exports = new UserService();