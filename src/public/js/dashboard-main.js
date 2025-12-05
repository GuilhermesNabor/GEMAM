const API_BASE_URL = '/api';

console.log('Dashboard Script Iniciado');

// SELETORES GERAIS
const messageAreaDashboard = document.getElementById('message-area-dashboard');

// SELETORES DO ADMIN
const adminActionsCard = document.getElementById('admin-actions-card');
const registerStandardSection = document.getElementById('register-standard-section');
const registerStandardForm = document.getElementById('register-standard-form');
const adminDestListSection = document.getElementById('admin-dest-list-section'); 
const myDestList = document.getElementById('my-dest-list'); 
const teamListSection = document.getElementById('team-list-section');
const teamList = document.getElementById('team-list');
const adminLogsSection = document.getElementById('admin-logs-section');
const adminLogsList = document.getElementById('admin-logs-list');

// SELETORES DA APS
const apsAdminSection = document.getElementById('aps-admin-section');
const pendingAdminsList = document.getElementById('pending-admins-list');
const apsActiveAdminsSection = document.getElementById('aps-active-admins-section');
const activeAdminsList = document.getElementById('active-admins-list');
const apsDestSection = document.getElementById('aps-dest-section');
const pendingDestList = document.getElementById('pending-dest-list');
const historyDestList = document.getElementById('history-dest-list'); 
const apsLogsSection = document.getElementById('aps-logs-section');
const apsLogsList = document.getElementById('aps-logs-list');


// FUNÇÃO AUXILIAR DE MENSAGEM
function showMessage(message, type = 'success') {
    const area = messageAreaDashboard;
    if (!area) return;
    area.textContent = message;
    area.className = 'message-area';
    area.classList.add(type);
    area.classList.add('show');
    setTimeout(() => area.classList.remove('show'), 5000); 
}

// FUNÇÃO AUXILIAR DE STATUS (CORES)
function getStatusBadge(status) {
    if (status === 'APPROVED') return '<span style="background:#2ecc71; color:white; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">APROVADO</span>';
    if (status === 'REJECTED') return '<span style="background:#e74c3c; color:white; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">RECUSADO</span>';
    return '<span style="background:#f1c40f; color:black; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">PENDENTE</span>';
}

