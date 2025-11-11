const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo do banco e o schema
const DB_PATH = path.join(__dirname, '..', 'database', 'nabor.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

let dbInstance = null;

// Função para inicializar o banco de dados
async function initializeDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    try {
        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        // Lê e executa o schema.sql para criar as tabelas se não existirem
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        await db.exec(schema);

        console.log('Database connected and schema initialized.');
        dbInstance = db;
        return db;
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
}

// Exporta a função para obter a instância do DB
module.exports = { initializeDatabase, getDb: () => dbInstance };