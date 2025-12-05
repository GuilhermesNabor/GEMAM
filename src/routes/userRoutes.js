const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// Rota pública para cadastro de admin
router.post('/register/admin', UserController.registerAdmin);

// Rotas Protegidas (ADMIN)
router.post('/register/standard', authMiddleware, isAdmin, UserController.registerStandard);
router.get('/team', authMiddleware, isAdmin, UserController.getTeam); 
router.get('/logs', authMiddleware, UserController.getLogs); 
router.delete('/:id', authMiddleware, isAdmin, UserController.deleteUser); 

module.exports = router;