// FUNÇÃO GENÉRICA DE LOGS
async function fetchLogs(endpoint, elementId) {
    const list = document.getElementById(elementId);
    if (!list) return;
    list.innerHTML = '<li>Carregando logs...</li>';

    try {
        const response = await fetch(endpoint, { credentials: 'include' });
        const data = await response.json();

        if (data.logs.length === 0) {
            list.innerHTML = '<li>Nenhuma atividade registrada.</li>';
            return;
        }
        
        list.innerHTML = ''; // Limpa
        data.logs.forEach(log => {
            const li = document.createElement('li');
            li.style.borderBottom = '1px solid #eee';
            li.style.padding = '8px 0';
            li.style.fontSize = '0.9em';
            li.innerHTML = `
                <strong style="color:#555">${new Date(log.timestamp).toLocaleString()}</strong> - 
                <strong>${log.user_name || 'Sistema'}</strong>: ${log.action} 
                <br><span style="color:#777; font-size:0.85em">${log.details}</span>
            `;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

// Buscar Admins Pendentes
async function fetchPendingAdmins() {
    if (!pendingAdminsList) return;
    pendingAdminsList.innerHTML = ''; 
    try {
        const response = await fetch(`${API_BASE_URL}/aps/pending-admins`, { credentials: 'include' });
        const data = await response.json();

        if (response.ok) {
            if (data.admins.length === 0) {
                pendingAdminsList.innerHTML = '<li>Nenhum administrador pendente.</li>';
                return;
            }
            data.admins.forEach(admin => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span><strong>${admin.razao_social}</strong><br>CNPJ: ${admin.cnpj}<br>Admin: ${admin.name} (${admin.email})</span>
                    <div class="button-group">
                        <button class="btn-approve" onclick="approveAdmin(${admin.id})">Aprovar</button>
                        <button class="btn-decline" onclick="declineAdmin(${admin.id})">Recusar</button>
                    </div>`;
                pendingAdminsList.appendChild(li);
            });
        }
    } catch (e) { console.error(e); showMessage('Erro ao buscar admins.', 'error'); }
}

// Buscar Admins Ativos (Para Exclusão)
async function fetchActiveAdmins() {
    if (!activeAdminsList) return;
    activeAdminsList.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/aps/active-admins`, { credentials: 'include' });
        const data = await response.json();

        if (data.admins.length === 0) {
            activeAdminsList.innerHTML = '<li>Nenhuma empresa ativa.</li>';
            return;
        }

        data.admins.forEach(admin => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${admin.razao_social}</strong><br>Admin: ${admin.name} (${admin.email})</span>
                <button class="btn-decline" onclick="deleteAdminCascata(${admin.id})" style="padding:4px 10px; font-size:0.8em;">Excluir Empresa</button>
            `;
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            activeAdminsList.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

// Buscar Empresas de Destino Pendentes
async function fetchPendingDestCompanies() {
    if (!pendingDestList) return;
    pendingDestList.innerHTML = '';
    try {
        const response = await fetch('/destination/pending', { credentials: 'include' });
        const data = await response.json();
        
        if (response.ok) {
            if(data.companies.length === 0) {
                pendingDestList.innerHTML = '<li>Nenhuma empresa pendente.</li>';
                return;
            }
            data.companies.forEach(comp => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>
                        <strong>${comp.razao_social}</strong> (CNPJ: ${comp.cnpj})<br>
                        <small>Resp: ${comp.responsavel_tecnico}</small><br>
                        <a href="/${comp.path_licenca_operacao.replace('src/', '')}" target="_blank" style="color:#3498db">Licença</a> | 
                        <a href="/${comp.path_alvara.replace('src/', '')}" target="_blank" style="color:#3498db">Alvará</a>
                    </span>
                    <div class="button-group">
                        <button class="btn-approve-dest" onclick="approveDest(${comp.id})">Aprovar</button>
                        <button class="btn-decline-dest" onclick="declineDest(${comp.id})">Recusar</button>
                    </div>`;
                pendingDestList.appendChild(li);
            });
        }
    } catch(e) { console.error(e); showMessage('Erro ao buscar destinos.', 'error'); }
}

// Buscar Histórico da APS
async function fetchHistoryDestinations() {
    if (!historyDestList) return;
    historyDestList.innerHTML = '<li>Carregando...</li>';

    try {
        const response = await fetch('/destination/history', { credentials: 'include' });
        const data = await response.json();

        if (response.ok) {
            historyDestList.innerHTML = ''; 
            if (data.companies.length === 0) {
                historyDestList.innerHTML = '<li>Nenhum histórico disponível.</li>';
                return;
            }

            data.companies.forEach(comp => {
                const li = document.createElement('li');
                li.style.display = 'flex'; 
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                
                li.innerHTML = `
                    <span>
                        <strong>${comp.razao_social}</strong> (CNPJ: ${comp.cnpj})<br>
                        <small>Processado em: ${new Date(comp.created_at || Date.now()).toLocaleDateString()}</small>
                    </span>
                    <div>${getStatusBadge(comp.status)}</div>
                `;
                historyDestList.appendChild(li);
            });
        }
    } catch (e) { console.error('Erro fetch histórico:', e); }
}

// Buscar Meus Destinos
async function fetchMyDestinations() {
    if (!myDestList) return;
    myDestList.innerHTML = '<li>Carregando...</li>';

    try {
        const response = await fetch('/destination/my-list', { credentials: 'include' });
        const data = await response.json();

        if (data.companies.length === 0) {
            myDestList.innerHTML = '<li>Nenhum destino cadastrado.</li>';
            return;
        }
        
        myDestList.innerHTML = ''; // Limpa lista

        data.companies.forEach(comp => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            
            li.innerHTML = `
                <span>
                    <strong>${comp.razao_social}</strong> (CNPJ: ${comp.cnpj})<br>
                    <small>${comp.municipio_uf || 'Sem local'}</small> - ${getStatusBadge(comp.status)}
                </span>
                <button class="btn-decline" onclick="deleteMyDest(${comp.id})" style="padding:4px 10px; font-size:0.8em;">Excluir</button>
            `;
            myDestList.appendChild(li);
        });
    } catch (e) { console.error('Erro fetch meus destinos:', e); }
}

// Buscar Minha Equipe
async function fetchTeam() {
    if (!teamList) return;
    teamList.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/users/team`, { credentials: 'include' });
        const data = await response.json();

        if (data.users.length === 0) {
            teamList.innerHTML = '<li>Nenhum usuário na equipe.</li>';
            return;
        }

        data.users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${user.name}</strong> (${user.email})</span>
                <button class="btn-decline" onclick="deleteUser(${user.id})" style="padding:4px 10px; font-size:0.8em;">Excluir</button>
            `;
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            teamList.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

// Cadastro de Equipe (Standard)
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
                fetchTeam(); // Atualiza a lista
                fetchLogs(`${API_BASE_URL}/users/logs`, 'admin-logs-list'); // Atualiza log
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) { showMessage('Erro de conexão.', 'error'); }
    });
}

