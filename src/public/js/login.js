document.addEventListener('DOMContentLoaded', () => {
    // SELETORES
    const container = document.getElementById('login-layout');
    const showRegisterLink = document.getElementById('show-register-admin');
    const showLoginLink = document.getElementById('show-login');

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-admin-section');
    
    // Formulários
    const registerAdminForm = document.getElementById('register-admin-form');
    
    // Área de Mensagem
    const messageArea = document.getElementById('message-area-login');

    // FUNÇÃO DE MENSAGEM (SÓ PARA ESTA PÁGINA)
    function showMessage(message, type = 'success') {
        if (!messageArea) return;
        messageArea.textContent = message;
        messageArea.className = 'message-area';
        messageArea.classList.add(type);
        messageArea.classList.add('show');
        
        setTimeout(() => {
            messageArea.classList.remove('show');
        }, 5000); 
    }

    // LÓGICA DE ANIMAÇÃO DO SLIDE
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            container.classList.add('right-panel-active');
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            container.classList.remove('right-panel-active');
            loginSection.classList.remove('hidden');
            registerSection.classList.add('hidden');
        });
    }

    if (registerAdminForm) {
        registerAdminForm.addEventListener('submit', async (e) => {
            // 1. Impede o envio padrão (que mostra o JSON)
            e.preventDefault(); 
            
            // 2. Pega os dados do formulário (incluindo o arquivo/logo)
            const formData = new FormData(registerAdminForm);

            // Validação do CNPJ (copiada do seu backend)
            const cnpj = formData.get('cnpj');
            if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj)) {
                showMessage('Formato de CNPJ inválido. Use XX.XXX.XXX/XXXX-XX', 'error');
                return;
            }

            try {
                // 3. Envia os dados em segundo plano (AJAX/Fetch)
                const response = await fetch('/api/users/register/admin', {
                    method: 'POST',
                    body: formData 
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(data.message, 'success');
                    registerAdminForm.reset();
                    // Simula o clique no link "Fazer Login" para a animação
                    showLoginLink.click(); 
                } else {
                    showMessage(data.error, 'error');
                }
            } catch (error) {
                showMessage('Erro de conexão ao tentar se cadastrar.', 'error');
            }
        });
    }
});