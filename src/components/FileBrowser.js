import React, { useState, useEffect } from 'react';

// Use our own path joining function to avoid path module issues
const joinPaths = (path1, path2) => {
  if (path1.endsWith('/')) {
    return path1 + path2;
  } else {
    return path1 + '/' + path2;
  }
};

const FileBrowser = ({ currentPath, setCurrentPath, onOpenFile, onBackToModeSelect, setStatusMessage }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pathHistory, setPathHistory] = useState(['']);
  
  const loadDirectory = async (path) => {
    setIsLoading(true);
    try {
      const result = await window.api.listDirectory(path);
      
      if (result.success) {
        setEntries(result.entries);
        setCurrentPath(result.currentPath);
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setStatusMessage({ text: `Error: ${error.message}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadDirectory(currentPath);
  }, []);
  
  const handleEntryClick = (entry) => {
    if (entry.isDirectory) {
      const newPath = joinPaths(currentPath, entry.name);
      setPathHistory([...pathHistory, currentPath]);
      loadDirectory(newPath);
    } else if (entry.isFile) {
      onOpenFile({
        name: entry.name,
        path: joinPaths(currentPath, entry.name),
      });
    }
  };
  
  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      loadDirectory(previousPath);
    }
  };
  
  const handleRefresh = () => {
    loadDirectory(currentPath);
  };

  return (
    <div className="panel">
      <h2>File Browser</h2>
      
      <div className="file-browser-header">
        <button 
          className="btn secondary"
          onClick={handleGoBack}
          disabled={pathHistory.length === 0}
        >
          Back
        </button>
        <button 
          className="btn secondary"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </button>
        {/* Add the back to mode selection button */}
        <button
          className="btn secondary"
          onClick={onBackToModeSelect}
        >
          Back to Mode Selection
        </button>
        <div className="current-path">
          Current path: <strong>{currentPath || '/'}</strong>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading directory contents...</div>
      ) : (
        <div className="file-list-wrapper">
          <table className="file-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr 
                  key={index} 
                  className="file-entry"
                  onClick={() => handleEntryClick(entry)}
                >
                  <td>
                    <span className="file-icon">
                      {entry.isDirectory ? '📁' : entry.isFile ? '📄' : '❓'}
                    </span>
                  </td>
                  <td>{entry.name}</td>
                  <td>{entry.permissions}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan="3" className="no-entries">
                    No files or directories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FileBrowser;