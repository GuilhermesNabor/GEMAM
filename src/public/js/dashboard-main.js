const API_BASE_URL = '/api';

// Seletores do Layout do Dashboard
const registerStandardSection = document.getElementById('register-standard-section');
const apsAdminSection = document.getElementById('aps-admin-section');
const messageAreaDashboard = document.getElementById('message-area-dashboard');
const pendingAdminsList = document.getElementById('pending-admins-list');
const registerStandardForm = document.getElementById('register-standard-form');
const logoutBtn = document.getElementById('logout-btn'); // O botão de logout agora é um link normal

// Funções Auxiliares de Mensagem
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

// Funções do Layout do Dashboard
async function fetchPendingAdmins() {
    pendingAdminsList.innerHTML = ''; // Limpa a lista
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

            // Adiciona listeners para os botões de aprovar
            pendingAdminsList.querySelectorAll('.btn-approve').forEach(button => {
                button.addEventListener('click', approveAdmin);
            });
            
            // Adiciona listeners para os novos botões de recusar
            pendingAdminsList.querySelectorAll('.btn-decline').forEach(button => {
                button.addEventListener('click', declineAdmin); // Nova função
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
            method: 'POST'
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

    // Confirmação para evitar cliques acidentais
    if (!confirm('Tem certeza que deseja recusar este administrador? A solicitação será excluída.')) {
        return;
    }

    try {
        // 3. Chama a nova rota da API
        const response = await fetch(`${API_BASE_URL}/aps/decline/admin/${adminId}`, {
            method: 'POST' 
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            fetchPendingAdmins(); // Recarrega a lista
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão ao recusar administrador.', 'error');
    }
}

if (typeof userRole !== 'undefined') {
    if (userRole === 'APS') {
        apsAdminSection.classList.remove('hidden');
        fetchPendingAdmins(); // Carrega os dados da APS
    } else if (userRole === 'ADMIN') {
        registerStandardSection.classList.remove('hidden');
    }
}