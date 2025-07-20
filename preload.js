const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('api', {
  connectSSH: (credentials) => ipcRenderer.invoke('connect-ssh', credentials),
  disconnectSSH: () => ipcRenderer.invoke('disconnect-ssh'),
  listContainers: () => ipcRenderer.invoke('list-containers'),
  exportLogs: (options) => ipcRenderer.invoke('export-logs', options),
  getLastConnection: () => ipcRenderer.invoke('get-last-connection'),

   // New methods
  listDirectory: (path) => ipcRenderer.invoke('list-directory', path),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (data) => ipcRenderer.invoke('write-file', data)
});