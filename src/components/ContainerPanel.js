import React, { useState, useEffect } from 'react';
import ContainerItem from './ContainerItem';

const ContainerPanel = ({ onViewLogs, onBackToModeSelect, setStatusMessage }) => {
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadContainers = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.listContainers();
      
      if (result.success) {
        setContainers(result.containers);
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setStatusMessage({ text: `Error: ${error.message}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Load containers when the component mounts
  useEffect(() => {
    loadContainers();
  }, []);

  return (
    <div className="panel">
      <h2>Docker Containers</h2>
      <div className="container-panel-header">
        <button 
          className="btn primary"
          onClick={loadContainers}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh List'}
        </button>
        
        {/* Add the back button */}
        <button
          className="btn secondary"
          onClick={onBackToModeSelect}
        >
          Back to Mode Selection
        </button>
      </div>
      
      {containers.length > 0 ? (
        <div className="container-list-wrapper">
          <table className="container-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Image</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map(container => (
                <ContainerItem 
                  key={container.id}
                  container={container}
                  onViewLogs={onViewLogs}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-containers">
          {isLoading ? 'Loading containers...' : 'No containers found'}
        </div>
      )}
    </div>
  );
};

export default ContainerPanel;