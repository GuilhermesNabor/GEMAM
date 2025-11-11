const express = require('express');
const router = express.Router();
const ApsController = require('../controllers/apsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAPS } = require('../middlewares/roleMiddleware');

// Rotas protegidas (apenas APS)
router.post('/approve/admin/:userIdToApprove', authMiddleware, isAPS, ApsController.approveAdmin);
router.post('/block/company/:companyId', authMiddleware, isAPS, ApsController.blockCompany);
router.get('/pending-admins', authMiddleware, isAPS, ApsController.getPendingAdmins); 

router.post('/decline/admin/:adminUserIdToDecline', authMiddleware, isAPS, ApsController.declineAdmin);

module.exports = router;