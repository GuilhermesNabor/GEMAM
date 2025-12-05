function checkRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
        }
        next();
    };
}

exports.isAdminOrStandard = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STANDARD')) {
        next();
    } else {
        res.status(403).send('Acesso negado. Apenas Admin ou Usuário da equipe podem emitir CRRE.');
    }
};

function isAdminOrStandard(req, res, next) {
    if (!req.user) {
        return res.redirect('/login');
    }
    if (req.user.role === 'ADMIN' || req.user.role === 'STANDARD') {
        return next();
    }
    return res.status(403).send('Acesso negado. Apenas Admin ou Equipe podem acessar.');
}

module.exports = {
    isAPS: checkRole('APS'),
    isAdmin: checkRole('ADMIN'),
    isAdminOrStandard
};