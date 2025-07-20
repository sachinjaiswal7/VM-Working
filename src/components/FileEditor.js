import React, { useState, useEffect } from 'react';

const FileEditor = ({ file, onBack, setStatusMessage }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const loadFile = async () => {
      try {
        const result = await window.api.readFile(file.path);
        
        if (result.success) {
          setContent(result.content);
        } else {
          setStatusMessage({ text: result.message, isError: true });
        }
      } catch (error) {
        setStatusMessage({ text: `Error: ${error.message}`, isError: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFile();
  }, [file]);
  
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await window.api.writeFile({
        filePath: file.path,
        content: content
      });
      
      if (result.success) {
        setStatusMessage({ text: 'File saved successfully', isError: false });
      } else {
        setStatusMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      setStatusMessage({ text: `Error: ${error.message}`, isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel file-editor">
      <h2>File Editor</h2>
      
      <div className="file-info">
        <p><strong>File:</strong> {file.name}</p>
        <p><strong>Path:</strong> {file.path}</p>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading file content...</div>
      ) : (
        <>
          <div className="editor-wrapper">
            <textarea
              className="file-content-editor"
              value={content}
              onChange={handleContentChange}
              rows={20}
            />
          </div>
          
          <div className="button-group">
            <button 
              className="btn primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="btn secondary"
              onClick={onBack}
            >
              Back to Files
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileEditor;