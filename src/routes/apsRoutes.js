const express = require('express');
const router = express.Router();
const ApsController = require('../controllers/apsController');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAPS } = require('../middlewares/roleMiddleware');

// Rotas protegidas (apenas APS)
router.post('/approve/admin/:userIdToApprove', authMiddleware, isAPS, ApsController.approveAdmin);
router.post('/block/company/:companyId', authMiddleware, isAPS, ApsController.blockCompany);
router.get('/pending-admins', authMiddleware, isAPS, ApsController.getPendingAdmins); 
router.post('/decline/admin/:adminUserIdToDecline', authMiddleware, isAPS, ApsController.declineAdmin);

// Listar Logs Globais (APS vê tudo)
router.get('/logs', authMiddleware, isAPS, UserController.getLogs);

// Listar Admins Ativos (para poder deletar)
router.get('/active-admins', authMiddleware, isAPS, UserController.getActiveAdmins);

// Deletar Admin (APS deleta Admin + Cascata)
router.delete('/admin/:id', authMiddleware, isAPS, UserController.deleteUser);

module.exports = router;