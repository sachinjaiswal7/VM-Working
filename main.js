const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const Store = require('electron-store');
const scp = require('scp2');

// Initialize store for saving preferences
const store = new Store();

let mainWindow;
// const isDev = process.env.NODE_ENV === 'development';
const isDev = true;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load the correct URL based on the environment
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    console.log("In production mode");
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
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

// Store SSH connection
let sshConnection = null;

// Handle SSH connection request
ipcMain.handle('connect-ssh', async (event, credentials) => {
  try {
    const conn = new Client();
    
    return new Promise((resolve, reject) => {
      conn.on('ready', () => {
        // Save successful connection
        sshConnection = conn;
        
        // Save successful credentials (excluding password)
        store.set('lastConnection', {
          host: credentials.host,
          port: credentials.port,
          username: credentials.username
        });
        
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
    });
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

// List Docker containers
ipcMain.handle('list-containers', async () => {
  try {
    if (!sshConnection) {
      return { success: false, message: 'No active SSH connection' };
    }
    
    return new Promise((resolve, reject) => {
      sshConnection.exec('docker ps --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}"', (err, stream) => {
        if (err) reject({ success: false, message: `Error: ${err.message}` });
        
        let data = '';
        stream.on('data', (chunk) => {
          data += chunk;
        });
        
        stream.on('end', () => {
          const containers = data.trim().split('\n').filter(Boolean).map(container => {
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
    if (!sshConnection) {
      return { success: false, message: 'No active SSH connection' };
    }
    
    // Build the docker logs command with time filters
    let command = `docker logs ${containerId}`;
    if (startTime) {
      command += ` --since "${startTime}"`;
    }
    if (endTime) {
      command += ` --until "${endTime}"`;
    }
    
    // Ask user where to save the file
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save container logs',
      defaultPath: path.join(app.getPath('downloads'), `${containerId}-logs.txt`),
      filters: [
        { name: 'Text Files', extensions: ['txt', 'log'] }
      ]
    });
    
    if (canceled || !filePath) {
      return { success: false, message: 'Export cancelled by user' };
    }
    
    return new Promise((resolve, reject) => {
      sshConnection.exec(command, (err, stream) => {
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
ipcMain.handle('disconnect-ssh', () => {
  try {
    if (sshConnection) {
      sshConnection.end();
      sshConnection = null;
      return { success: true, message: 'Disconnected successfully' };
    }
    return { success: false, message: 'No active connection' };
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

// Get last connection details
ipcMain.handle('get-last-connection', () => {
  return store.get('lastConnection', {});
});


// Add these IPC handlers to the existing main.js file

// List directory contents
ipcMain.handle('list-directory', async (event, path = '.') => {
  try {
    if (!sshConnection) {
      return { success: false, message: 'No active SSH connection' };
    }
    
    return new Promise((resolve, reject) => {
      sshConnection.exec(`ls -la "${path}" | awk '{print $1" "$NF}'`, (err, stream) => {
        if (err) reject({ success: false, message: `Error: ${err.message}` });
        
        let data = '';
        stream.on('data', (chunk) => {
          data += chunk;
        });
        
        stream.on('end', () => {
          const lines = data.trim().split('\n');
          // Skip the total and first entries (. and ..)
          const entries = lines.slice(1).map(line => {
            const [permissions, name] = line.split(/\s+/);
            const isDirectory = permissions.startsWith('d');
            const isFile = permissions.startsWith('-');
            return { name, isDirectory, isFile, permissions };
          });
          
          resolve({ success: true, entries, currentPath: path });
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

// Read file content
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    if (!sshConnection) {
      return { success: false, message: 'No active SSH connection' };
    }
    
    return new Promise((resolve, reject) => {
      sshConnection.exec(`cat "${filePath}"`, (err, stream) => {
        if (err) reject({ success: false, message: `Error: ${err.message}` });
        
        let content = '';
        stream.on('data', (chunk) => {
          content += chunk;
        });
        
        stream.on('end', () => {
          resolve({ 
            success: true, 
            content,
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

// Replace the write-file handler with this updated version
ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    if (!sshConnection) {
      return { success: false, message: 'No active SSH connection' };
    }
    
    // Create a temporary file
    const tempFile = path.join(app.getPath('temp'), 'temp_edit_file');
    fs.writeFileSync(tempFile, content);
    
    // Get connection details directly from the store
    // This avoids trying to access internal SSH connection properties
    const connectionDetails = store.get('lastConnection', {});
    
    if (!connectionDetails.host || !connectionDetails.username) {
      return { success: false, message: 'Connection details not available' };
    }
    
    return new Promise((resolve, reject) => {
      // Use sftp directly from the existing SSH connection instead of SCP
      sshConnection.sftp((err, sftp) => {
        if (err) {
          reject({ success: false, message: `SFTP error: ${err.message}` });
          return;
        }
        
        // Create a readable stream from the temp file
        const readStream = fs.createReadStream(tempFile);
        // Create a writable stream to the remote file
        const writeStream = sftp.createWriteStream(filePath);
        
        // Handle potential errors
        writeStream.on('error', (err) => {
          reject({ success: false, message: `Write error: ${JSON.stringify(err.message)}` });
        });
        
        // Handle completion
        writeStream.on('close', () => {
          // Delete the temp file
          try { fs.unlinkSync(tempFile); } catch (e) { /* ignore */ }
          resolve({ 
            success: true, 
            message: 'File saved successfully',
            filePath
          });
        });
        
        // Pipe the local file to the remote file
        readStream.pipe(writeStream);
      });
    });
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});