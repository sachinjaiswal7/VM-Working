import React from 'react';

const ContainerItem = ({ container, onViewLogs }) => {
  return (
    <tr>
      <td>{container.id.substring(0, 12)}</td>
      <td>{container.name}</td>
      <td>{container.image}</td>
      <td>{container.status}</td>
      <td>
        <button 
          className="btn secondary sm"
          onClick={() => onViewLogs(container)}
        >
          View Logs
        </button>
      </td>
    </tr>
  );
};

export default ContainerItem;