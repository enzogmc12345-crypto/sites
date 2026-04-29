const firebaseConfig = {
  apiKey: "AIzaSyCrccRSc85Ek3EpJbbKgS9xx-OuN53Shx4",
  authDomain: "trama-daily.firebaseapp.com",
  projectId: "trama-daily",
  storageBucket: "trama-daily.firebasestorage.app",
  messagingSenderId: "930267007408",
  appId: "1:930267007408:web:62183a6cf4e3a1c08a2e75",
  measurementId: "G-KV0D7BQ12E"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Initialization
const defaultClients = ["Apabex", "Bluey", "Cenpec", "FGVW", "Linear", "Meu Cash Card", "OBA", "Seagems", "Sodexo"];
const defaultDesigners = ["Enzo", "Esther", "Jorge Bin", "Maria Teresa", "Rubens"];
const defaultAgents = ["Carol", "Isa", "Tereza Xavier", "Vanessa"];
const defaultTypes = ["Apresentação Institucional", "Banner", "Carrosséis", "GIF", "Marca página", "Post estático", "Vídeos"];

// State Management
let tasks = [];
let customClients = [];
let customDesigners = [];
let customAgents = [];
let customTypes = [];
let teamMembers = [];

let baseClientsList = [];
let baseDesignersList = [];
let baseAgentsList = [];
let baseTypesList = [];

let editingRowId = null;

// Initial charts state
let clientChartInstance = null;
let designerChartInstance = null;
let progressChartInstance = null;

const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const taskTableBody = document.getElementById('taskTableBody');
const filterStatus = document.getElementById('filterStatus');
const filterClient = document.getElementById('filterClient');
const filterDesigner = document.getElementById('filterDesigner');
const filterAgent = document.getElementById('filterAgent');
const filterPriority = document.getElementById('filterPriority');
const filterTeamRole = document.getElementById('filterTeamRole');
const teamModal = document.getElementById('teamModal');

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupNavigation();
    
    // Subscribe Config
    db.collection('config').doc('trama').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            customClients = data.customClients || [...defaultClients];
            customDesigners = data.customDesigners || [...defaultDesigners];
            customAgents = data.customAgents || [...defaultAgents];
            customTypes = data.customTypes || [...defaultTypes];
            teamMembers = data.teamMembers || [];
            populateFilters();
            populateDropdowns();
            renderTable();
        } else {
            // First time setup
            customClients = [...defaultClients];
            customDesigners = [...defaultDesigners];
            customAgents = [...defaultAgents];
            customTypes = [...defaultTypes];
            saveConfigToFirebase();
        }
    });

    // Subscribe Tasks
    db.collection('tasks').onSnapshot((snapshot) => {
        tasks = snapshot.docs.map(doc => doc.data());
        tasks.sort((a,b) => b.id.localeCompare(a.id));
        renderAll();
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');
            if(!tab) return;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            document.querySelectorAll('.view-section').forEach(view => {
                view.classList.remove('active');
            });
            
            const targetView = document.getElementById(`${tab}-view`);
            if(targetView) {
                targetView.classList.add('active');
            }
        });
    });
}

function renderAll() {
    updateDashboardStats();
    updateCharts();
    populateFilters();
    populateDropdowns();
    renderTable();
    renderTeamPreview();
    renderTeamTable();
    renderClientsView();
    
    // Check session storage
    const storedClientName = sessionStorage.getItem('currentClientTimeline');
    const storedClientTask = sessionStorage.getItem('currentClientTask');
    
    if (storedClientName && document.getElementById('clientTimelineArea').style.display !== 'block') {
        const navItem = document.querySelector('.nav-item[data-tab="clients"]');
        if (navItem) navItem.click();
        setTimeout(() => {
            openClientSpace(storedClientName);
            if (storedClientTask) {
                const t = tasks.find(x => x.id === storedClientTask);
                if (t) {
                    const select = document.getElementById('clientTaskSelect');
                    if (select) select.value = storedClientTask;
                    renderClientTimeline(storedClientTask);
                }
            }
        }, 100);
    }
}

function getClients() { return [...new Set([...baseClientsList, ...customClients, ...tasks.map(t=>t.client)])].filter(Boolean).sort(); }
function getDesigners() { return [...new Set([...baseDesignersList, ...customDesigners, ...teamMembers.filter(m=>m.role==='Designer').map(m=>m.name), ...tasks.map(t=>t.designer)])].filter(Boolean).sort(); }
function getAgents() { return [...new Set([...baseAgentsList, ...customAgents, ...teamMembers.filter(m=>m.role==='Atendimento').map(m=>m.name), ...tasks.map(t=>t.agent)])].filter(Boolean).sort(); }
function getTypes() { return [...new Set([...baseTypesList, ...customTypes, ...tasks.map(t=>t.type)])].filter(Boolean).sort(); }

// Stats & Dashboard
function updateDashboardStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'CONCLUÍDO').length;
    const pending = tasks.filter(t => t.status === 'SEM DEFINIÇÃO DO CLIENTE' || t.status === 'AGUARDANDO APROVAÇÃO' || t.status === 'A FAZER').length;
    const running = tasks.filter(t => t.status === 'EM ANDAMENTO').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-running').innerText = running;
}

