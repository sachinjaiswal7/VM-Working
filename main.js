const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
// const Store = require('electron-store');

// Initialize store for saving preferences
// const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle SSH connection request
ipcMain.handle('connect-ssh', async (event, credentials) => {
  try {
    const conn = new Client();
    
    return new Promise((resolve, reject) => {
      conn.on('ready', () => {
        // Save successful credentials (excluding password)
        // store.set('lastConnection', {
        //   host: credentials.host,
        //   port: credentials.port,
        //   username: credentials.username
        // });
        
        resolve({ success: true, message: 'Connected successfully' });
      });
      
      conn.on('error', (err) => {
        reject({ success: false, message: `Connection error: ${err.message}` });
      });
      
      conn.connect({
        host: credentials.host,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password
      });
      
      // Store the connection in event for later use
      event.sender.conn = conn;
    });
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

// List Docker containers
ipcMain.handle('list-containers', async (event) => {
  try {
    const conn = event.sender.conn;
    
    return new Promise((resolve, reject) => {
      conn.exec('docker ps --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}"', (err, stream) => {
        if (err) reject({ success: false, message: `Error: ${err.message}` });
        
        let data = '';
        stream.on('data', (chunk) => {
          data += chunk;
        });
        
        stream.on('end', () => {
          const containers = data.trim().split('\n').map(container => {
            const [id, name, image, status, ports] = container.split('|');
            return { id, name, image, status, ports };
          });
          
          resolve({ success: true, containers });
        });
        
        stream.stderr.on('data', (data) => {
          reject({ success: false, message: `Error: ${data}` });
        });
      });
    });
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

// Export container logs
ipcMain.handle('export-logs', async (event, { containerId, startTime, endTime }) => {
  try {
    const conn = event.sender.conn;
    
    // Build the docker logs command with time filters
    let command = `docker logs ${containerId}`;
    if (startTime) {
      command += ` --since "${startTime}"`;
    }
    if (endTime) {
      command += ` --until "${endTime}"`;
    }
    
    // Ask user where to save the file
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save container logs',
      defaultPath: path.join(app.getPath('downloads'), `${containerId}-logs.txt`),
      filters: [
        { name: 'Text Files', extensions: ['txt', 'log'] }
      ]
    });
    
    if (!filePath) {
      return { success: false, message: 'Export cancelled by user' };
    }
    
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) reject({ success: false, message: `Error: ${err.message}` });
        
        let logs = '';
        stream.on('data', (chunk) => {
          logs += chunk;
        });
        
        stream.on('end', () => {
          // Write logs to the selected file
          fs.writeFileSync(filePath, logs);
          resolve({ 
            success: true, 
            message: `Logs exported successfully to: ${filePath}`,
            filePath 
          });
        });
        
        stream.stderr.on('data', (data) => {
          reject({ success: false, message: `Error: ${data}` });
        });
      });
    });
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

// Disconnect SSH
ipcMain.handle('disconnect-ssh', (event) => {
  try {
    if (event.sender.conn) {
      event.sender.conn.end();
      delete event.sender.conn;
      return { success: true, message: 'Disconnected successfully' };
    }
    return { success: false, message: 'No active connection' };
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});