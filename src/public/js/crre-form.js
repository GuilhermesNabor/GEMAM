// Lista de Tipos de Resíduos (ANTAQ)
const wasteTypes = [
    { id: 1, name: "1. Água de lastro suja" },
    { id: 2, name: "2. Água oleosa de porão" },
    { id: 3, name: "3. Mistura oleosa c/ químicos" },
    { id: 4, name: "4. Resíduos oleosos (borra)" },
    { id: 5, name: "5. Água lavagem tanques" },
    { id: 6, name: "6. Crosta/Borra raspagem" },
    { id: 7, name: "7. Subst. químicas nocivas" },
    { id: 8, name: "8. Esgoto/Águas servidas" },
    { id: 9, name: "9. Lixo doméstico oper.", hasSub: true },
    { id: 10, name: "10. Res. limpeza exaustão" },
    { id: 11, name: "11. Subst. redutoras ozônio" },
    { id: 12, name: "12. Resíduos saúde" },
    { id: 13, name: "13. Outros", hasText: true }
];

const subCategories = [
    "Plásticos", "Resíduos alimentares", "Resíduos domésticos", "Óleo de cozinha",
    "Cinzas de incinerador", "Resíduos operacionais", "Carcaças de animais",
    "Equipamentos de pesca", "E-waste", "Resíduos de carga (não HME)", "Resíduos de carga HME"
];

let rowCount = 0;

// Função para adicionar linha
function addWasteRow() {
    if (rowCount >= 20) {
        alert("Máximo de 20 linhas permitido.");
        return;
    }
    rowCount++;

    const tbody = document.getElementById('waste-rows');
    const tr = document.createElement('tr');
    tr.id = `row-${rowCount}`;
    
    // Gera as opções do Select
    let options = wasteTypes.map(t => `<option value="${t.id}" data-has-sub="${t.hasSub || false}" data-has-text="${t.hasText || false}">${t.name}</option>`).join('');

    tr.innerHTML = `
        <td>
            <select name="waste_number_${rowCount}" class="waste-select" onchange="handleWasteChange(${rowCount}, this)" required>
                <option value="">Tipo...</option>
                ${options}
            </select>
        </td>
        <td id="detail-cell-${rowCount}">
            <input type="text" disabled>
        </td>
        <td>
            <select name="unit_${rowCount}" required>
                <option value="m³">m³</option>
                <option value="t">t</option>
                <option value="l">l</option>
            </select>
        </td>
        <td>
            <input type="number" name="quantity_${rowCount}" step="0.001" min="0.001" max="45000" required>
        </td>
        <td>
            <input type="text" name="observations_${rowCount}">
        </td>
        <td style="text-align: center;">
            <input type="checkbox" name="temp_storage_${rowCount}" value="1">
        </td>
        <td>
            <input type="text" name="mtr_${rowCount}" class="mtr-input" maxlength="12" pattern="\\d{12}" placeholder="12 dígitos">
        </td>
        <td class="col-action">
            <button type="button" class="btn-remove-row" onclick="removeRow(${rowCount})">X</button>
        </td>
    `;
    
    tbody.appendChild(tr);
    
    // Verifica estado atual do MTR (Terra/Mar)
    const mode = document.querySelector('input[name="retrieval_mode"]:checked').value;
    toggleMTR(mode);
}

function removeRow(id) {
    document.getElementById(`row-${id}`).remove();
    rowCount--;
}

// Lida com mudanças no tipo de resíduo (9 ou 13)
function handleWasteChange(rowId, select) {
    const detailCell = document.getElementById(`detail-cell-${rowId}`);
    const selectedOption = select.options[select.selectedIndex];
    const hasSub = selectedOption.getAttribute('data-has-sub') === 'true';
    const hasText = selectedOption.getAttribute('data-has-text') === 'true';

    if (hasSub) {
        // Cria Select de Subcategorias
        let subs = subCategories.map(s => `<option value="${s}">${s}</option>`).join('');
        detailCell.innerHTML = `<select name="category_${rowId}" required>${subs}</select>`;
    } else if (hasText) {
        // Cria Input de Texto Livre
        detailCell.innerHTML = `<input type="text" name="category_${rowId}" placeholder="Especifique..." required>`;
    } else {
        // Desabilita
        detailCell.innerHTML = `<input type="text" disabled>`;
    }
}

// Habilita/Desabilita MTR com base em Terra/Mar
function toggleMTR(mode) {
    const inputs = document.querySelectorAll('.mtr-input');
    inputs.forEach(input => {
        if (mode === 'MAR') {
            input.disabled = true;
            input.value = '';
            input.style.backgroundColor = '#eee';
            input.required = false;
        } else {
            input.disabled = false;
            input.style.backgroundColor = 'white';
            input.required = true;
        }
    });
}

// Envio do Formulário
document.getElementById('crre-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgArea = document.getElementById('message-area-crre');
    
    if (rowCount === 0) {
        alert("Adicione pelo menos um resíduo.");
        return;
    }

    // Monta o objeto de dados complexo
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Processa os resíduos em um array
    const residues = [];
    document.querySelectorAll('#waste-rows tr').forEach(row => {
        // Pega o ID numérico da linha (row-1 -> 1)
        const id = row.id.split('-')[1]; 
        
        // Pega os valores usando o ID
        const waste_number = formData.get(`waste_number_${id}`);
        if (waste_number) {
            residues.push({
                waste_number: waste_number,
                unit: formData.get(`unit_${id}`),
                quantity: formData.get(`quantity_${id}`),
                observations: formData.get(`observations_${id}`),
                category: formData.get(`category_${id}`), // Pode ser a subcategoria ou o texto "Outros"
                mtr_number: formData.get(`mtr_${id}`),
                temporary_storage: formData.get(`temp_storage_${id}`) ? true : false
            });
        }
    });

    // Adiciona o array de resíduos ao payload
    const payload = { ...data, residues };

    try {
        const response = await fetch('/crre/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        msgArea.textContent = result.message || result.error;
        msgArea.className = 'message-area ' + (response.ok ? 'success' : 'error') + ' show';
        
        if (response.ok) {
            setTimeout(() => window.location.href = '/dashboard', 2000);
        }
    } catch (err) {
        alert('Erro ao enviar.');
    }
});

// Inicializa com uma linha
addWasteRow();