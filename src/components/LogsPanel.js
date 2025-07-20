import React, { useState } from 'react';
import { format } from 'date-fns';

const LogsPanel = ({ container, onBack, setStatusMessage }) => {
  const [timeRange, setTimeRange] = useState({
    startTime: format(new Date(Date.now() - 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTimeRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      const result = await window.api.exportLogs({
        containerId: container.id,
        startTime: timeRange.startTime ? new Date(timeRange.startTime).toISOString() : '',
        endTime: timeRange.endTime ? new Date(timeRange.endTime).toISOString() : ''
      });
      
      if (result.success) {
        setStatusMessage({ text: result.message, isError: false });
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setStatusMessage({ text: `Error: ${error.message}`, isError: true });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="panel">
      <h2>Container Logs</h2>
      
      <div className="container-info">
        <p><strong>Container:</strong> {container.name} ({container.id.substring(0, 12)})</p>
        <p><strong>Image:</strong> {container.image}</p>
        <p><strong>Status:</strong> {container.status}</p>
      </div>
      
      <div className="time-range-section">
        <h3>Export Time Range</h3>
        <div className="form-group">
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={timeRange.startTime}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="endTime">End Time:</label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={timeRange.endTime}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="button-group">
        <button 
          className="btn primary"
          onClick={handleExportLogs}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export Logs'}
        </button>
        <button 
          className="btn secondary"
          onClick={onBack}
        >
          Back to Containers
        </button>
      </div>
    </div>
  );
};

export default LogsPanel;