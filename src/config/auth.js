require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'jhbefeqwbcnvqbnvqonnvev',
    jwtExpiresIn: '1h', // Token expira em 1 hora
    bcryptSaltRounds: 10 
};