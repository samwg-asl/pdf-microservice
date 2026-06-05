import React, { useRef, useState } from 'react';
import WebFormQuillEditor from './components/QuillEditor';

const App = () => {
  const [range, setRange] = useState();
  const [lastChange, setLastChange] = useState();
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");

  const handleDownloadPdf = async () => {
    if (!editorHtml) {
      alert("Please write something in the editor first!");
      return;
    }

    setLoading(true);

    try {
      // Points directly to your running .NET Docker microservice PoC port
      const response = await fetch('http://localhost:5005/api/pdf/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Match the DTO request wrapper object configuration
        body: JSON.stringify(editorHtml), 
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      // Process the binary response stream into a downloadable file link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `quill-document-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up DOM space
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("PDF Export Failed:", error);
      alert("Could not generate PDF. Make sure your .NET Docker container is running on port 5005.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="app-container">
      <h1>Rich Text PDF Export Workspace</h1>
      <p style={{ color: '#666' }}>Type formatting into the editor below and hit export to test PuppeteerSharp rendering logic.</p>
      
      <div className="editor-wrapper">
        <WebFormQuillEditor value={"nothing"} disabled={false} onChange={setEditorHtml} />
      </div>

      <button 
        className="export-btn" 
        onClick={handleDownloadPdf} 
        disabled={loading}
      >
        {loading ? 'Generating Crisp PDF...' : 'Export PDF (1:1 Style Match)'}
      </button>
    </div>
  );
};

export default App;