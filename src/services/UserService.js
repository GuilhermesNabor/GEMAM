const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {

    // 1. Cadastro de Administrador (requer aprovação)
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
            // 1. Cria a empresa
            const companyResult = await db.run(
                'INSERT INTO companies (cnpj, razao_social, logo_path) VALUES (?, ?, ?)',
                cnpj, razao_social, logo_path
            );
            const company_id = companyResult.lastID;

            // 2. Cria o usuário admin, mas pendente de aprovação
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
        
        // 1. Encontra o usuário pendente
        const user = await db.get('SELECT * FROM users WHERE id = ? AND role = "ADMIN"', adminUserIdToDecline);

        if (!user) {
            throw new Error('Usuário administrador não encontrado.');
        }

        // 2. Garante que ele está pendente
        if (user.is_pending_approval === 0) {
            throw new Error('Este usuário já foi aprovado e não pode ser recusado.');
        }

        const companyId = user.company_id;

        // 3. Usa uma transação para garantir que tudo seja removido junto
        await db.run('BEGIN TRANSACTION');
        try {
            // 4. Remove o usuário admin pendente
            await db.run('DELETE FROM users WHERE id = ?', adminUserIdToDecline);
            
            // 5. Remove a empresa associada
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
    
    // 2. Admin cadastra usuário padrão (sem aprovação)
    async registerStandardUser(data, adminUser) {
        const db = getDb();
        const { name, phone, email, password } = data;
        const { company_id } = adminUser; // O admin logado

        // Verifica se email já existe
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

    // 3. APS aprova um admin
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

    // 4. APS bloqueia uma empresa (e toda a árvore)
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
        // 1. Aprova o novo admin (se pendente)
        await this.approveAdmin(newAdminId);

        // 2. Desativa ou rebaixa o admin antigo
        await db.run("UPDATE users SET role = 'STANDARD', is_active = 0 WHERE id = ?", oldAdminId);

        return { message: 'Administrador alterado com sucesso.' };
    }
}

module.exports = new UserService();