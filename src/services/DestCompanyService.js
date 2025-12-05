const { getDb } = require('../config/database');

class DestCompanyService {
    
    async create(data, userId) {
        const db = getDb();
        const {
            razao_social, inscricao_estadual, cnpj, licenca_ibama,
            data_vencimento, endereco, municipio_uf, cep,
            email_contato, telefone_contato, responsavel_tecnico, registro_profissional,
            path_licenca_operacao, path_alvara, path_comprovante_ctf
        } = data;

        await db.run(
            `INSERT INTO destination_companies (
                created_by_user_id, razao_social, inscricao_estadual, cnpj, licenca_ibama,
                data_vencimento, endereco, municipio_uf, cep,
                email_contato, telefone_contato, responsavel_tecnico, registro_profissional,
                path_licenca_operacao, path_alvara, path_comprovante_ctf, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            userId, razao_social, inscricao_estadual, cnpj, licenca_ibama,
            data_vencimento, endereco, municipio_uf, cep,
            email_contato, telefone_contato, responsavel_tecnico, registro_profissional,
            path_licenca_operacao, path_alvara, path_comprovante_ctf
        );

        return { message: 'Empresa de destino cadastrada e aguardando aprovação da APS.' };
    }

    async getPending() {
        const db = getDb();
        return await db.all("SELECT * FROM destination_companies WHERE status = 'PENDING'");
    }

    async approve(id) {
        const db = getDb();
        await db.run("UPDATE destination_companies SET status = 'APPROVED' WHERE id = ?", id);
        return { message: 'Empresa de destino aprovada com sucesso.' };
    }

    async reject(id) {
        const db = getDb();
        await db.run("UPDATE destination_companies SET status = 'REJECTED' WHERE id = ?", id);
        return { message: 'Empresa de destino recusada.' };
    }
    
    async getByUser(userId) {
        const db = getDb();
        return await db.all("SELECT * FROM destination_companies WHERE created_by_user_id = ? ORDER BY created_at DESC", userId);
    }

    // Busca tudo que NÃO está pendente (Aprovado/Recusado)
    async getHistory() {
        const db = getDb();
        return await db.all("SELECT * FROM destination_companies WHERE status != 'PENDING' ORDER BY created_at DESC");
    }

    async deleteDestination(destId, userId, userRole) {
        const db = getDb();
        
        // Verifica se o destino existe e quem criou
        const dest = await db.get("SELECT * FROM destination_companies WHERE id = ?", destId);
        if (!dest) throw new Error("Destino não encontrado.");

        // Se for ADMIN, só pode deletar o que ele criou
        if (userRole === 'ADMIN' && dest.created_by_user_id !== userId) {
            throw new Error("Permissão negada. Você só pode excluir destinos que cadastrou.");
        }

        await db.run("DELETE FROM destination_companies WHERE id = ?", destId);
        return { message: "Empresa de destino excluída com sucesso." };
    }
    
    async getApprovedDestinations() {
        const db = getDb();
        return await db.all("SELECT id, razao_social, cnpj FROM destination_companies WHERE status = 'APPROVED'");
    }
}

module.exports = new DestCompanyService();