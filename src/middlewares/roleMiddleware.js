function checkRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
        }
        next();
    };
}

module.exports = {
    isAPS: checkRole('APS'),
    isAdmin: checkRole('ADMIN')
};