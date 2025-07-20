import React from 'react';

const ModeSelector = ({ onModeSelect }) => {
  return (
    <div className="panel mode-selector">
      <h2>Select Mode</h2>
      <p>Choose what you would like to do with the connected VM:</p>
      
      <div className="mode-options">
        <div 
          className="mode-option"
          onClick={() => onModeSelect('docker')}
        >
          <div className="mode-icon">🐳</div>
          <h3>Docker Containers</h3>
          <p>View and manage Docker containers, export container logs</p>
        </div>
        
        <div 
          className="mode-option"
          onClick={() => onModeSelect('files')}
        >
          <div className="mode-icon">📁</div>
          <h3>Files & Folders</h3>
          <p>Browse the file system, view and edit files</p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;