window.approveAdmin = async (id) => {
    if(!confirm('Aprovar admin?')) return;
    await fetch(`${API_BASE_URL}/aps/approve/admin/${id}`, { method: 'POST', credentials: 'include' });
    fetchPendingAdmins();
};
window.declineAdmin = async (id) => {
    if(!confirm('Recusar admin?')) return;
    await fetch(`${API_BASE_URL}/aps/decline/admin/${id}`, { method: 'POST', credentials: 'include' });
    fetchPendingAdmins();
};
window.approveDest = async (id) => {
    if(!confirm('Aprovar empresa?')) return;
    await fetch(`/destination/approve/${id}`, { method: 'POST', credentials: 'include' });
    fetchPendingDestCompanies();
    fetchHistoryDestinations(); 
};
window.rejectDest = async (id) => {
    if(!confirm('Recusar empresa?')) return;
    await fetch(`/destination/reject/${id}`, { method: 'POST', credentials: 'include' });
    fetchPendingDestCompanies();
    fetchHistoryDestinations(); 
};
window.deleteUser = async (id) => {
    if(!confirm('Tem certeza? Isso removerá o acesso deste usuário.')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE', credentials: 'include' });
        if(response.ok) {
            showMessage('Usuário removido.', 'success');
            fetchTeam();
            fetchLogs(`${API_BASE_URL}/users/logs`, 'admin-logs-list');
        }
    } catch(e) { showMessage('Erro ao deletar.', 'error'); }
};
window.deleteAdminCascata = async (id) => {
    if(!confirm('PERIGO: Isso excluirá o Administrador E TODOS OS SEUS USUÁRIOS. Continuar?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/aps/admin/${id}`, { method: 'DELETE', credentials: 'include' });
        if(response.ok) {
            showMessage('Empresa e equipe removidas.', 'success');
            fetchActiveAdmins();
            fetchLogs(`${API_BASE_URL}/aps/logs`, 'aps-logs-list');
        }
    } catch(e) { showMessage('Erro ao deletar.', 'error'); }
};

window.deleteMyDest = async (id) => {
    if(!confirm('Tem certeza que deseja excluir este destino?')) return;
    try {
        const response = await fetch(`/destination/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await response.json();
        if(response.ok) {
            showMessage(data.message, 'success');
            fetchMyDestinations(); // Recarrega a lista
        } else {
            showMessage(data.error, 'error');
        }
    } catch(e) { showMessage('Erro ao excluir.', 'error'); }
};

if (typeof userRole !== 'undefined') {
    console.log("Role detectado:", userRole); 

    if (userRole === 'APS') {
        apsAdminSection.classList.remove('hidden');
        if (apsDestSection) apsDestSection.classList.remove('hidden');
        if (apsActiveAdminsSection) apsActiveAdminsSection.classList.remove('hidden');
        if (apsLogsSection) apsLogsSection.classList.remove('hidden');
        
        fetchPendingAdmins(); 
        fetchPendingDestCompanies();
        fetchHistoryDestinations(); 
        fetchActiveAdmins();
        fetchLogs(`${API_BASE_URL}/aps/logs`, 'aps-logs-list');

    } else if (userRole === 'ADMIN') {
        if (adminActionsCard) adminActionsCard.style.display = 'block';
        if (registerStandardSection) registerStandardSection.classList.remove('hidden');
        if (adminDestListSection) adminDestListSection.classList.remove('hidden');
        if (teamListSection) teamListSection.classList.remove('hidden');
        if (adminLogsSection) adminLogsSection.classList.remove('hidden');
        
        fetchMyDestinations(); 
        fetchTeam();
        fetchLogs(`${API_BASE_URL}/users/logs`, 'admin-logs-list');

    } else if (userRole === 'STANDARD') {
        // Lógica para Usuário Padrão
        const standardSection = document.getElementById('standard-home-section');
        if (standardSection) {
            standardSection.classList.remove('hidden');
        }
    }
}