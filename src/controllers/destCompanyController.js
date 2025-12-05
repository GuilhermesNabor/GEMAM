const DestCompanyService = require('../services/DestCompanyService');
const multer = require('multer');
const path = require('path');

// Configuração de Upload (Salva em /uploads/docs)
const storage = multer.diskStorage({
    destination: './src/uploads/docs/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configura para aceitar 3 arquivos específicos
const upload = multer({ storage: storage }).fields([
    { name: 'file_licenca_operacao', maxCount: 1 },
    { name: 'file_alvara', maxCount: 1 },
    { name: 'file_ctf', maxCount: 1 }
]);

class DestCompanyController {

    // Renderiza o formulário (GET)
    renderForm(req, res) {
        res.render('register_destination', { layout: 'main', user: req.session.user });
    }

    // Processa o cadastro (POST)
    create(req, res) {
        upload(req, res, async (err) => {
            if (err) return res.status(400).json({ error: err.message });

            // Validação básica dos arquivos
            if (!req.files['file_licenca_operacao'] || !req.files['file_alvara'] || !req.files['file_ctf']) {
                return res.status(400).json({ error: 'Todos os documentos obrigatórios devem ser enviados.' });
            }

            try {
                // Função para normalizar o path
                const normalizePath = (p) => p.replace(/\\/g, '/').replace('src/', '');

                const data = {
                    ...req.body,
                    path_licenca_operacao: normalizePath(req.files['file_licenca_operacao'][0].path),
                    path_alvara: normalizePath(req.files['file_alvara'][0].path),
                    path_comprovante_ctf: normalizePath(req.files['file_ctf'][0].path)
                };

                const result = await DestCompanyService.create(data, req.session.user.id);
                res.status(201).json(result);

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro ao cadastrar empresa de destino.' });
            }
        });
    }

    // API para APS listar pendentes
    async getPending(req, res) {
        try {
            const list = await DestCompanyService.getPending();
            res.json({ companies: list });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // API para APS aprovar
    async approve(req, res) {
        try {
            const result = await DestCompanyService.approve(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // API para APS recusar
    async reject(req, res) {
        try {
            const result = await DestCompanyService.reject(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Lista para o ADMIN
    async getMyList(req, res) {
        try {
            const list = await DestCompanyService.getByUser(req.session.user.id);
            res.json({ companies: list });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Histórico para a APS
    async getHistory(req, res) {
        try {
            const list = await DestCompanyService.getHistory();
            res.json({ companies: list });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            // Passa o ID do destino, o ID do usuário e o Papel (Role) para validar
            await DestCompanyService.deleteDestination(id, req.session.user.id, req.session.user.role);
            res.json({ message: 'Destino excluído.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new DestCompanyController();