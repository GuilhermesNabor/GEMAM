const API_BASE_URL = '/api';

// SELETORES ORIGINAIS
const registerStandardSection = document.getElementById('register-standard-section');
const apsAdminSection = document.getElementById('aps-admin-section');
const messageAreaDashboard = document.getElementById('message-area-dashboard');
const pendingAdminsList = document.getElementById('pending-admins-list');
const registerStandardForm = document.getElementById('register-standard-form');
const logoutBtn = document.getElementById('logout-btn');

// NOVOS SELETORES (Para Empresas de Destino)
const apsDestSection = document.getElementById('aps-dest-section');
const pendingDestList = document.getElementById('pending-dest-list');


// FUNÇÃO AUXILIAR DE MENSAGEM (MANTIDA)
function showMessage(message, type = 'success') {
    const area = messageAreaDashboard;
    area.textContent = message;
    area.className = 'message-area';
    area.classList.add(type);
    area.classList.add('show');
    
    setTimeout(() => {
        area.classList.remove('show');
    }, 5000); 
}

async function fetchPendingAdmins() {
    pendingAdminsList.innerHTML = ''; 
    try {
        const response = await fetch(`${API_BASE_URL}/aps/pending-admins`, {
            credentials: 'include' 
        });
        const data = await response.json();

        if (response.ok) {
            if (data.admins.length === 0) {
                pendingAdminsList.innerHTML = '<li>Nenhum administrador pendente de aprovação.</li>';
                return;
            }
            data.admins.forEach(admin => {
                const listItem = document.createElement('li');
                
                listItem.innerHTML = `
                    <span>
                        <strong>${admin.razao_social}</strong><br>
                        CNPJ: ${admin.cnpj}<br>
                        Admin: ${admin.name} (${admin.email})
                    </span>
                    <div class="button-group">
                        <button class="btn-approve" data-id="${admin.id}">Aprovar</button>
                        <button class="btn-decline" data-id="${admin.id}">Recusar</button>
                    </div>
                `;
                
                pendingAdminsList.appendChild(listItem);
            });

            pendingAdminsList.querySelectorAll('.btn-approve').forEach(button => {
                button.addEventListener('click', approveAdmin);
            });
            
            pendingAdminsList.querySelectorAll('.btn-decline').forEach(button => {
                button.addEventListener('click', declineAdmin);
            });

        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão ao buscar administradores pendentes.', 'error');
    }
}

async function approveAdmin(e) {
    const adminId = e.target.dataset.id;
    if (!adminId) return;

    if (!confirm('Tem certeza que deseja aprovar este administrador?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/aps/approve/admin/${adminId}`, {
            method: 'POST',
            credentials: 'include' // Adicionado para segurança
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            fetchPendingAdmins(); 
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão ao aprovar administrador.', 'error');
    }
}

async function declineAdmin(e) {
    const adminId = e.target.dataset.id;
    if (!adminId) return;

    if (!confirm('Tem certeza que deseja recusar este administrador? A solicitação será excluída.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/aps/decline/admin/${adminId}`, {
            method: 'POST',
            credentials: 'include' // Adicionado para segurança
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            fetchPendingAdmins(); 
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão ao recusar administrador.', 'error');
    }
}

async function fetchPendingDestCompanies() {
    if (!pendingDestList) return; // Segurança caso o elemento não exista
    pendingDestList.innerHTML = '';
    
    try {
        // A rota aqui é /destination/pending, não /api/...
        const response = await fetch('/destination/pending', { 
            credentials: 'include' 
        });
        const data = await response.json();
        
        if (response.ok) {
            if(data.companies.length === 0) {
                pendingDestList.innerHTML = '<li>Nenhuma empresa de destino pendente.</li>';
                return;
            }
            
            data.companies.forEach(comp => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>
                        <strong>${comp.razao_social}</strong> (CNPJ: ${comp.cnpj})<br>
                        <small>Resp: ${comp.responsavel_tecnico}</small><br>
                        <a href="/${comp.path_licenca_operacao}" target="_blank" style="color:#3498db">Licença</a> | 
                        <a href="/${comp.path_alvara}" target="_blank" style="color:#3498db">Alvará</a>
                    </span>
                    <div class="button-group">
                        <button class="btn-approve-dest" data-id="${comp.id}">Aprovar</button>
                        <button class="btn-decline-dest" data-id="${comp.id}">Recusar</button>
                    </div>
                `;
                pendingDestList.appendChild(li);
            });

            // Adiciona listeners para os botões de destino
            pendingDestList.querySelectorAll('.btn-approve-dest').forEach(button => {
                button.addEventListener('click', approveDest);
            });
            pendingDestList.querySelectorAll('.btn-decline-dest').forEach(button => {
                button.addEventListener('click', declineDest);
            });
        }
    } catch(e) { 
        console.error(e);
        showMessage('Erro ao buscar empresas de destino.', 'error');
    }
}

async function approveDest(e) {
    const id = e.target.dataset.id;
    if(!confirm('Aprovar empresa de destino?')) return;
    
    try {
        const response = await fetch(`/destination/approve/${id}`, { 
            method: 'POST', 
            credentials: 'include' 
        });
        const data = await response.json();
        if(response.ok) {
            showMessage(data.message, 'success');
            fetchPendingDestCompanies();
        } else {
            showMessage(data.error, 'error');
        }
    } catch(e) { showMessage('Erro ao aprovar.', 'error'); }
}

async function declineDest(e) {
    const id = e.target.dataset.id;
    if(!confirm('Recusar empresa de destino?')) return;

    try {
        const response = await fetch(`/destination/reject/${id}`, { 
            method: 'POST', 
            credentials: 'include' 
        });
        const data = await response.json();
        if(response.ok) {
            showMessage(data.message, 'success');
            fetchPendingDestCompanies();
        } else {
            showMessage(data.error, 'error');
        }
    } catch(e) { showMessage('Erro ao recusar.', 'error'); }
}

// Lógica para cadastro de usuário padrão (mantida para ADMIN)
if (registerStandardForm) {
    registerStandardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('standard_name').value.trim();
        const phone = document.getElementById('standard_phone').value.trim();
        const email = document.getElementById('standard_email').value.trim();
        const password = document.getElementById('standard_password').value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/users/register/standard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email, password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message, 'success');
                registerStandardForm.reset();
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('Erro de conexão ou no servidor.', 'error');
        }
    });
}

if (typeof userRole !== 'undefined') {
    if (userRole === 'APS') {
        // 1. Mostra Painel de Admins
        apsAdminSection.classList.remove('hidden');
        fetchPendingAdmins(); 

        // 2. Mostra Painel de Empresas de Destino (NOVO)
        if (apsDestSection) {
            apsDestSection.classList.remove('hidden');
            fetchPendingDestCompanies(); // Chama a nova função
        }

    } else if (userRole === 'ADMIN') {
        registerStandardSection.classList.remove('hidden');
    }
}