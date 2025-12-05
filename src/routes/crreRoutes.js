const express = require('express');
const router = express.Router();
const CrreController = require('../controllers/CrreController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdminOrStandard } = require('../middlewares/roleMiddleware');

// Rota para renderizar o formulário
router.get('/register', authMiddleware, isAdminOrStandard, (req, res, next) => {
    console.log('Rota /crre/register acessada');
    next();
}, CrreController.renderCrreForm);

// Rota para submeter o formulário
router.post('/register', authMiddleware, isAdminOrStandard, CrreController.submitCrre);

module.exports = router;