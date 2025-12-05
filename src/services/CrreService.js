const { getDb } = require('../config/database');

class CrreService {
    
    // Gera um número sequencial único (simplesmente pega o último ID e incrementa, ou um timestamp formatado)
    async generateSequentialNumber() {
        const db = getDb();
        const lastCrre = await db.get("SELECT crre_number FROM crres ORDER BY id DESC LIMIT 1");
        
        let newNumber;
        if (lastCrre && lastCrre.crre_number) {
            // Assume um formato numérico simples para o sequencial
            const lastId = parseInt(lastCrre.crre_number.split('-').pop()) || 0;
            newNumber = lastId + 1;
        } else {
            newNumber = 1;
        }
        
        // Simplesmente retorna o ano atual + número sequencial
        const year = new Date().getFullYear();
        return `${year}-${newNumber.toString().padStart(5, '0')}`; 
    }

    // Cria e salva o CRRE
    async createCRRE(crreData, user) {
        const db = getDb();
        const {
            vessel_name, imo_number, nationality, navigation_company, armador_name, docking_location,
            start_date, start_time, end_date, end_time, retrieval_mode, destination_company_id,
            residues // Array de objetos de resíduos
        } = crreData;
        
        // Autopreenchimento de dados
        const crre_number = await this.generateSequentialNumber();
        const issue_date = new Date().toISOString();
        const company_id = user.company_id;
        const created_by_user_id = user.id;

        // Inserir dados principais na tabela CRRES
        const crreResult = await db.run(
            `INSERT INTO crres (
                crre_number, issue_date, vessel_name, imo_number, nationality, navigation_company, 
                armador_name, docking_location, service_start_date, service_start_time, 
                service_end_date, service_end_time, retrieval_mode, company_id, created_by_user_id, destination_company_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            crre_number, issue_date, vessel_name, imo_number, nationality, navigation_company, 
            armador_name, docking_location, start_date, start_time, 
            end_date, end_time, retrieval_mode, company_id, created_by_user_id, destination_company_id
        );

        const crre_id = crreResult.lastID;

        // Inserir os resíduos relacionados
        for (const res of residues) {
            await db.run(
                `INSERT INTO crre_residues (
                    crre_id, waste_number, unit, quantity, observations, category, mtr_number, temporary_storage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                crre_id, res.waste_number, res.unit, parseFloat(res.quantity.replace(',', '.')), res.observations, 
                res.category || null, res.mtr_number || null, res.temporary_storage ? 1 : 0
            );
        }

        return { 
            message: `CRRE ${crre_number} emitido com sucesso.`, 
            crreId: crre_id 
        };
    }
}

module.exports = new CrreService();