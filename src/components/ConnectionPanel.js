import React, { useState, useEffect } from 'react';

const ConnectionPanel = ({ onConnectionSuccess, onDisconnect, isConnected, statusMessage, setStatusMessage }) => {
  const [credentials, setCredentials] = useState({
    host: '',
    port: 22,
    username: '',
    password: ''
  });

  // Load last connection details on component mount
  useEffect(() => {
    const loadLastConnection = async () => {
      try {
        const lastConnection = await window.api.getLastConnection();
        setCredentials(prev => ({ 
          ...prev, 
          ...lastConnection 
        }));
      } catch (error) {
        console.error("Failed to load last connection:", error);
      }
    };

    loadLastConnection();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ 
      ...prev, 
      [name]: name === 'port' ? Number(value) : value 
    }));
  };

  const handleConnect = async () => {
    // Basic validation
    if (!credentials.host || !credentials.username || !credentials.password) {
      setStatusMessage({ text: 'Please fill in all required fields', isError: true });
      return;
    }
    
    try {
      const result = await window.api.connectSSH(credentials);
      
      if (result.success) {
        onConnectionSuccess();
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setStatusMessage({ text: `Error: ${error.message}`, isError: true });
    }
  };

  return (
    <div className="panel">
      <h2>SSH Connection</h2>
      <div className="form-group">
        <label htmlFor="host">Host:</label>
        <input
          type="text"
          id="host"
          name="host"
          value={credentials.host}
          onChange={handleChange}
          placeholder="hostname or IP"
          disabled={isConnected}
        />
      </div>
      <div className="form-group">
        <label htmlFor="port">Port:</label>
        <input
          type="number"
          id="port"
          name="port"
          value={credentials.port}
          onChange={handleChange}
          disabled={isConnected}
        />
      </div>
      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          disabled={isConnected}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          disabled={isConnected}
        />
      </div>
      <div className="button-group">
        <button 
          className="btn primary" 
          onClick={handleConnect}
          disabled={isConnected}
        >
          Connect
        </button>
        <button 
          className="btn secondary" 
          onClick={onDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
      </div>
      
      {statusMessage.text && (
        <div className={`status-message ${statusMessage.isError ? 'error' : 'success'}`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;