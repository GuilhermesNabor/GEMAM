const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// Rota pública para solicitação de cadastro de admin (com upload de logo)
router.post('/register/admin', UserController.registerAdmin);

// Rota protegida (ADMIN) para cadastrar usuários padrão
router.post('/register/standard', authMiddleware, isAdmin, UserController.registerStandard);

module.exports = router;