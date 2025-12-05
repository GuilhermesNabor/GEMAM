const UserService = require('../services/UserService');
const { logAction } = require('../middlewares/logMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload do Logo
const storage = multer.diskStorage({
    destination: './src/uploads/logos/',
    filename: (req, file, cb) => {
        const cnpj = req.body.cnpj.replace(/[^0-9]/g, ''); 
        cb(null, `${cnpj}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Formato de logo inválido. Apenas PNG, JPEG e JPG são permitidos.'), false);
        }
    }
}).single('logo');

class UserController {

    // Admin solicita cadastro
    async registerAdmin(req, res) {
        upload(req, res, async (err) => {
            if (err) return res.status(400).json({ error: err.message });
            if (!req.file) return res.status(400).json({ error: 'Logo é obrigatório.' });

            try {
                const data = { ...req.body, logo_path: req.file.path };
                const result = await UserService.registerAdminRequest(data);
                await logAction(null, 'ADMIN_REGISTRATION_REQUEST', `CNPJ: ${data.cnpj}`);
                res.status(201).json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }

    // Admin cadastra usuário padrão (Equipe)
    async registerStandard(req, res) {
        try {
            const adminUser = req.user; 
            const result = await UserService.registerStandardUser(req.body, adminUser);
            await logAction(adminUser.id, 'STANDARD_USER_CREATED', `Email: ${req.body.email}`);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Buscar Equipe
    async getTeam(req, res) {
        try {
            const list = await UserService.getTeam(req.user.company_id);
            res.json({ users: list });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    // Buscar Logs
    async getLogs(req, res) {
        try {
            const logs = await UserService.getLogs(req.user);
            res.json({ logs: logs });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    // Buscar Admins Ativos (Para APS)
    async getActiveAdmins(req, res) {
        try {
            const list = await UserService.getActiveAdmins();
            res.json({ admins: list });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    // Deletar Usuário
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const result = await UserService.deleteUser(id, req.user);
            await logAction(req.user.id, 'USER_DELETED', `Deletou o usuário ID: ${id}`);
            res.json(result);
        } catch (error) { res.status(400).json({ error: error.message }); }
    }
}

module.exports = new UserController();