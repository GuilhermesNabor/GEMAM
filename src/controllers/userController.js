const UserService = require('../services/UserService');
const { logAction } = require('../middlewares/logMiddleware');

// Configuração do Multer para upload do Logo
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './src/uploads/logos/',
    filename: (req, file, cb) => {
        const cnpj = req.body.cnpj.replace(/[^0-9]/g, ''); // Limpa o CNPJ
        cb(null, `${cnpj}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage, fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Formato de logo inválido. Apenas PNG, JPEG e JPG são permitidos.'), false);
    }
}}).single('logo');


class UserController {

    // Rota pública: Admin solicita cadastro
    async registerAdmin(req, res) {
        // Primeiro, processa o upload
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'Logo (PNG) é obrigatório.' });
            }

            try {
                const data = { ...req.body, logo_path: req.file.path };
                const result = await UserService.registerAdminRequest(data);
                
                // Log (sem user_id pois é cadastro)
                await logAction(null, 'ADMIN_REGISTRATION_REQUEST', `CNPJ: ${data.cnpj}`);
                
                res.status(201).json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }

    // Rota de Admin: Admin cadastra seu usuário
    async registerStandard(req, res) {
        try {
            // req.user é injetado pelo authMiddleware
            const adminUser = req.user;
            const result = await UserService.registerStandardUser(req.body, adminUser);
            
            await logAction(adminUser.id, 'STANDARD_USER_CREATED', `Email: ${req.body.email}`);
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new UserController();