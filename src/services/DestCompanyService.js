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
}

module.exports = new DestCompanyService();