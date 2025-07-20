const { ipcRenderer } = require('electron');

// DOM Elements
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const refreshBtn = document.getElementById('refresh-btn');
const exportLogsBtn = document.getElementById('export-logs-btn');
const backBtn = document.getElementById('back-btn');

const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');

const connectionStatus = document.getElementById('connection-status');
const exportStatus = document.getElementById('export-status');
const containerTbody = document.getElementById('container-tbody');
const containerInfo = document.getElementById('container-info');

const connectionPanel = document.getElementById('connection-panel');
const containerPanel = document.getElementById('container-panel');
const logsPanel = document.getElementById('logs-panel');

let selectedContainer = null;

// Event Listeners
connectBtn.addEventListener('click', async () => {
  const credentials = {
    host: hostInput.value,
    port: parseInt(portInput.value, 10),
    username: usernameInput.value,
    password: passwordInput.value
  };
  
  // Basic validation
  if (!credentials.host || !credentials.username || !credentials.password) {
    showStatus(connectionStatus, 'Please fill in all required fields', false);
    return;
  }
  
  try {
    const result = await ipcRenderer.invoke('connect-ssh', credentials);
    
    if (result.success) {
      showStatus(connectionStatus, result.message, true);
      
      // Enable/disable appropriate controls
      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
      
      // Show container panel
      connectionPanel.classList.remove('hidden');
      containerPanel.classList.remove('hidden');
      
      // Load containers
      loadContainers();
    } else {
      showStatus(connectionStatus, result.message, false);
    }
  } catch (error) {
    showStatus(connectionStatus, `Error: ${error.message}`, false);
  }
});

disconnectBtn.addEventListener('click', async () => {
  try {
    const result = await ipcRenderer.invoke('disconnect-ssh');
    
    if (result.success) {
      showStatus(connectionStatus, result.message, true);
      
      // Enable/disable appropriate controls
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      
      // Hide panels
      containerPanel.classList.add('hidden');
      logsPanel.classList.add('hidden');
      
      // Clear containers
      containerTbody.innerHTML = '';
    } else {
      showStatus(connectionStatus, result.message, false);
    }
  } catch (error) {
    showStatus(connectionStatus, `Error: ${error.message}`, false);
  }
});

refreshBtn.addEventListener('click', () => {
  loadContainers();
});

backBtn.addEventListener('click', () => {
  logsPanel.classList.add('hidden');
  containerPanel.classList.remove('hidden');
});

exportLogsBtn.addEventListener('click', async () => {
  if (!selectedContainer) return;
  
  try {
    const startTime = startTimeInput.value ? new Date(startTimeInput.value).toISOString() : '';
    const endTime = endTimeInput.value ? new Date(endTimeInput.value).toISOString() : '';
    
    const result = await ipcRenderer.invoke('export-logs', {
      containerId: selectedContainer.id,
      startTime,
      endTime
    });
    
    if (result.success) {
      showStatus(exportStatus, result.message, true);
    } else {
      showStatus(exportStatus, result.message, false);
    }
  } catch (error) {
    showStatus(exportStatus, `Error: ${error.message}`, false);
  }
});

// Helper Functions
async function loadContainers() {
  try {
    const result = await ipcRenderer.invoke('list-containers');
    
    if (result.success) {
      renderContainers(result.containers);
    } else {
      showStatus(connectionStatus, result.message, false);
    }
  } catch (error) {
    showStatus(connectionStatus, `Error: ${error.message}`, false);
  }
}

function renderContainers(containers) {
  containerTbody.innerHTML = '';
  
  if (containers.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">No containers found</td>';
    containerTbody.appendChild(row);
    return;
  }
  
  containers.forEach(container => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${container.id.substring(0, 12)}</td>
      <td>${container.name}</td>
      <td>${container.image}</td>
      <td>${container.status}</td>
      <td><button class="view-logs-btn" data-id="${container.id}" data-name="${container.name}">View Logs</button></td>
    `;
    
    containerTbody.appendChild(row);
  });
  
  // Add event listeners to view logs buttons
  document.querySelectorAll('.view-logs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedContainer = {
        id: btn.dataset.id,
        name: btn.dataset.name
      };
      
      showLogsPanel(selectedContainer);
    });
  });
}

function showLogsPanel(container) {
  // Switch panels
  containerPanel.classList.add('hidden');
  logsPanel.classList.remove('hidden');
  
  // Update container info
  containerInfo.textContent = `Container: ${container.name} (${container.id})`;
  
  // Clear previous status
  exportStatus.textContent = '';
  exportStatus.className = '';
  
  // Set default time range (last 1 hour)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Format for datetime-local input
  const formatDateForInput = (date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
  };
  
  startTimeInput.value = formatDateForInput(oneHourAgo);
  endTimeInput.value = formatDateForInput(now);
}

function showStatus(element, message, isSuccess) {
  element.textContent = message;
  element.className = isSuccess ? 'success' : 'error';
}