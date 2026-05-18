import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, Download, FileUp } from 'lucide-react';
import { encodeBase64Text, decodeBase64Text, formatBytes } from './utils/base64';

type Mode = 'encode' | 'decode';

function App() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Live Conversion
  useEffect(() => {
    setError(null);
    if (!input) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        setOutput(encodeBase64Text(input));
      } else {
        setOutput(decodeBase64Text(input));
      }
    } catch (err: any) {
      setError(err.message || 'Conversion error');
      setOutput('');
    }
  }, [input, mode]);

  const toggleMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    // Swap input and output for a seamless experience
    setInput(output);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      // Could show a toast here in a full app
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadOutput = () => {
    if (!output) return;
    
    // Determine mime type and extension
    let mimeType = 'text/plain';
    let ext = 'txt';
    let blobData: BlobPart = output;
    
    if (mode === 'decode' && fileName) {
      // If we are decoding a file, we might want to output it as binary or text.
      // For simplicity, we'll download as text unless we implement binary blob creation.
      // But actually, decoding base64 back to binary for download:
      try {
         const cleanedBase64 = input.replace(/\s+/g, '');
         const binString = atob(cleanedBase64);
         const bytes = new Uint8Array(binString.length);
         for (let i = 0; i < binString.length; i++) {
           bytes[i] = binString.charCodeAt(i);
         }
         blobData = bytes;
         mimeType = 'application/octet-stream';
         ext = 'bin'; // Generic binary extension if original is unknown
      } catch (e) {
         // Fallback to text
      }
    }

    const blob = new Blob([blobData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `converted_${fileName}` : `converted_result.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 10MB limit
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setError(`File is too large. Maximum size is ${formatBytes(MAX_SIZE)}.`);
      return;
    }

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        if (mode === 'encode') {
          // readAsDataURL gives "data:mime/type;base64,..."
          const base64Data = result.split(',')[1];
          if (base64Data) {
            // Put original file content representation into input might freeze if too large
            // So we'll just set the output directly for file encode
            setInput(`[File: ${file.name}]`);
            setOutput(base64Data);
          } else {
            setError('Failed to extract base64 from file.');
          }
        } else {
          // readAsText gives standard string text
          setInput(result);
        }
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    if (mode === 'encode') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    // Reset file input so same file can be uploaded again if cleared
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Generate obfuscated footer text
  const getFooterText = () => {
    // "© 2026 Nocto Base64. All rights reserved."
    const charCodes = [169, 32, 50, 48, 50, 54, 32, 78, 111, 99, 116, 111, 32, 66, 97, 115, 101, 54, 52, 46, 32, 65, 108, 108, 32, 114, 105, 103, 104, 116, 115, 32, 114, 101, 115, 101, 114, 118, 101, 100, 46];
    return String.fromCharCode(...charCodes);
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-area">
          <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: 0 }}>
            <span>Noc</span>Base
          </h1>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <h1 className="hero-title">
            <span>Base64</span> Encoder & Decoder
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            A premium, fast, and secure tool for converting your data formats.
          </p>
        </section>

        <div className="mode-toggle">
          <div className="toggle-container">
            <button 
              className={`toggle-btn ${mode === 'encode' ? 'active' : ''}`}
              onClick={() => mode !== 'encode' && toggleMode()}
            >
              Encode
            </button>
            <button 
              className={`toggle-btn ${mode === 'decode' ? 'active' : ''}`}
              onClick={() => mode !== 'decode' && toggleMode()}
            >
              Decode
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <div 
            className="file-dropzone" 
            onClick={triggerFileInput}
          >
            <FileUp size={48} className="icon" />
            <h3>Click or drag a file to upload</h3>
            <p>Maximum file size: 10MB.</p>
            {fileName && <p style={{ color: 'var(--success)', marginTop: '1rem' }}>Selected: {fileName}</p>}
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              onChange={handleFileUpload} 
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
              {error}
            </div>
          )}

          <div className="editors-grid">
            <div className="editor-pane">
              <div className="editor-header">
                <span>Input ({mode === 'encode' ? 'Text/File' : 'Base64'})</span>
                <div className="editor-actions">
                  <button className="action-btn" onClick={clearAll} title="Clear All">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <textarea 
                className="code-editor"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'encode' ? 'Type or paste your text here...' : 'Paste your Base64 string here...'}
              />
            </div>

            <div className="editor-pane">
              <div className="editor-header">
                <span>Output ({mode === 'encode' ? 'Base64' : 'Text/File'})</span>
                <div className="editor-actions">
                  <button className="action-btn" onClick={copyToClipboard} title="Copy to Clipboard">
                    <Copy size={16} />
                  </button>
                  <button className="action-btn" onClick={downloadOutput} title="Download Result">
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <textarea 
                className="code-editor"
                value={output}
                readOnly
                placeholder="Result will appear here..."
              />
            </div>
          </div>
        </div>
      </main>

      <footer>
        {getFooterText()}
      </footer>
    </div>
  );
}

export default App;
