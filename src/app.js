const express = require('express');
const { initializeDatabase } = require('./config/database');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { engine } = require('express-handlebars');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Importa as rotas (Mantemos as de API)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const apsRoutes = require('./routes/apsRoutes');
const AuthController = require('./controllers/authController');

const app = express();

app.disable('view cache');

// CONFIGURAÇÃO DO HANDLEBARS (Template Engine)
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
//

// CONFIGURAÇÃO DE MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para formulários HTML
app.use(cookieParser());

// CONFIGURAÇÃO DA SESSÃO
app.use(session({
    secret: process.env.SESSION_SECRET || 'um_segredo_muito_forte', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));
//

// CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS (CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//-

// NOVAS ROTAS WEB (Renderização)
// Middleware de "Guarda"
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // Usuário logado, continue
    }
    res.redirect('/login'); // Usuário não logado, expulsa para /login
}

// Rota Raiz: Redireciona para o local certo
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Rota de Login (GET): Mostra a página de login
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard'); 
    }
    // Simplificado: Apenas renderiza a página de login. O JS cuida do resto.
    res.render('login', { layout: 'main' });
});

app.post('/login', AuthController.login);

// Rota de Dashboard (GET): A página logada
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    // Passa os dados do usuário da sessão para o template
    res.render('dashboard', { layout: 'main', user: req.session.user });
});

// Rota de Logout (GET)
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard'); // Se falhar, fica no dashboard
        }
        res.clearCookie('connect.sid'); // Limpa o cookie
        res.redirect('/login'); // Sucesso, volta pro login
    });
});
//

// ROTAS DE API (As que já tínhamos)
// Vamos modificar a /api/auth/login
// As outras continuam funcionando
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/aps', apsRoutes);

// Função de Início (Igual)
async function startServer() {
    await initializeDatabase(); 
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = { startServer };