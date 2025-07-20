import React, { useState } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import ModeSelector from './components/ModeSelector';
import ContainerPanel from './components/ContainerPanel';
import LogsPanel from './components/LogsPanel';
import FileBrowser from './components/FileBrowser';
import FileEditor from './components/FileEditor';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState(null); // 'docker' or 'files'
  const [showLogsPanel, setShowLogsPanel] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });
  
  // File browser state
  const [currentPath, setCurrentPath] = useState('.');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleConnectionSuccess = () => {
    setIsConnected(true);
    setMode(null); // Reset mode on new connection
    setShowLogsPanel(false);
    setStatusMessage({ text: 'Connected successfully', isError: false });
  };

  const handleDisconnect = async () => {
    try {
      const result = await window.api.disconnectSSH();
      
      if (result.success) {
        setIsConnected(false);
        setMode(null);
        setShowLogsPanel(false);
        setSelectedContainer(null);
        setSelectedFile(null);
        setCurrentPath('.');
        setStatusMessage({ text: result.message, isError: false });
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setStatusMessage({ text: `Error: ${error.message}`, isError: true });
    }
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStatusMessage({ text: '', isError: false });
  };
  
  // Add this new handler for going back to mode selection
  const handleBackToModeSelect = () => {
    setMode(null);
    setShowLogsPanel(false);
    setSelectedContainer(null);
    setSelectedFile(null);
    setCurrentPath('.');
  };

  const handleViewLogs = (container) => {
    setSelectedContainer(container);
    setShowLogsPanel(true);
  };

  const handleBackToContainers = () => {
    setShowLogsPanel(false);
  };
  
  const handleOpenFile = (file) => {
    setSelectedFile(file);
  };
  
  const handleBackToFiles = () => {
    setSelectedFile(null);
  };

  return (
    <div className="container">
      <h1>Docker VM Manager</h1>
      
      <ConnectionPanel 
        onConnectionSuccess={handleConnectionSuccess}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        statusMessage={statusMessage}
        setStatusMessage={setStatusMessage}
      />
      
      {isConnected && !mode && (
        <ModeSelector onModeSelect={handleModeSelect} />
      )}
      
      {isConnected && mode === 'docker' && !showLogsPanel && (
        <ContainerPanel 
          onViewLogs={handleViewLogs}
          onBackToModeSelect={handleBackToModeSelect} // Pass the new handler
          setStatusMessage={setStatusMessage}
        />
      )}
      
      {isConnected && mode === 'docker' && showLogsPanel && selectedContainer && (
        <LogsPanel 
          container={selectedContainer}
          onBack={handleBackToContainers}
          setStatusMessage={setStatusMessage}
        />
      )}
      
      {isConnected && mode === 'files' && !selectedFile && (
        <FileBrowser 
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          onOpenFile={handleOpenFile}
          onBackToModeSelect={handleBackToModeSelect} // Also add to FileBrowser
          setStatusMessage={setStatusMessage}
        />
      )}
      
      {isConnected && mode === 'files' && selectedFile && (
        <FileEditor 
          file={selectedFile}
          onBack={handleBackToFiles}
          setStatusMessage={setStatusMessage}
        />
      )}
    </div>
  );
};

export default App;