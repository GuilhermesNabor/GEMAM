const CrreService = require('../services/CrreService');
const UserService = require('../services/UserService');
const DestCompanyService = require('../services/DestCompanyService');
const { logAction } = require('../middlewares/logMiddleware');

class CrreController {
    
    // RENDERIZAR FORMULÁRIO
    async renderCrreForm(req, res) {
        try {
            console.log('--- Iniciando renderCrreForm ---');
            const user = req.user;
            console.log('Usuário da sessão:', user);

            if (!user || !user.company_id) {
                console.error('Usuário não autenticado ou sem empresa associada.');
                throw new Error('Usuário não autenticado ou sem empresa associada.');
            }

            console.log('Buscando informações da empresa com ID:', user.company_id);
            const companyInfo = await UserService.getCompanyInfo(user.company_id);
            console.log('Informações da empresa recebidas:', companyInfo);

            if (!companyInfo) {
                console.error('Falha ao obter informações da empresa.');
                throw new Error('Falha ao obter informações da empresa.');
            }

            console.log('Buscando destinos aprovados...');
            const approvedDestinations = await DestCompanyService.getApprovedDestinations();
            console.log('Destinos aprovados recebidos:', approvedDestinations);

            // Normaliza o path do logo para ser sempre um URL válido
            const normalizedLogoPath = companyInfo.logo_path
                ? companyInfo.logo_path.replace(/\\/g, '/').replace('src/', '')
                : '';

            const autoFillData = {
                razao_social: companyInfo.razao_social,
                cnpj: companyInfo.cnpj,
                contact_name: user.name,
                contact_phone: user.phone,
                contact_email: user.email,
                logo_path: normalizedLogoPath
            };
            console.log('Dados de auto-preenchimento preparados:', autoFillData);

            console.log('Renderizando o template crre-form...');
            res.render('crre-form', { 
                pageTitle: "Emissão de CRRE",
                user,
                autoFillData,
                approvedDestinations,
                currentDate: new Date().toLocaleDateString('pt-BR')
            });
            console.log('--- renderCrreForm concluído com sucesso ---');
        } catch (error) {
            console.error('Erro detalhado no renderCrreForm:', error);
            res.render('dashboard', { error: 'Erro ao carregar o formulário CRRE.' });
        }
    }

    // PROCESSAR SUBMISSÃO DO FORMULÁRIO
    async submitCrre(req, res) {
        try {
            const user = req.user;
            const crreData = req.body;
            
            const result = await CrreService.createCRRE(crreData, user);
            
            await logAction(user.id, 'CRRE_EMITTED', `CRRE No: ${result.crreId}`);

            // TO DO: Gerar PDF e enviar e-mails
            
            res.json({ success: true, message: result.message, crreId: result.crreId });
        } catch (error) {
            console.error(error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

module.exports = new CrreController();