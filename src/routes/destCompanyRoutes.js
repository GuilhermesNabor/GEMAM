const express = require('express');
const router = express.Router();
const DestCompanyController = require('../controllers/destCompanyController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAPS } = require('../middlewares/roleMiddleware');

// Rota para exibir o formulário (Qualquer usuário logado pode ver)
router.get('/register', authMiddleware, DestCompanyController.renderForm);

// Rota para processar o cadastro (Uploads + Dados)
router.post('/register', authMiddleware, DestCompanyController.create);

// Rotas da APS (API JSON)
router.get('/pending', authMiddleware, isAPS, DestCompanyController.getPending);
router.post('/approve/:id', authMiddleware, isAPS, DestCompanyController.approve);
router.post('/reject/:id', authMiddleware, isAPS, DestCompanyController.reject);

// Rota para ADMIN ver suas empresas
router.get('/my-list', authMiddleware, DestCompanyController.getMyList);

// Rota para APS ver histórico (protegida por isAPS)
router.get('/history', authMiddleware, isAPS, DestCompanyController.getHistory);

// Rota para deletar destino
router.delete('/:id', authMiddleware, DestCompanyController.delete);

module.exports = router;