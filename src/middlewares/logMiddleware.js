const { getDb } = require('../config/database');

// Este é um middleware 'after-response'.

async function logAction(userId, action, details = '') {
    try {
        const db = getDb();
        await db.run(
            'INSERT INTO action_logs (user_id, action, details) VALUES (?, ?, ?)',
            userId,
            action,
            details
        );
    } catch (error) {
        console.error('Failed to log action:', error);
    }
}

module.exports = { logAction };