// Chart.js Integrations
function updateCharts() {
    const ctxClient = document.getElementById('clientChart').getContext('2d');
    const ctxDesigner = document.getElementById('designerChart').getContext('2d');
    const ctxProgress = document.getElementById('progressChart').getContext('2d');

    const clients = {}; const designers = {};
    tasks.forEach(t => {
        const client = t.client || 'Sem Cliente';
        const designer = t.designer || 'Não Atribuído';
        clients[client] = (clients[client] || 0) + 1;
        designers[designer] = (designers[designer] || 0) + 1;
    });

    const completed = tasks.filter(t => t.status === 'CONCLUÍDO').length;
    const running = tasks.filter(t => t.status === 'EM ANDAMENTO').length;
    const pending = tasks.filter(t => t.status !== 'CONCLUÍDO' && t.status !== 'EM ANDAMENTO').length;

    if(clientChartInstance) clientChartInstance.destroy();
    clientChartInstance = new Chart(ctxClient, {
        type: 'bar',
        data: {
            labels: Object.keys(clients),
            datasets: [{ label: 'Demandas', data: Object.values(clients), backgroundColor: '#0b5c47', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });

    if(designerChartInstance) designerChartInstance.destroy();
    designerChartInstance = new Chart(ctxDesigner, {
        type: 'bar',
        data: {
            labels: Object.keys(designers),
            datasets: [{ label: 'Demandas por Pessoa', data: Object.values(designers), backgroundColor: '#22c55e', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });

    if(progressChartInstance) progressChartInstance.destroy();
    progressChartInstance = new Chart(ctxProgress, {
        type: 'doughnut',
        data: {
            labels: ['Concluído', 'Em Andamento', 'Pendente'],
            datasets: [{ data: [completed, running, pending], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0, cutout: '75%' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderTeamPreview() {
    const previewList = document.getElementById('team-preview-list');
    const activeMembers = {};
    tasks.forEach(t => {
        if(t.designer && t.status === 'EM ANDAMENTO') activeMembers[t.designer] = true;
        if(t.agent && t.status === 'EM ANDAMENTO') activeMembers[t.agent] = true;
    });

    const membersHTML = Object.keys(activeMembers).slice(0, 4).map(name => `
        <div class="team-member">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random" alt="${name}">
            <div class="member-info">
                <h4>${name}</h4>
                <p>Trabalhando nas demandas...</p>
            </div>
            <span class="status-badge status-running">Ativo</span>
        </div>
    `).join('');
    previewList.innerHTML = membersHTML || '<p style="color:#6b7280; font-size: 13px;">Nenhum membro ativo em tarefas no momento.</p>';
}

// Table & Data Operations
function populateDropdowns() {
    populateSelect('taskClient', getClients());
    populateSelect('taskDesigner', getDesigners());
    populateSelect('taskAgent', getAgents());
    populateSelect('taskType', getTypes());
}

function populateSelect(selectId, itemsList, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentVal = select.value || selectedValue;
    select.innerHTML = '<option value="" disabled selected>Selecione...</option>' + 
                       itemsList.map(item => `<option value="${item}">${item}</option>`).join('') + 
                       `<option value="ADD_NEW">+ Adicionar Novo...</option>`;
    if(currentVal && itemsList.includes(currentVal)) select.value = currentVal;
    else select.selectedIndex = 0;
}

function handleSelectChange(selectElement, typeStr) {
    if(selectElement.value === 'ADD_NEW') {
        const newValue = prompt(`Digite o novo valor para ${typeStr}:`);
        if(newValue && newValue.trim()) {
            const v = newValue.trim();
            if(typeStr === 'Cliente') customClients.push(v);
            if(typeStr === 'Designer') customDesigners.push(v);
            if(typeStr === 'Atendimento') customAgents.push(v);
            if(typeStr === 'Peça') customTypes.push(v);
            
            saveData();
            
            // Insert physically in the specific dropdown to avoid full re-render breaking other inputs
            const newOption = document.createElement('option');
            newOption.value = v;
            newOption.text = v;
            selectElement.insertBefore(newOption, selectElement.lastElementChild);
            selectElement.value = v;
            
            populateFilters(); 
            populateDropdowns();
        } else {
            selectElement.selectedIndex = 0; // reset
        }
    }
}

let currentAddType = '';

function promptAddNew(typeStr) {
    currentAddType = typeStr;
    document.getElementById('addModalTitle').innerText = `Adicionar ${typeStr}`;
    document.getElementById('newItemName').value = '';
    document.getElementById('addModal').classList.add('active');
    setTimeout(() => document.getElementById('newItemName').focus(), 100);
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
}

function saveNewItem(e) {
    e.preventDefault();
    const val = document.getElementById('newItemName').value.trim();
    if(!val) return;
    
    let targetArr = null;
    let selectEl = null;

    if(currentAddType === 'Cliente') { targetArr = customClients; selectEl = filterClient; }
    else if(currentAddType === 'Designer') { targetArr = customDesigners; selectEl = filterDesigner; }
    else if(currentAddType === 'Atendimento') { targetArr = customAgents; selectEl = filterAgent; }
    else if(currentAddType === 'Peça') { targetArr = customTypes; }
    
    if(targetArr && !targetArr.includes(val)) {
        targetArr.push(val);
        targetArr.sort();
        saveData();
        populateFilters();
        
        if(selectEl) selectEl.value = val;
        
        renderTable();
        populateDropdowns();
        showToast(`${currentAddType} adicionado com sucesso!`);
    } else {
        showToast(`Este ${currentAddType} já existe!`);
    }
    closeAddModal();
}

let currentManageType = '';

function promptRemove(typeStr) {
    currentManageType = typeStr;
    document.getElementById('manageModalTitle').innerText = `Remover ${typeStr}`;
    renderManageList();
    document.getElementById('manageModal').classList.add('active');
}

function closeManageModal() {
    document.getElementById('manageModal').classList.remove('active');
}

function renderManageList() {
    const container = document.getElementById('manageListContainer');
    let customArr = [];
    let baseArr = [];

    if(currentManageType === 'Cliente') { customArr = customClients; baseArr = baseClientsList; }
    else if(currentManageType === 'Designer') { customArr = customDesigners; baseArr = baseDesignersList; }
    else if(currentManageType === 'Atendimento') { customArr = customAgents; baseArr = baseAgentsList; }
    else if(currentManageType === 'Peça') { customArr = customTypes; baseArr = baseTypesList; }

    const allItems = [...new Set([...baseArr, ...customArr])].sort();

    if(allItems.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Nenhum item encontrado.</p>';
        return;
    }

    container.innerHTML = allItems.map(item => `
        <div class="manage-item">
            <span>${item}</span>
            <button onclick="removeItem('${item}')" title="Excluir"><i class='bx bx-x'></i></button>
        </div>
    `).join('');
}

function removeItem(itemValue) {
    let removed = false;
    if(currentManageType === 'Cliente') {
        let idx1 = customClients.indexOf(itemValue); if(idx1 > -1) { customClients.splice(idx1, 1); removed = true; }
        let idx2 = baseClientsList.indexOf(itemValue); if(idx2 > -1) { baseClientsList.splice(idx2, 1); removed = true; }
    } else if(currentManageType === 'Designer') {
        let idx1 = customDesigners.indexOf(itemValue); if(idx1 > -1) { customDesigners.splice(idx1, 1); removed = true; }
        let idx2 = baseDesignersList.indexOf(itemValue); if(idx2 > -1) { baseDesignersList.splice(idx2, 1); removed = true; }
    } else if(currentManageType === 'Atendimento') {
        let idx1 = customAgents.indexOf(itemValue); if(idx1 > -1) { customAgents.splice(idx1, 1); removed = true; }
        let idx2 = baseAgentsList.indexOf(itemValue); if(idx2 > -1) { baseAgentsList.splice(idx2, 1); removed = true; }
    } else if(currentManageType === 'Peça') {
        let idx1 = customTypes.indexOf(itemValue); if(idx1 > -1) { customTypes.splice(idx1, 1); removed = true; }
        let idx2 = baseTypesList.indexOf(itemValue); if(idx2 > -1) { baseTypesList.splice(idx2, 1); removed = true; }
    }

    if(removed) {
        saveData();
        populateFilters();
        renderTable();
        populateDropdowns();
        renderManageList();
    }
}

function populateFilters() {
    const buildDatalist = (list) => list.map(c => `<option value="${c}">`).join('');
    
    if(document.getElementById('clientsList')) document.getElementById('clientsList').innerHTML = buildDatalist(getClients());
    if(document.getElementById('designersList')) document.getElementById('designersList').innerHTML = buildDatalist(getDesigners());
    if(document.getElementById('agentsList')) document.getElementById('agentsList').innerHTML = buildDatalist(getAgents());
}

function renderTable() {
    const tbody = document.getElementById('taskTableBody');
    if(!tbody) return;

    const statusFilter = document.getElementById('filterStatus').value.trim();
    const clientFilter = document.getElementById('filterClient').value.trim();
    const designerFilter = document.getElementById('filterDesigner').value.trim();
    const agentFilter = document.getElementById('filterAgent').value.trim();
    const priorityFilter = document.getElementById('filterPriority').value.trim();

    let filtered = tasks.filter(t => {
        let matchStatus = (!statusFilter || statusFilter.toLowerCase() === 'todos os status' || statusFilter.toLowerCase() === 'all') ? true : t.status.toLowerCase().includes(statusFilter.toLowerCase());
        let matchClient = (!clientFilter || clientFilter === 'todos os clientes' || clientFilter === 'all') ? true : t.client.toLowerCase().includes(clientFilter.toLowerCase());
        let matchDesigner = (!designerFilter || designerFilter === 'todos os designers' || designerFilter === 'all') ? true : t.designer.toLowerCase().includes(designerFilter.toLowerCase());
        let matchAgent = (!agentFilter || agentFilter === 'todo atendimento' || agentFilter === 'all') ? true : t.agent.toLowerCase().includes(agentFilter.toLowerCase());
        let matchPri = (!priorityFilter || priorityFilter.toLowerCase() === 'todas as prioridades' || priorityFilter.toLowerCase() === 'all') ? true : t.priority.toLowerCase().includes(priorityFilter.toLowerCase());
        
        return matchStatus && matchClient && matchDesigner && matchAgent && matchPri;
    });

    taskTableBody.innerHTML = filtered.map(t => {
        if(editingRowId === t.id) {
            const buildOptions = (list, selected) => list.map(x => `<option value="${x}" ${selected===x?'selected':''}>${x}</option>`).join('') + `<option value="ADD_NEW">+ Adicionar Novo...</option>`;
            
            return `
                <tr class="editing-row">
                    <td style="color:#6b7280; font-size:12px;">#${t.id.substring(0,4)}</td>
                    <td><select id="edit-client-${t.id}" class="inline-input" onchange="handleSelectChange(this, 'Cliente')">${buildOptions(getClients(), t.client)}</select></td>
                    <td>
                        <select id="edit-type-${t.id}" class="inline-input" onchange="handleSelectChange(this, 'Peça')">${buildOptions(getTypes(), t.type)}</select>
                        <input type="text" id="edit-campaign-${t.id}" value="${t.campaign||''}" class="inline-input" placeholder="Campanha" style="margin-top:4px;" />
                    </td>
                    <td>
                        <select id="edit-creation-${t.id}" class="inline-input" style="margin-bottom:4px">
                            <option value="SIM" ${t.creation==='SIM'?'selected':''}>SIM</option>
                            <option value="NÃO" ${t.creation==='NÃO'?'selected':''}>NÃO</option>
                        </select>
                        <select id="edit-designer-${t.id}" class="inline-input" onchange="handleSelectChange(this, 'Designer')">${buildOptions(getDesigners(), t.designer)}</select>
                    </td>
                    <td><select id="edit-agent-${t.id}" class="inline-input" onchange="handleSelectChange(this, 'Atendimento')">${buildOptions(getAgents(), t.agent)}</select></td>
                    <td><input type="date" id="edit-deadline-${t.id}" value="${t.deadline||''}" class="inline-input" /></td>
                    <td>
                        <select id="edit-priority-${t.id}" class="inline-input">
                            <option value="Normal" ${t.priority==='Normal'?'selected':''}>Normal</option>
                            <option value="Alta" ${t.priority==='Alta'?'selected':''}>Alta</option>
                            <option value="Baixa" ${t.priority==='Baixa'?'selected':''}>Baixa</option>
                            <option value="Urgente" ${t.priority==='Urgente'?'selected':''}>Urgente</option>
                        </select>
                    </td>
                    <td>
                        <select id="edit-status-${t.id}" class="inline-input">
                            <option value="A FAZER" ${t.status==='A FAZER'?'selected':''}>A FAZER</option>
                            <option value="EM ANDAMENTO" ${t.status==='EM ANDAMENTO'?'selected':''}>EM ANDAMENTO</option>
                            <option value="AGUARDANDO APROVAÇÃO" ${t.status==='AGUARDANDO APROVAÇÃO'?'selected':''}>AGUARDANDO APROVAÇÃO</option>
                            <option value="CONCLUÍDO" ${t.status==='CONCLUÍDO'?'selected':''}>CONCLUÍDO</option>
                            <option value="SEM DEFINIÇÃO DO CLIENTE" ${t.status==='SEM DEFINIÇÃO DO CLIENTE'?'selected':''}>SEM DEFINIÇÃO DO CLIENTE</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn-action save-inline" onclick="saveInlineEdit('${t.id}')"><i class='bx bx-check'></i></button>
                        <button class="btn-action cancel-inline" onclick="cancelInlineEdit()"><i class='bx bx-x'></i></button>
                    </td>
                </tr>
            `;
        }

        const badgeClass = getStatusBadgeClass(t.status);
        const priClass = `pri-${t.priority || 'Normal'}`;
        
        return `
            <tr>
                <td style="color:#6b7280; font-size:12px;">#${t.id.substring(0,4)}</td>
                <td style="font-weight:600;">${t.client}</td>
                <td>
                    ${t.type} <br/>
                    <small style="color:#6b7280">${t.campaign || ''}</small>
                </td>
                <td>${t.creation} <br/><small style="color:var(--primary)">${t.designer || '-'}</small></td>
                <td>${t.agent || '-'}</td>
                <td>${t.deadline ? new Date(t.deadline).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                <td><span class="priority-tag ${priClass}">${t.priority || 'Normal'}</span></td>
                <td><span class="status-badge ${badgeClass}">${t.status}</span></td>
                <td>
                    <button class="btn-action" onclick="makeRowEditable('${t.id}')"><i class='bx bx-edit-alt'></i></button>
                    <button class="btn-action" onclick="deleteTask('${t.id}')"><i class='bx bx-trash' style="color: #ef4444;"></i></button>
                </td>
            </tr>
        `
    }).join('');
}

function getStatusBadgeClass(status) {
    if(status === 'CONCLUÍDO') return 'status-completed';
    if(status === 'EM ANDAMENTO') return 'status-running';
    if(status === 'A FAZER') return 'status-neutral';
    return 'status-pending'; 
}

// Modal Functions
function openTaskModal() {
    editingRowId = null;
    taskForm.reset();
    populateDropdowns(); // Populate the newest available values on open
    document.getElementById('modalTitle').innerText = 'Nova Demanda';
    taskModal.classList.add('active');
}

function closeTaskModal() {
    taskModal.classList.remove('active');
}

function saveTask(e) {
    e.preventDefault();
    const clientVal = document.getElementById('taskClient').value;
    const typeVal = document.getElementById('taskType').value;
    if(!clientVal || clientVal === "ADD_NEW" || clientVal === "") return showToast('Selecione um cliente válido.');
    if(!typeVal || typeVal === "ADD_NEW" || typeVal === "") return showToast('Selecione um tipo de entrega/peça.');

    const newTask = {
        id: Date.now().toString(36),
        client: clientVal,
        agent: document.getElementById('taskAgent').value || '',
        type: typeVal,
        campaign: document.getElementById('taskCampaign').value,
        creation: document.getElementById('taskCreation').value,
        designer: document.getElementById('taskDesigner').value || '',
        deadline: document.getElementById('taskDeadline').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        adjustments: document.getElementById('taskAdjustments').value,
        updatedAt: new Date().toISOString()
    };

    db.collection('tasks').doc(newTask.id).set(newTask);
    showToast('Demanda criada com sucesso!');
    closeTaskModal();
}

function saveStepDetails() {
    const resp = document.getElementById('modalResponsavel').value;
    
    // Update the visual name on the timeline if it's an adjustment
    const nameEl = document.getElementById('assignee-' + currentStepEditing);
    if(nameEl && resp) {
        nameEl.innerText = resp;
        showToast('Responsável alterado para: ' + resp);
    } else {
        showToast('Detalhes salvos para a etapa: ' + currentStepEditing);
    }
    
    closeStepDetailsModal();
}

function makeRowEditable(id) {
    editingRowId = id;
    renderTable();
}

function cancelInlineEdit() {
    editingRowId = null;
    renderTable();
}

function saveInlineEdit(id) {
    const tIndex = tasks.findIndex(t => t.id === id);
    if(tIndex === -1) return;
    
    tasks[tIndex] = {
        ...tasks[tIndex],
        client: document.getElementById(`edit-client-${id}`).value,
        type: document.getElementById(`edit-type-${id}`).value,
        campaign: document.getElementById(`edit-campaign-${id}`).value,
        creation: document.getElementById(`edit-creation-${id}`).value,
        designer: document.getElementById(`edit-designer-${id}`).value,
        agent: document.getElementById(`edit-agent-${id}`).value,
        deadline: document.getElementById(`edit-deadline-${id}`).value,
        priority: document.getElementById(`edit-priority-${id}`).value,
        status: document.getElementById(`edit-status-${id}`).value,
        updatedAt: new Date().toISOString()
    };
    
    db.collection('tasks').doc(id).set(tasks[tIndex]);
    editingRowId = null;
    showToast('Demanda atualizada!');
}

function deleteTask(id) {
    if(confirm('Tem certeza que deseja remover esta demanda?')) {
        db.collection('tasks').doc(id).delete();
        showToast('Demanda removida!');
    }
}

function clearAllTasks() {
    if(tasks.length === 0) return showToast('Nenhuma demanda para remover.');
    if(confirm('Tem certeza em DELETAR TODAS as demandas permanentemente?')) {
        const batch = db.batch();
        tasks.forEach(t => batch.delete(db.collection('tasks').doc(t.id)));
        batch.commit().then(() => {
            showToast('Todas as demandas foram removidas!');
        });
    }
}

function showCompletedTasks() {
    document.getElementById('filterStatus').value = 'Concluído';
    renderTable();
    showToast('Exibindo apenas demandas concluídas');
}

function saveData() {
    saveConfigToFirebase();
}

function saveConfigToFirebase() {
    db.collection('config').doc('trama').set({
        customClients,
        customDesigners,
        customAgents,
        customTypes,
        teamMembers
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export using ExcelJS
async function exportToExcel() {
    if (tasks.length === 0) {
        showToast('Sem dados para exportar!');
        return;
    }

    const now = new Date();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daily");

    // Configurar larguras das colunas para bater com a original
    worksheet.columns = [
        { width: 18 }, // CLIENTE
        { width: 45 }, // ASSUNTO
        { width: 15 }, // RESPONSÁVEL
        { width: 15 }, // PRIORIDADE
        { width: 18 }, // REDAÇÃO/CRIAÇÃO
        { width: 20 }, // TIPO DE ENTREGA
        { width: 22 }, // ETAPA
        { width: 18 }, // ENTREGA (ETAPA)
        { width: 50 }  // LINK
    ];

    const headers = ["CLIENTE", "ASSUNTO", "RESPONSÁVEL", "PRIORIDADE", "REDAÇÃO/CRIAÇÃO", "TIPO DE ENTREGA", "ETAPA", "ENTREGA (ETAPA)", "LINK"];

    // Mapeamento de cores de clientes
    const clientColors = {
        'AMANCO': 'FFD9D9D9',
        'APABEX': 'FFF6B26B',
        'BLUEY': 'FF9FC5E8',
        'CENPEC': 'FFF3F3F3',
        'FUNDAÇÃO': 'FFB6D7A8',
        'SEAGEMS': 'FF76A5AF',
        'SODEXO': 'FFEA9999',
        'INTERSYSTEMS': 'FFA2C4C9',
        'LINEAR': 'FFFFFFFF',
        'MEU CASH CARD': 'FFFFFFFF'
    };

    function formatDateToShortMonth(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
        return `${d.getUTCDate()}/${months[d.getUTCMonth()]}`;
    }

    const thinBorder = {
        top: {style:'thin', color: {argb:'FF000000'}},
        left: {style:'thin', color: {argb:'FF000000'}},
        bottom: {style:'thin', color: {argb:'FF000000'}},
        right: {style:'thin', color: {argb:'FF000000'}}
    };

    function addSection(title, titleBgColor, taskList, isFirst) {
        // Title Row
        const titleRow = worksheet.addRow([title]);
        worksheet.mergeCells(`A${titleRow.number}:I${titleRow.number}`);
        const titleCell = titleRow.getCell(1);
        titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14, name: 'Arial' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleBgColor } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.border = thinBorder;
        
        // Headers
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FF000000' }, size: 10, name: 'Arial' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });

        // Habilitar filtro apenas no primeiro cabeçalho
        if (isFirst) {
            worksheet.autoFilter = `A${headerRow.number}:I${headerRow.number + taskList.length}`;
        }

        // Rows
        taskList.forEach(t => {
            let pVal = (t.priority || 'Normal').toUpperCase();
            if (pVal === 'NORMAL') pVal = 'PADRÃO';
            
            const rowData = [
                t.client,
                t.campaign || t.type,
                t.agent || '',
                pVal,
                t.designer || '',
                t.type,
                t.status,
                formatDateToShortMonth(t.deadline),
                '' // Link placeholder
            ];
            const row = worksheet.addRow(rowData);
            
            row.eachCell((c, colNumber) => {
                c.alignment = { vertical: 'middle', horizontal: 'center' };
                if(colNumber === 2 || colNumber === 9) { // Assunto e Link alinhados a esquerda
                    c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                }
                c.border = thinBorder;
                c.font = { size: 10, name: 'Arial' };
            });

            // Colorir a coluna do CLIENTE
            const clientCell = row.getCell(1);
            const cColor = clientColors[t.client?.toUpperCase()] || 'FFFFFFFF';
            clientCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cColor } };

            // Colorir a PRIORIDADE
            const priCell = row.getCell(4);
            priCell.font = { bold: true, color: { argb: 'FF000000' }, size: 10, name: 'Arial' };
            if (pVal === 'ALTA' || pVal === 'URGENTE') {
                priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
            } else if (pVal === 'PADRÃO') {
                priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
            } else if (pVal === 'BAIXA') {
                priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            }

            // Colorir a ETAPA (Status)
            const statusCell = row.getCell(7);
            statusCell.font = { bold: true, color: { argb: 'FF000000' }, size: 10, name: 'Arial' };
            if (t.status === 'CONCLUÍDO') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
            } else if (t.status === 'EM ANDAMENTO') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9900' } }; // Laranja
            } else if (t.status === 'A FAZER') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } }; // Amarelo
            } else if (t.status === 'AGUARDANDO APROVAÇÃO') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4DD0E1' } }; // Azul claro
            } else {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; // Cinza
            }
        });
    }

    const activeTasks = tasks.filter(t => t.status === 'A FAZER' || t.status === 'EM ANDAMENTO');
    const mappedTasks = tasks.filter(t => t.status !== 'A FAZER' && t.status !== 'EM ANDAMENTO');

    addSection('QUADRO DE TAREFAS DO DIA', 'FF000000', activeTasks, true); 
    
    // Blank row spacer with borders removed
    const spacerRow = worksheet.addRow([]); 
    
    addSection('QUADRO DE TAREFAS MAPEADAS', 'FF4A86E8', mappedTasks, false);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `Daily_Trama_${now.getTime()}.xlsx`);
    
    showToast('Planilha exportada com sucesso!');
}

function openTeamModal() { teamModal.classList.add('active'); }
function closeTeamModal() { teamModal.classList.remove('active'); }
function saveTeamMember(e) {
    e.preventDefault();
    const newMember = {
        id: Date.now().toString(36),
        name: document.getElementById('teamMemberName').value,
        role: document.getElementById('teamMemberRole').value
    };
    teamMembers.push(newMember);
    saveConfigToFirebase();
    closeTeamModal();
    showToast('Membro adicionado à equipe!');
}
function renderTeamTable() {
    const teamGridBody = document.getElementById('teamGridBody');
    if(!teamGridBody) return;
    const roleF = filterTeamRole ? filterTeamRole.value : 'ALL';
    const filteredM = teamMembers.filter(m => roleF === 'ALL' || m.role === roleF);
    teamGridBody.innerHTML = filteredM.map(m => `
        <div class="team-card">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random" alt="${m.name}">
            <div class="team-card-info">
                <h4>${m.name}</h4><p>${m.role}</p>
            </div>
            <button class="btn-icon" onclick="removeTeamMember('${m.id}')" style="margin-left: auto; color: #ef4444;"><i class='bx bx-trash'></i></button>
        </div>`).join('');
}
function removeTeamMember(id) {
    if(confirm('Remover este membro?')) {
        teamMembers = teamMembers.filter(m => m.id !== id);
        saveData();
        renderAll();
    }
}

function loadSampleData() {
    const importedTasks = [
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "AMANCO", agent: "Linda", type: "REEL", 
            campaign: "Incêndio não avisa.  O sistema precisa estar pronto.", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "AMANCO", agent: "Linda", type: "CARROSSEL", 
            campaign: "Água fria", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "AMANCO", agent: "Linda", type: "CARD", 
            campaign: "Dia do Trabalhador e da Trabalhadora", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARROSSEL", 
            campaign: "Conteúdo Abril Azul", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARROSSEL", 
            campaign: "Dia da educação", creation: "SIM", designer: "Carol", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "EMAIL MKT", 
            campaign: "Email MKt - Emprego Apoiado - Dia da educação", creation: "SIM", designer: "Carol", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "ECOBAG/SACOLA", 
            campaign: "Sacolas para influenciadores", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Alta", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "CARROSSEL", 
            campaign: "Brincadeiras sem tela", creation: "SIM", designer: "Deisy/Dani", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "CARDS", 
            campaign: "Expectativa vs realidade", creation: "SIM", designer: "Deisy/Dani", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "CARROSSEL", 
            campaign: "Cenas Clássicas", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "Sleepytime orquestra", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "O poder do tédio", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "REEL", 
            campaign: "Racismo e discriminação racial", creation: "SIM", designer: "Tereza", deadline: "2026-04-24",
            priority: "Alta", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "NOTA SITE", 
            campaign: "Nota do site - Edital Juntos pela mobilidade social", creation: "SIM", designer: "Vanessa", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARROSSEL", 
            campaign: "Carrossel - Edital Juntos pela mobilidade Social", creation: "SIM", designer: "Vanessa", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "Reel Geral - Projeto Autonomia", creation: "SIM", designer: "Vanessa", deadline: "",
            priority: "Normal", status: "A FAZER", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "EMAIL MKT", 
            campaign: "Email mkt - tração", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARDS", 
            campaign: "Card Whatsapp - tração", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "STORIES", 
            campaign: "Stories Edital Tração - Levando nota do site", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "BANNER", 
            campaign: "Banner para site - Edital Tração", creation: "SIM", designer: "Estéfano", deadline: "",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "REEL", 
            campaign: "Workshop de Segurança e operações", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "REEL", 
            campaign: "Abril Verde - Mês da Segurança - POST 3", creation: "SIM", designer: "Estéfano", deadline: "2026-04-27",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Lori", type: "CERTIFICADOS", 
            campaign: "Certificados Media Training", creation: "SIM", designer: "Giovana", deadline: "2026-04-30",
            priority: "Baixa", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARD", 
            campaign: "Post para bloig", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "MEU CASH CARD", agent: "Isa", type: "REEL", 
            campaign: "reel - meu cash card", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Alta", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "CARROSSEL + STORIES", 
            campaign: "Insights sobre mercado de trabalho e RH", creation: "SIM", designer: "Tereza", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "REEL", 
            campaign: "Legenda de vídeo 2", creation: "SIM", designer: "Enzo", deadline: "2026-04-13",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "5 POSTS", 
            campaign: "Posts Emprego Apoiado - Adaptação", creation: "SIM", designer: "Carol", deadline: "2026-04-15",
            priority: "Alta", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "Gnomos de jardim", creation: "SIM", designer: "Enzo", deadline: "2026-04-13",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "Gnomos Ella Bakes", creation: "SIM", designer: "Estéfano", deadline: "2026-04-10",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "STORY", 
            campaign: "O silêncio também é violência", creation: "SIM", designer: "Tereza", deadline: "2026-04-13",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Registros de páscoa - navios e escritórios", creation: "SIM", designer: "Deisy", deadline: "2026-04-22",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Workshop de segurança e operações", creation: "SIM", designer: "Deisy", deadline: "2026-04-22",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARD", 
            campaign: "Quem faz a Apabex?", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARROSSEL", 
            campaign: "NFP", creation: "SIM", designer: "Giovana", deadline: "2026-04-13",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "FLYER", 
            campaign: "NFP - Flyer", creation: "SIM", designer: "Giovana", deadline: "2026-04-20",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "BLOG", 
            campaign: "Blog Abril Azul", creation: "SIM", designer: "Carol", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "O que é o Transformando O Amanhã na voz de quem faz", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "Toda infância importa", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "TBT Março", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "DEFINIR", 
            campaign: "Dia da educação", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "REEL", 
            campaign: "Adolescência LGBTQIA+", creation: "SIM", designer: "Vanessa", deadline: "2026-04-14",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "O que é o TOA?", creation: "SIM", designer: "Vanessa", deadline: "2026-04-13",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "STORY", 
            campaign: "Nem toda infância tem a mesma chance", creation: "SIM", designer: "Vanessa", deadline: "2026-04-13",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "Reel do vídeocast Isabele", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "HEADER", 
            campaign: "(ajuste)  Header", creation: "SIM", designer: "Estéfano", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "Projeto Autonomia] Reel Geral - SBC", creation: "SIM", designer: "Vanessa", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "[Edital juntos pela mobilidade social] Reels OSCs 1 - Salvador", creation: "SIM", designer: "Estéfano", deadline: "2026-04-15",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARROSSEL", 
            campaign: "[Pesquisa IAÍ] Post Analítco - Card + Copy Insta e LK", creation: "SIM", designer: "Estéfano", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARD", 
            campaign: "Edital do tração", creation: "SIM", designer: "Vanessa", deadline: "2026-04-20",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "NOTA", 
            campaign: "Nota de site", creation: "SIM", designer: "Vanessa", deadline: "2026-04-20",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "REEL", 
            campaign: "Reducing the burden on healthcare workers, with AI", creation: "SIM", designer: "Enzo", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "CARDS", 
            campaign: "Estático Tereza", creation: "SIM", designer: "Estéfano", deadline: "2026-04-22",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "FLYER", 
            campaign: "Flyer digital", creation: "SIM", designer: "Giovana", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "PDF", 
            campaign: "Adaptação material (tradução)", creation: "SIM", designer: "Enzo", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARROSSEL", 
            campaign: "Carrrossel", creation: "SIM", designer: "Estéfano", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARROSSEL", 
            campaign: "Evento", creation: "SIM", designer: "Giovana", deadline: "2026-04-13",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARROSSEL", 
            campaign: "5 sinais", creation: "SIM", designer: "Enzo", deadline: "2026-04-10",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARDS", 
            campaign: "2 posts estáticos", creation: "SIM", designer: "Giovana", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "MEU CASH CARD", agent: "Isa", type: "REEL", 
            campaign: "Vídeo - evento", creation: "SIM", designer: "Enzo", deadline: "2026-04-15",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "EMAIL MKT", 
            campaign: "E-mail MKT - Save the date VIK", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "EMAIL MKT", 
            campaign: "E-mail MKT 3 - VIK", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "REEL", 
            campaign: "Mês da segurança - post 2", creation: "SIM", designer: "Estéfano", deadline: "2026-04-22",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Parceria Iara Systems", creation: "SIM", designer: "Estéfano", deadline: "2026-04-13",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Registros de Páscoa nos navios", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "EMAIL MKT", 
            campaign: "News 22", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "Safety Walk", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "Como é trabalhar na Sodexo", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "Comentários positivos", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Isa", type: "EMAIL MKT", 
            campaign: "5 emails", creation: "SIM", designer: "Tereza", deadline: "2026-04-14",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "CARROSSEL", 
            campaign: "Compilado de participações", creation: "SIM", designer: "Tereza", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "50 mil seguidores", creation: "SIM", designer: "Tereza", deadline: "2026-04-22",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "CARROSSEL", 
            campaign: "Symbol Awards - Lilian Rauld", creation: "SIM", designer: "Tereza", deadline: "2026-04-17",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        }
    ];
    const batch = db.batch();
    importedTasks.forEach(t => {
        const docRef = db.collection("tasks").doc(t.id);
        batch.set(docRef, t);
    });
    batch.commit().then(() => {
        showToast("Demandas da planilha importadas com sucesso!");
    }).catch(err => {
        console.error("Erro na importação:", err);
        showToast("Erro na importação");
    });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#taskTableBody tr');
    rows.forEach(row => { row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none'; });
});

// --- Clients View ---
let currentClientTimeline = null;

function renderClientsView() {
    const clientsGrid = document.getElementById('clientsGridBody');
    if (!clientsGrid) return;
    
    // Get unique clients that have tasks
    const clientTasksCount = {};
    tasks.forEach(t => {
        const c = t.client || 'Sem Cliente';
        clientTasksCount[c] = (clientTasksCount[c] || 0) + 1;
    });
    
    const uniqueClients = Object.keys(clientTasksCount).sort();
    
    clientsGrid.innerHTML = uniqueClients.map(client => `
        <div class="client-card">
            <div class="client-card-header">
                <div class="client-icon"><i class='bx bx-briefcase'></i></div>
                <div>
                    <h3>${client}</h3>
                    <span style="font-size:12px; color:var(--text-muted);">${clientTasksCount[client]} demanda(s)</span>
                </div>
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="openClientSpace('${client}')">Visualizar Espaço</button>
        </div>
    `).join('');
}

function openClientSpace(clientName) {
    currentClientTimeline = clientName;
    sessionStorage.setItem('currentClientTimeline', clientName);
    document.getElementById('clientsGridBody').style.display = 'none';
    const area = document.getElementById('clientTimelineArea');
    area.style.display = 'block';
    
    document.getElementById('timelineClientTitle').innerText = `Cliente: ${clientName}`;
    
    const select = document.getElementById('clientTaskSelect');
    const clientTasks = tasks.filter(t => (t.client || 'Sem Cliente') === clientName);
    
    select.innerHTML = '<option value="">Selecione uma tarefa...</option>' + 
        clientTasks.map(t => `<option value="${t.id}">${t.campaign || t.type}</option>`).join('');
        
    document.getElementById('timelineContainer').innerHTML = '<p style="text-align:center; padding: 40px; color:var(--text-muted);">Selecione uma tarefa acima para visualizar a linha do tempo.</p>';
}

function closeClientTimeline() {
    sessionStorage.removeItem('currentClientTask');
    sessionStorage.removeItem('currentClientTimeline');
    document.getElementById('clientTimelineArea').style.display = 'none';
    document.getElementById('clientsGridBody').style.display = 'grid';
    currentClientTimeline = null;
}

function renderClientTimeline(taskId) {
    sessionStorage.setItem('currentClientTask', taskId);
    if(currentClientTimeline) {
        sessionStorage.setItem('currentClientTimeline', currentClientTimeline);
    }
    const container = document.getElementById('timelineContainer');
    if (!taskId) {
        container.innerHTML = '<p style="text-align:center; padding: 40px; color:var(--text-muted);">Selecione uma tarefa acima para visualizar a linha do tempo.</p>';
        return;
    }
    
    const t = tasks.find(x => x.id === taskId);
    if(!t) return;
    
    let s1="", s2="", s3="", s4="", s5="", s6="";
    if(t.status === 'SEM DEFINIÇÃO DO CLIENTE') { s1="active"; }
    else if(t.status === 'A FAZER') { s1="completed"; s2="active"; }
    else if(t.status === 'EM ANDAMENTO') { s1="completed"; s2="completed"; s3="active"; s4="active"; }
    else if(t.status === 'AGUARDANDO APROVAÇÃO') { s1="completed"; s2="completed"; s3="completed"; s4="completed"; s5="active"; }
    else if(t.status === 'CONCLUÍDO') { s1="completed"; s2="completed"; s3="completed"; s4="completed"; s5="completed"; s6="completed"; }

    let completedSteps = [s1, s2, s3, s4, s5, s6].filter(s => s === 'completed').length;

    container.innerHTML = `
        <div class="lt-timeline" id="timelineCanvas">
            <svg id="connections-layer" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="36" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b00" />
                    </marker>
                    <marker id="arrow-dashed" viewBox="0 0 10 10" refX="36" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b00" />
                    </marker>
                </defs>
            </svg>
            <div class="lt-track">
                <!-- Step 1 -->
                <div class="lt-step ${s1} info-collapsed" id="step-Briefing">
                    <div class="lt-header-info">
                        <span class="lt-step-num">01</span>
                        <span class="lt-step-title">Briefing <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('Briefing')"></i></span>
                        <span class="lt-step-role">Gestor</span>
                    </div>
                    <div class="lt-footer-info">
                        <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.agent || 'A')}&background=random"> ${t.agent || '-'}</div>
                        <div class="lt-date">20/05 - 09:00</div>
                        <div class="lt-duration">1h 30m</div>
                    </div>
                    <div class="lt-circle-wrapper" onclick="openStepDetailsModal('Briefing')" oncontextmenu="showNodeContextMenu(event, this)">
                        <div class="lt-circle"><i class='bx bx-file'></i></div>
                        <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, 'Briefing')"><i class='bx bx-play-circle'></i></div>
                        <div class="lt-check"><i class='bx bx-check'></i></div>
                        <div class="lt-anchor top" onmousedown="startLineDraw(event, 'step-Briefing')"></div>
                        <div class="lt-anchor bottom" onmousedown="startLineDraw(event, 'step-Briefing')"></div>
                        <div class="lt-anchor left" onmousedown="startLineDraw(event, 'step-Briefing')"></div>
                        <div class="lt-anchor right" onmousedown="startLineDraw(event, 'step-Briefing')"></div>
                    </div>
                </div>
                
                <!-- Step 2 -->
                <div class="lt-step ${s2} info-collapsed" id="step-Planejamento">
                    <div class="lt-header-info">
                        <span class="lt-step-num">02</span>
                        <span class="lt-step-title">Planejamento <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('Planejamento')"></i></span>
                        <span class="lt-step-role">Gestor</span>
                    </div>
                    <div class="lt-footer-info">
                        <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.agent || 'A')}&background=random"> ${t.agent || '-'}</div>
                        <div class="lt-date">20/05 - 10:30</div>
                        <div class="lt-duration">1h 30m</div>
                    </div>
                    <div class="lt-circle-wrapper" onclick="openStepDetailsModal('Planejamento')" oncontextmenu="showNodeContextMenu(event, this)">
                        <div class="lt-circle"><i class='bx bx-clipboard'></i></div>
                        <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, 'Planejamento')"><i class='bx bx-play-circle'></i></div>
                        <div class="lt-check"><i class='bx bx-check'></i></div>
                        <div class="lt-anchor top" onmousedown="startLineDraw(event, 'step-Planejamento')"></div>
                        <div class="lt-anchor bottom" onmousedown="startLineDraw(event, 'step-Planejamento')"></div>
                        <div class="lt-anchor left" onmousedown="startLineDraw(event, 'step-Planejamento')"></div>
                        <div class="lt-anchor right" onmousedown="startLineDraw(event, 'step-Planejamento')"></div>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="lt-step ${s3} info-collapsed" id="step-Redação">
                    <div class="lt-header-info">
                        <span class="lt-step-num">03</span>
                        <span class="lt-step-title">Redação <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('Redação')"></i></span>
                        <span class="lt-step-role">Redator</span>
                    </div>
                    <div class="lt-footer-info">
                        <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.designer || 'D')}&background=random"> ${t.designer || '-'}</div>
                        <div class="lt-date">20/05 - 12:00</div>
                        <div class="lt-duration">4h 00m</div>
                    </div>
                    <div class="lt-circle-wrapper" onclick="openStepDetailsModal('Redação')" oncontextmenu="showNodeContextMenu(event, this)">
                        <div class="lt-circle"><i class='bx bx-pencil'></i></div>
                        <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, 'Redação')"><i class='bx bx-play-circle'></i></div>
                        <div class="lt-check"><i class='bx bx-check'></i></div>
                        <div class="lt-anchor top" onmousedown="startLineDraw(event, 'step-Redação')"></div>
                        <div class="lt-anchor bottom" onmousedown="startLineDraw(event, 'step-Redação')"></div>
                        <div class="lt-anchor left" onmousedown="startLineDraw(event, 'step-Redação')"></div>
                        <div class="lt-anchor right" onmousedown="startLineDraw(event, 'step-Redação')"></div>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="lt-step ${s4} info-collapsed" id="step-Design">
                    <div class="lt-header-info">
                        <span class="lt-step-num">04</span>
                        <span class="lt-step-title">Design <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('Design')"></i></span>
                        <span class="lt-step-role">Designer</span>
                    </div>
                    <div class="lt-footer-info">
                        <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.designer || 'D')}&background=random"> ${t.designer || '-'}</div>
                        <div class="lt-date">20/05 - 16:30</div>
                        <div class="lt-duration">3h 00m</div>
                    </div>
                    <div class="lt-circle-wrapper" onclick="openStepDetailsModal('Design')" oncontextmenu="showNodeContextMenu(event, this)">
                        <div class="lt-circle"><i class='bx bx-palette'></i></div>
                        <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, 'Design')"><i class='bx bx-play-circle'></i></div>
                        <div class="lt-check"><i class='bx bx-check'></i></div>
                        <div class="lt-anchor top" onmousedown="startLineDraw(event, 'step-Design')"></div>
                        <div class="lt-anchor bottom" onmousedown="startLineDraw(event, 'step-Design')"></div>
                        <div class="lt-anchor left" onmousedown="startLineDraw(event, 'step-Design')"></div>
                        <div class="lt-anchor right" onmousedown="startLineDraw(event, 'step-Design')"></div>
                    </div>
                </div>

                <!-- Step 5 -->
                <div class="lt-step ${s5} info-collapsed" id="step-Revisão Final">
                    <div class="lt-header-info">
                        <span class="lt-step-num">05</span>
                        <span class="lt-step-title">Revisão Final <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('Revisão Final')"></i></span>
                        <span class="lt-step-role">Gestor</span>
                    </div>
                    <div class="lt-footer-info">
                        <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.agent || 'A')}&background=random"> ${t.agent || '-'}</div>
                        <div class="lt-date">22/05 - 09:00</div>
                        <div class="lt-duration">1h 00m</div>
                    </div>
                    <div class="lt-circle-wrapper" onclick="openStepDetailsModal('Revisão Final')" oncontextmenu="showNodeContextMenu(event, this)">
                        <div class="lt-circle"><i class='bx bx-search'></i></div>
                        <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, 'Revisão Final')"><i class='bx bx-play-circle'></i></div>
                        <div class="lt-check"><i class='bx bx-check'></i></div>
                        <div class="lt-anchor top" onmousedown="startLineDraw(event, 'step-Revisão Final')"></div>
                        <div class="lt-anchor bottom" onmousedown="startLineDraw(event, 'step-Revisão Final')"></div>
                        <div class="lt-anchor left" onmousedown="startLineDraw(event, 'step-Revisão Final')"></div>
                        <div class="lt-anchor right" onmousedown="startLineDraw(event, 'step-Revisão Final')"></div>
                    </div>
                </div>

                <!-- Step 6 -->
                <div class="lt-step ${s6} info-collapsed" id="step-Aprovação">
                    <div class="lt-header-info">
                        <span class="lt-step-num">06</span>
                        <span class="lt-step-title">Aprovação <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('Aprovação')"></i></span>
                        <span class="lt-step-role">Gestor</span>
                    </div>
                    <div class="lt-footer-info">
                        <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.agent || 'A')}&background=random"> ${t.agent || '-'}</div>
                        <div class="lt-date">22/05 - 11:00</div>
                        <div class="lt-duration">1h 00m</div>
                    </div>
                    <div class="lt-circle-wrapper" onclick="openStepDetailsModal('Aprovação')" oncontextmenu="showNodeContextMenu(event, this)">
                        <div class="lt-circle"><i class='bx bx-flag'></i></div>
                        <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, 'Aprovação')"><i class='bx bx-play-circle'></i></div>
                        <div class="lt-check"><i class='bx bx-check'></i></div>
                        <div class="lt-anchor top" onmousedown="startLineDraw(event, 'step-Aprovação')"></div>
                        <div class="lt-anchor bottom" onmousedown="startLineDraw(event, 'step-Aprovação')"></div>
                        <div class="lt-anchor left" onmousedown="startLineDraw(event, 'step-Aprovação')"></div>
                        <div class="lt-anchor right" onmousedown="startLineDraw(event, 'step-Aprovação')"></div>
                    </div>
                </div>

                <!-- Adjustment Track (Draggable Area) -->
                <div class="lt-adjustment-track" id="adjustmentLayer">
                </div>
            </div>

            <div class="lt-dashboard" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 1000;">
                <div class="lt-dash-right draggable-node" id="resumoGeralPanel" style="position: absolute; bottom: 20px; right: 20px; cursor: move; box-shadow: var(--shadow-card); pointer-events: auto;">
                    <!-- Collapsed View -->
                    <div class="lt-resumo-collapsed-info" id="collapsedTimerInfo" style="display: none; align-items: center; justify-content: space-between; width: 100%; height: 100%; padding: 0 16px;">
                        
                        <!-- Left Controls -->
                        <div style="display:flex; align-items:center; gap: 4px; background: #fafafa; border-radius: 8px; padding: 4px; border: 1px solid #f3f4f6;">
                            <div class="mini-control-btn play" onclick="controlMiniTimer('play', event)"><i class='bx bx-play'></i></div>
                            <div class="mini-control-btn pause" onclick="controlMiniTimer('pause', event)"><i class='bx bx-pause'></i></div>
                            <div class="mini-control-btn stop" onclick="controlMiniTimer('stop', event)"><i class='bx bx-stop'></i></div>
                        </div>
                        
                        <!-- Divider -->
                        <div style="width: 1px; height: 32px; background: #f3f4f6;"></div>

                        <!-- Middle Info -->
                        <div style="display:flex; align-items:center; gap: 12px; flex: 1; padding-left: 8px;">
                            <i class='bx bx-pause-circle' id="miniTimerIcon" style="font-size: 32px; color: #ff6b00;"></i>
                            <div style="display:flex; flex-direction: column; line-height: 1.2;">
                                <span id="miniTimerStatusText" style="font-size:14px; font-weight:700; color:#111827;">Pausado</span>
                                <span id="miniTimerText" style="font-size:12px; color:#6b7280;">(Selecione etapa)</span>
                            </div>
                        </div>

                        <!-- Divider -->
                        <div style="width: 1px; height: 32px; background: #f3f4f6;"></div>

                        <!-- Right Timer -->
                        <div style="display:flex; align-items:center; gap: 8px; padding-left: 8px;">
                            <div style="display:flex; align-items:center; gap: 6px; background: #fff7ed; padding: 6px 12px; border-radius: 8px;">
                                <i class='bx bx-time-five' style="color:#ff6b00; font-size: 16px;"></i>
                                <span id="miniTimerCount" style="font-size:15px; font-weight:700; color:#ff6b00; font-family: 'Inter', sans-serif;">00:00:00</span>
                            </div>
                            <div class="lt-resumo-toggle-btn" onclick="toggleResumoGeral()">
                                <i class='bx bx-chevron-up'></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Expanded View -->
                    <i class='bx bx-chevron-down lt-resumo-toggle expanded-only' onclick="toggleResumoGeral()"></i>
                    <div class="lt-dash-content">
                        <div class="lt-resumo-title">Resumo geral</div>
                        <div class="lt-resumo-stats">
                            <div class="lt-resumo-stat">
                                <span>Etapas concluídas</span>
                                <strong>${completedSteps} de 6</strong>
                            </div>
                            <div class="lt-resumo-stat">
                                <span>Ajustes realizados</span>
                                <strong id="resumoAjustesCount">1</strong>
                            </div>
                        </div>
                        <div class="lt-last-update">
                            <i class='bx bxs-circle'></i> 
                            <span style="margin-right:4px;">Última atualização:</span> 
                            <input type="text" value="20/05/2026 - 16:15" style="width: 130px; background: transparent; border: 1px dashed #d1d5db; border-radius: 4px; padding: 2px 4px; color:#6b7280; font-size: 11px;">
                        </div>
                        <div class="lt-resumo-big" style="margin-top: 24px;">
                            <div>
                                <span style="font-size:12px; font-weight:500; color:#6b7280; display:block; margin-bottom:4px;">Tempo total gasto <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; font-size:14px; margin-left:4px;"></i></span>
                                <input type="text" value="11h 30m" style="width: 120px; background: transparent; border: 1px dashed #d1d5db; border-radius: 4px; padding: 2px 4px; font-weight:700; color:#111827; font-size: 24px; font-family: 'Inter', sans-serif;">
                            </div>
                            <i class='bx bx-time' style="color:#ff6b00; font-size:32px; opacity:0.8;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize draggables after a short timeout to ensure DOM is ready
    setTimeout(() => {
        document.querySelectorAll('.draggable-node').forEach(node => {
            makeDraggable(node);
        });
        updateConnections(); // Draw initial lines
    }, 100);
}

function updateConnections() {
    const svg = document.getElementById('connections-layer');
    const container = document.getElementById('timelineCanvas');
    if (!svg || !container) return;
    
    // Clear existing paths but keep defs
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if(defs) svg.appendChild(defs);
    
    // Define the logical connections between nodes
    if (!window.clientConnections) {
        window.clientConnections = [
            {from: 'step-Briefing', to: 'step-Planejamento', type: 'solid'},
            {from: 'step-Planejamento', to: 'step-Redação', type: 'solid'},
            {from: 'step-Redação', to: 'step-Design', type: 'solid'},
            {from: 'step-Design', to: 'step-Revisão Final', type: 'solid'},
            {from: 'step-Revisão Final', to: 'step-Aprovação', type: 'solid'}
        ];
    }
    const connections = window.clientConnections;
    
    const containerRect = container.getBoundingClientRect();
    const radius = 28; // Half of 56px circle
    
    connections.forEach(conn => {
        const fromEl = document.getElementById(conn.from);
        const toEl = document.getElementById(conn.to);
        if(!fromEl || !toEl) return;
        
        const fromCircle = fromEl.querySelector('.lt-circle');
        const toCircle = toEl.querySelector('.lt-circle');
        
        if(!fromCircle || !toCircle) return;
        
        // Only draw lines between main steps if the source is completed, unless it's a manual connection
        if (conn.from.startsWith('step-') && conn.to.startsWith('step-') && !conn.manual) {
            if (!fromEl.classList.contains('completed')) return;
        }
        
        const fC = fromCircle.getBoundingClientRect();
        const tC = toCircle.getBoundingClientRect();
        
        const centerStartX = fC.left + fC.width/2 - containerRect.left;
        const centerStartY = fC.top + fC.height/2 - containerRect.top;
        const centerEndX = tC.left + tC.width/2 - containerRect.left;
        const centerEndY = tC.top + tC.height/2 - containerRect.top;
        
        // Calculate edge intersections instead of centers
        const isHorizontal = Math.abs(centerEndX - centerStartX) > Math.abs(centerEndY - centerStartY);
        
        let startX, startY, endX, endY;
        
        if (isHorizontal) {
            startX = centerStartX + (centerEndX > centerStartX ? radius : -radius);
            startY = centerStartY;
            endX = centerEndX - (centerEndX > centerStartX ? radius : -radius);
            endY = centerEndY;
        } else {
            startX = centerStartX;
            startY = centerStartY + (centerEndY > centerStartY ? radius : -radius);
            endX = centerEndX;
            endY = centerEndY - (centerEndY > centerStartY ? radius : -radius);
        }

        // Check if they are too close to draw a proper line
        if (Math.hypot(centerEndX - centerStartX, centerEndY - centerStartY) < radius * 2) return;
        
        // Draw Curved SVG Line
        let d = '';
        if (isHorizontal) {
            d = `M ${startX} ${startY} C ${startX + (endX-startX)/2} ${startY}, ${endX - (endX-startX)/2} ${endY}, ${endX} ${endY}`;
        } else {
            d = `M ${startX} ${startY} C ${startX} ${startY + (endY-startY)/2}, ${endX} ${endY - (endY-startY)/2}, ${endX} ${endY}`;
        }
        
        // Transparent Hitbox Path
        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitPath.setAttribute('d', d);
        hitPath.setAttribute('stroke', 'transparent');
        hitPath.setAttribute('stroke-width', '16');
        hitPath.setAttribute('fill', 'none');
        hitPath.style.pointerEvents = 'stroke';
        hitPath.style.cursor = 'context-menu';
        hitPath.oncontextmenu = (e) => showWireContextMenu(e, conn.from, conn.to);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#ff6b00');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.classList.add('pulse-line');
        path.style.pointerEvents = 'none'; // hitPath handles events
        
        if(conn.type === 'dashed') {
            path.setAttribute('stroke-dasharray', '6,4');
        }
        svg.appendChild(hitPath);
        svg.appendChild(path);
    });
}

function toggleResumoGeral() {
    const panel = document.getElementById('resumoGeralPanel');
    if (panel) panel.classList.toggle('collapsed');
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        // Prevent dragging if clicking on an input or a button
        if (e.target.tagName === 'INPUT' || e.target.closest('.bx-pencil') || e.target.closest('.lt-circle-overlay') || e.target.closest('.lt-delete-btn') || e.target.closest('.mini-control-btn') || e.target.closest('.lt-resumo-toggle-btn') || e.target.closest('.lt-resumo-toggle')) return;
        
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Lock top and left before unsetting bottom and right to prevent teleporting
        if (element.style.bottom !== "auto" || element.style.right !== "auto") {
            element.style.top = element.offsetTop + "px";
            element.style.left = element.offsetLeft + "px";
            element.style.bottom = "auto";
            element.style.right = "auto";
        }
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        updateConnections(); // Dynamically update lines!
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Timeline Modal & Timer Logic
function openStepDetailsModal(stepTitle) {
    document.getElementById('stepModalTitle').innerText = 'Detalhes: ' + stepTitle;
    document.getElementById('stepDetailsModal').style.display = 'flex';
}

function closeStepDetailsModal() {
    document.getElementById('stepDetailsModal').style.display = 'none';
}

// --- Dynamic Line Drawing ---
let isDrawingLine = false;
let tempLineFrom = null;
let tempLinePath = null;

function startLineDraw(e, stepId) {
    e.stopPropagation();
    isDrawingLine = true;
    tempLineFrom = stepId;
    
    // create temporary path element
    const svg = document.getElementById('connections-layer');
    tempLinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempLinePath.setAttribute('stroke', '#ff6b00');
    tempLinePath.setAttribute('stroke-width', '2');
    tempLinePath.setAttribute('fill', 'none');
    tempLinePath.classList.add('pulse-line');
    tempLinePath.style.pointerEvents = 'none';
    svg.appendChild(tempLinePath);

    document.addEventListener('mousemove', drawTempLine);
    document.addEventListener('mouseup', finishLineDraw);
}

function drawTempLine(e) {
    if (!isDrawingLine) return;
    const container = document.getElementById('timelineCanvas');
    const containerRect = container.getBoundingClientRect();
    
    const fromEl = document.getElementById(tempLineFrom);
    if (!fromEl) return;
    const fromCircle = fromEl.querySelector('.lt-circle');
    const fC = fromCircle.getBoundingClientRect();
    
    const startX = fC.left + fC.width/2 - containerRect.left;
    const startY = fC.top + fC.height/2 - containerRect.top;
    
    const endX = e.clientX - containerRect.left;
    const endY = e.clientY - containerRect.top;
    
    // Draw simple curve
    const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);
    let d = '';
    if (isHorizontal) {
        d = `M ${startX} ${startY} C ${startX + (endX-startX)/2} ${startY}, ${endX - (endX-startX)/2} ${endY}, ${endX} ${endY}`;
    } else {
        d = `M ${startX} ${startY} C ${startX} ${startY + (endY-startY)/2}, ${endX} ${endY - (endY-startY)/2}, ${endX} ${endY}`;
    }
    tempLinePath.setAttribute('d', d);
}

function finishLineDraw(e) {
    document.removeEventListener('mousemove', drawTempLine);
    document.removeEventListener('mouseup', finishLineDraw);
    isDrawingLine = false;
    
    if (tempLinePath) {
        tempLinePath.remove();
        tempLinePath = null;
    }
    
    // find if dropped on another .lt-step
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const stepEl = target ? target.closest('.lt-step') : null;
    
    if (stepEl && stepEl.id && stepEl.id !== tempLineFrom) {
        // Toggle connection
        const existingIndex = window.clientConnections.findIndex(c => 
            (c.from === tempLineFrom && c.to === stepEl.id) || 
            (c.from === stepEl.id && c.to === tempLineFrom)
        );
        
        if (existingIndex !== -1) {
            window.clientConnections.splice(existingIndex, 1);
        } else {
            window.clientConnections.push({
                from: tempLineFrom,
                to: stepEl.id,
                type: 'solid',
                manual: true
            });
        }
        updateConnections();
    }
}

let targetAdjustmentStep = null;

// --- Fluid Background Logic ---
let fluidOrbs = [];
let fluidTargetX = 0;
let fluidTargetY = 0;
let fluidCursorX = 0;
let fluidCursorY = 0;

function initFluidBackground() {
    const artboardWrapper = document.getElementById("artboard-wrapper");
    const artboard = document.getElementById("artboard");
    const cursorBlob = document.getElementById("cursor-blob");
    const mainContent = document.querySelector('.main-content');
    
    if (!artboardWrapper || !cursorBlob || !mainContent) return;

    const handleMove = (x, y) => {
        const rect = artboardWrapper.getBoundingClientRect();
        fluidTargetX = x - rect.left;
        fluidTargetY = y - rect.top;
    };

    mainContent.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY));
    
    mainContent.addEventListener("mouseleave", () => {
        const rect = artboardWrapper.getBoundingClientRect();
        fluidTargetX = rect.width / 2;
        fluidTargetY = rect.height / 2;
    });

    // Run animation loop
    function animate() {

        fluidCursorX += (fluidTargetX - fluidCursorX) * 0.15;
        fluidCursorY += (fluidTargetY - fluidCursorY) * 0.15;

        const artboardRect = artboardWrapper.getBoundingClientRect();
        const padding = 20;
        const constrainedX = Math.max(padding, Math.min(fluidCursorX, artboardRect.width - padding));
        const constrainedY = Math.max(padding, Math.min(fluidCursorY, artboardRect.height - padding));

        cursorBlob.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
        requestAnimationFrame(animate);
    }
    
    // Set initial target
    setTimeout(() => {
        const rect = artboardWrapper.getBoundingClientRect();
        fluidTargetX = rect.width / 2;
        fluidTargetY = rect.height / 2;
        fluidCursorX = fluidTargetX;
        fluidCursorY = fluidTargetY;
        animate();
        spawnFluidOrbs(15); // Spawn 15 floating orbs
    }, 500);
}

function spawnFluidOrbs(count) {
    const artboard = document.getElementById("artboard");
    if (!artboard) return;

    fluidOrbs.forEach(orb => orb.remove());
    fluidOrbs = [];

    for (let i = 0; i < count; i++) {
        const orb = document.createElement("div");
        orb.classList.add("blob", "orb");

        const size = Math.max(20, Math.random() * 80);
        orb.style.width = `${size}px`;
        orb.style.height = `${size}px`;
        orb.style.left = `${Math.random() * 100}%`;
        orb.style.top = `${Math.random() * 100}%`;

        // Alternate hue offsets for variation (laranja e amarelo)
        const hueOffset = i % 2 === 0 ? -15 : 20;
        orb.style.background = `hsl(calc(var(--hue) + ${hueOffset}), 90%, 55%)`;
        orb.style.boxShadow = `0 0 20px hsl(calc(var(--hue) + ${hueOffset}), 90%, 45%)`;

        artboard.appendChild(orb);
        fluidOrbs.push(orb);

        const baseDuration = Math.random() * 10 + 10;
        const xDist = (Math.random() > 0.5 ? 1 : -1) * Math.max(50, Math.random() * 250);
        const yDist = (Math.random() > 0.5 ? 1 : -1) * Math.max(50, Math.random() * 250);

        orb.animate(
            [
                { transform: "translate(0, 0) scale(1)" },
                { transform: `translate(${xDist}px, ${yDist}px) scale(${Math.max(0.6, Math.random() * 1.5)})` }
            ],
            {
                duration: baseDuration * 1000,
                iterations: Infinity,
                direction: "alternate",
                easing: "ease-in-out"
            }
        );
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initFluidBackground();
    window.addEventListener('resize', updateConnections);
});

// Right Click Context Menu
let adjustmentCount = 5;
document.addEventListener('contextmenu', function(e) {
    const timelineArea = document.getElementById('clientTimelineArea');
    if (!timelineArea || timelineArea.style.display === 'none') return;
    if (!e.target.closest('#clientTimelineArea')) return;
    if (e.target.closest('.lt-step')) return;

    e.preventDefault();
    
    let menu = document.getElementById('contextMenu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.style.position = 'absolute';
        menu.style.background = '#fff';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        menu.style.padding = '8px 0';
        menu.style.borderRadius = '8px';
        menu.style.zIndex = '1000';
        
        const createBtn = document.createElement('div');
        createBtn.innerText = 'Criar Nova Bolinha de Ajuste';
        createBtn.style.padding = '8px 16px';
        createBtn.style.cursor = 'pointer';
        createBtn.style.fontSize = '13px';
        createBtn.style.color = '#111827';
        createBtn.style.fontWeight = '500';
        createBtn.onmouseover = () => createBtn.style.background = '#f3f4f6';
        createBtn.onmouseout = () => createBtn.style.background = '#fff';
        createBtn.onclick = () => {
            createNewAdjustment(parseFloat(menu.dataset.x), parseFloat(menu.dataset.y));
            menu.style.display = 'none';
        };
        
        menu.appendChild(createBtn);
        document.body.appendChild(menu);
    }
    
    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    
    const container = document.getElementById('timelineCanvas');
    const rect = container.getBoundingClientRect();
    menu.dataset.x = e.clientX - rect.left;
    menu.dataset.y = e.clientY - rect.top;
});

document.addEventListener('click', () => {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.style.display = 'none';
});

function createNewAdjustment(x, y) {
    const track = document.getElementById('adjustmentLayer');
    if (!track) return;
    
    const newId = 'adj-new-' + adjustmentCount++;
    const title = 'Ajuste ' + (adjustmentCount-1);
    
    const html = `
        <div class="lt-step draggable-node info-collapsed" id="${newId}" style="top: ${y - 40}px; left: ${x - 40}px;">
            <div class="lt-delete-btn" onclick="this.closest('.lt-step').remove(); updateConnections();"><i class='bx bx-x'></i></div>
            <div class="lt-header-info">
                <span class="lt-step-num">0${adjustmentCount-1}.1</span>
                <span class="lt-step-title">${title} <i class='bx bx-pencil' style="cursor:pointer; color:#ff6b00; margin-left:4px;" onclick="openStepDetailsModal('${title}')"></i></span>
                <span class="lt-step-role" style="color:#ff6b00;">Atribuir</span>
            </div>
            <div class="lt-footer-info">
                <div class="lt-assignee"><img src="https://ui-avatars.com/api/?name=A&background=random"> <span id="assignee-${title}">N/A</span></div>
                <div class="lt-date">--/-- - --:--</div>
                <div class="lt-duration">0h 00m</div>
            </div>
            <div class="lt-circle-wrapper" onclick="openStepDetailsModal('${title}')" oncontextmenu="showNodeContextMenu(event, this)">
                <div class="lt-circle lt-circle-dashed"><i class='bx bx-pencil'></i></div>
                <div class="lt-circle-overlay" onclick="event.stopPropagation(); toggleTimer(this, '${title}')"><i class='bx bx-play-circle'></i></div>
                <div class="lt-anchor top" onmousedown="startLineDraw(event, '${newId}')"></div>
                <div class="lt-anchor bottom" onmousedown="startLineDraw(event, '${newId}')"></div>
                <div class="lt-anchor left" onmousedown="startLineDraw(event, '${newId}')"></div>
                <div class="lt-anchor right" onmousedown="startLineDraw(event, '${newId}')"></div>
            </div>
        </div>
    `;
    track.insertAdjacentHTML('beforeend', html);
    makeDraggable(document.getElementById(newId));
    return newId;
}

function closeAdjustmentModal() {
    document.getElementById('adjustmentModal').style.display = 'none';
}

let activeTimerInterval = null;
let timerSeconds = 0;
let activeTimerStepTitle = null;

function toggleTimer(element, stepTitle) {
    const icon = element.querySelector('i');
    
    // Define the sequence
    const stepsSeq = ['Briefing', 'Planejamento', 'Redação', 'Design', 'Revisão Final', 'Aprovação'];
    const targetIndex = stepsSeq.indexOf(stepTitle);
    
    const miniIcon = document.getElementById('miniTimerIcon');
    const miniText = document.getElementById('miniTimerText');
    const miniCount = document.getElementById('miniTimerCount');
    
    if (icon.classList.contains('bx-play-circle')) {
        // Stop any existing timer elsewhere
        if(activeTimerInterval) clearInterval(activeTimerInterval);
        
        if (activeTimerStepTitle !== stepTitle) {
            // Visual reset of all other playing timers
            document.querySelectorAll('.lt-circle-overlay i.bx-pause-circle').forEach(i => {
                i.classList.remove('bx-pause-circle');
                i.classList.add('bx-play-circle');
            });
            timerSeconds = 0;
        }
        
        // Start Timer
        activeTimerStepTitle = stepTitle;
        icon.classList.remove('bx-play-circle');
        icon.classList.add('bx-pause-circle');
        showToast('Timer iniciado para: ' + stepTitle);
        
        if (miniIcon) { miniIcon.style.display = 'block'; miniIcon.className = 'bx bx-loader-circle bx-spin'; miniIcon.style.color = '#10b981'; }
        const miniStatus = document.getElementById('miniTimerStatusText');
        if (miniStatus) { miniStatus.innerText = 'Rodando'; miniStatus.style.color = '#10b981'; }
        if (miniText) { miniText.innerText = '(' + stepTitle + ')'; }
        
        activeTimerInterval = setInterval(() => {
            timerSeconds++;
            if (miniCount) {
                const h = Math.floor(timerSeconds / 3600).toString().padStart(2, '0');
                const m = Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0');
                const s = (timerSeconds % 60).toString().padStart(2, '0');
                miniCount.innerText = `${h}:${m}:${s}`;
            }
        }, 1000);
        
        // Advance progress visually
        stepsSeq.forEach((stepName, i) => {
            const el = document.getElementById('step-' + stepName);
            if (!el) return;
            
            el.classList.remove('active', 'completed');
            
            if (i < targetIndex) {
                el.classList.add('completed');
            } else if (i === targetIndex) {
                el.classList.add('active');
            }
        });
        
    } else {
        // Pause Timer
        icon.classList.remove('bx-pause-circle');
        icon.classList.add('bx-play-circle');
        showToast('Timer pausado para: ' + stepTitle);
        
        if(activeTimerInterval) clearInterval(activeTimerInterval);
        
        if (miniIcon) { miniIcon.className = 'bx bx-pause-circle'; miniIcon.style.color = '#ff6b00'; }
        const miniStatus = document.getElementById('miniTimerStatusText');
        if (miniStatus) { miniStatus.innerText = 'Pausado'; miniStatus.style.color = '#111827'; }
        if (miniText) { miniText.innerText = '(' + stepTitle + ')'; }
    }
    
    // Update lines based on new completed statuses
    updateConnections();
}

function toggleStepInfo(event, element) {
    event.preventDefault();
    event.stopPropagation();
    const stepEl = element.closest('.lt-step');
    if (stepEl) {
        stepEl.classList.toggle('info-collapsed');
    }
}

function showNodeContextMenu(e, element) {
    e.preventDefault();
    e.stopPropagation();
    
    // Hide standard menu if open
    const stdMenu = document.getElementById('contextMenu');
    if (stdMenu) stdMenu.style.display = 'none';

    let menu = document.getElementById('nodeContextMenu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'nodeContextMenu';
        menu.style.position = 'absolute';
        menu.style.background = '#fff';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        menu.style.padding = '8px 0';
        menu.style.borderRadius = '8px';
        menu.style.zIndex = '1000';
        menu.style.minWidth = '200px';

        // Item 1: Toggle Info
        const toggleBtn = document.createElement('div');
        toggleBtn.innerHTML = "<i class='bx bx-expand' style='margin-right:8px; color:#6b7280'></i> Expandir / Retrair Informações";
        toggleBtn.style.padding = '8px 16px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontSize = '13px';
        toggleBtn.style.color = '#111827';
        toggleBtn.style.fontWeight = '500';
        toggleBtn.onmouseover = () => toggleBtn.style.background = '#f3f4f6';
        toggleBtn.onmouseout = () => toggleBtn.style.background = '#fff';
        toggleBtn.onclick = () => {
            const stepEl = document.getElementById(menu.dataset.targetStep);
            if(stepEl) stepEl.classList.toggle('info-collapsed');
            menu.style.display = 'none';
        };

        // Item 2: Create Adjustment
        const adjustBtn = document.createElement('div');
        adjustBtn.innerHTML = "<i class='bx bx-plus-circle' style='margin-right:8px; color:#ff6b00'></i> Criar Ajuste da Etapa";
        adjustBtn.style.padding = '8px 16px';
        adjustBtn.style.cursor = 'pointer';
        adjustBtn.style.fontSize = '13px';
        adjustBtn.style.color = '#111827';
        adjustBtn.style.fontWeight = '500';
        adjustBtn.onmouseover = () => adjustBtn.style.background = '#f3f4f6';
        adjustBtn.onmouseout = () => adjustBtn.style.background = '#fff';
        adjustBtn.onclick = () => {
            const stepEl = document.getElementById(menu.dataset.targetStep);
            if(stepEl) {
                // Determine spawn coords (slightly right and bottom)
                const rect = stepEl.getBoundingClientRect();
                const container = document.getElementById('timelineCanvas').getBoundingClientRect();
                const spawnX = rect.left - container.left + 80;
                const spawnY = rect.top - container.top + 100;
                
                const newId = createNewAdjustment(spawnX, spawnY);
                // Connect original to new adjustment
                if (newId) {
                    window.clientConnections.push({
                        from: stepEl.id,
                        to: newId,
                        type: 'dashed'
                    });
                    updateConnections();
                }
            }
            menu.style.display = 'none';
        };

        menu.appendChild(toggleBtn);
        menu.appendChild(adjustBtn);
        document.body.appendChild(menu);
    }

    const stepEl = element.closest('.lt-step');
    if (stepEl) {
        menu.dataset.targetStep = stepEl.id;
    }

    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
}

function showWireContextMenu(e, fromId, toId) {
    e.preventDefault();
    e.stopPropagation();
    
    // Hide standard menus
    const stdMenu = document.getElementById('contextMenu');
    if (stdMenu) stdMenu.style.display = 'none';
    const nodeMenu = document.getElementById('nodeContextMenu');
    if (nodeMenu) nodeMenu.style.display = 'none';

    let menu = document.getElementById('wireContextMenu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'wireContextMenu';
        menu.style.position = 'absolute';
        menu.style.background = '#fff';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        menu.style.padding = '8px 0';
        menu.style.borderRadius = '8px';
        menu.style.zIndex = '1000';
        menu.style.minWidth = '160px';

        const deleteBtn = document.createElement('div');
        deleteBtn.innerHTML = "<i class='bx bx-trash' style='margin-right:8px; color:#ef4444'></i> Apagar Fio";
        deleteBtn.style.padding = '8px 16px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '13px';
        deleteBtn.style.color = '#ef4444';
        deleteBtn.style.fontWeight = '500';
        deleteBtn.onmouseover = () => deleteBtn.style.background = '#fee2e2';
        deleteBtn.onmouseout = () => deleteBtn.style.background = '#fff';
        deleteBtn.onclick = () => {
            const fId = menu.dataset.fromId;
            const tId = menu.dataset.toId;
            const index = window.clientConnections.findIndex(c => c.from === fId && c.to === tId);
            if (index !== -1) {
                window.clientConnections.splice(index, 1);
                updateConnections();
                showToast("Fio apagado com sucesso.");
            }
            menu.style.display = 'none';
        };

        menu.appendChild(deleteBtn);
        document.body.appendChild(menu);
    }

    menu.dataset.fromId = fromId;
    menu.dataset.toId = toId;

    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
}

document.addEventListener('click', (e) => {
    const nodeMenu = document.getElementById('nodeContextMenu');
    if (nodeMenu && !e.target.closest('#nodeContextMenu')) nodeMenu.style.display = 'none';
    const wireMenu = document.getElementById('wireContextMenu');
    if (wireMenu && !e.target.closest('#wireContextMenu')) wireMenu.style.display = 'none';
});

function controlMiniTimer(action, event) {
    event.stopPropagation();
    if (!activeTimerStepTitle) {
        showToast("Nenhuma etapa selecionada. Inicie o timer clicando em uma bolinha.");
        return;
    }
    
    // Find the corresponding element icon to click it or manipulate it directly
    // Wait, the easiest is to just find the step element and call toggleTimer if it doesn't match the state
    const stepEl = document.getElementById('step-' + activeTimerStepTitle) || document.getElementById('adj-' + activeTimerStepTitle) || Array.from(document.querySelectorAll('.lt-step')).find(el => el.querySelector('.lt-step-title').innerText.includes(activeTimerStepTitle));
    
    if (!stepEl) return;
    const overlay = stepEl.querySelector('.lt-circle-overlay');
    const icon = overlay.querySelector('i');
    
    const isRunning = icon.classList.contains('bx-pause-circle');
    
    if (action === 'play' && !isRunning) {
        toggleTimer(overlay, activeTimerStepTitle);
    } else if (action === 'pause' && isRunning) {
        toggleTimer(overlay, activeTimerStepTitle);
    } else if (action === 'stop') {
        if (isRunning) toggleTimer(overlay, activeTimerStepTitle);
        
        timerSeconds = 0;
        const miniCount = document.getElementById('miniTimerCount');
        if (miniCount) miniCount.innerText = '00:00:00';
        
        const miniIcon = document.getElementById('miniTimerIcon');
        const miniText = document.getElementById('miniTimerText');
        const miniStatus = document.getElementById('miniTimerStatusText');
        
        if (miniIcon) { miniIcon.className = 'bx bx-pause-circle'; miniIcon.style.color = '#ff6b00'; }
        if (miniStatus) { miniStatus.innerText = 'Parado'; miniStatus.style.color = '#111827'; }
        if (miniText) { miniText.innerText = '(Selecione etapa)'; miniText.style.color = '#6b7280'; }
        
        showToast('Timer zerado para: ' + activeTimerStepTitle);
        activeTimerStepTitle = null; // Clear active step entirely
    }
}
