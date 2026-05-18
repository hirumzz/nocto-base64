import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, Download, FileUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { encodeBase64Text, advancedDecodeBase64Text, formatBytes } from './utils/base64';
import type { EncodeOptions } from './utils/base64';

type Mode = 'encode' | 'decode';

function App() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Options State
  const [charset, setCharset] = useState('UTF-8');
  const [newline, setNewline] = useState('\n');
  const [encodeEachLine, setEncodeEachLine] = useState(false);
  const [splitChunks, setSplitChunks] = useState(false);
  const [urlSafe, setUrlSafe] = useState(false);
  const [k8sSecret, setK8sSecret] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getOptions = (): EncodeOptions => ({
    newlineSeparator: newline,
    encodeEachLine,
    splitChunks,
    urlSafe,
    k8sSecret,
    charset
  });

  const performConversion = (textToConvert = input) => {
    setError(null);
    if (!textToConvert) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        setOutput(encodeBase64Text(textToConvert, getOptions()));
      } else {
        setOutput(advancedDecodeBase64Text(textToConvert, getOptions()));
      }
    } catch (err: any) {
      setError(err.message || 'Conversion error');
      setOutput('');
    }
  };

  // Handle Live Conversion
  useEffect(() => {
    if (liveMode) {
      performConversion();
    }
  }, [input, mode, charset, newline, encodeEachLine, splitChunks, urlSafe, k8sSecret, liveMode]);

  const toggleMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput('');
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
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadOutput = () => {
    if (!output) return;
    let mimeType = 'text/plain';
    let ext = 'txt';
    let blobData: BlobPart = output;
    
    if (mode === 'decode' && fileName) {
      try {
         let cleanedBase64 = input.replace(/\s+/g, '');
         cleanedBase64 = cleanedBase64.replace(/-/g, '+').replace(/_/g, '/');
         const binString = atob(cleanedBase64);
         const bytes = new Uint8Array(binString.length);
         for (let i = 0; i < binString.length; i++) {
           bytes[i] = binString.charCodeAt(i);
         }
         blobData = bytes;
         mimeType = 'application/octet-stream';
         ext = 'bin'; 
      } catch (e) {}
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
          const base64Data = result.split(',')[1];
          if (base64Data) {
            setInput(`[File: ${file.name}]`);
            setOutput(base64Data);
          } else {
            setError('Failed to extract base64 from file.');
          }
        } else {
          setInput(result);
          if (liveMode) performConversion(result);
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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFooterText = () => {
    const charCodes = [169, 32, 50, 48, 50, 54, 32, 104, 105, 114, 117, 109, 122, 122, 45, 115, 105, 110, 100, 104, 117];
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
          {/* Side-by-Side Editors */}
          <div className="editors-grid" style={{ marginBottom: '1.5rem' }}>
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

          {/* Options Panel */}
          <div className="options-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="options-row">
              <select value={charset} onChange={e => setCharset(e.target.value)} className="glass-select">
                <option value="UTF-8">UTF-8</option>
              </select>
              <span className="option-desc">Destination character set.</span>
            </div>

            <div className="options-row">
              <select value={newline} onChange={e => setNewline(e.target.value)} className="glass-select">
                <option value="\n">LF (Unix)</option>
                <option value="\r\n">CRLF (Windows)</option>
              </select>
              <span className="option-desc">Destination newline separator.</span>
            </div>

            <div className="options-row checkbox-row">
              <label className="checkbox-container">
                <input type="checkbox" checked={encodeEachLine} onChange={e => setEncodeEachLine(e.target.checked)} />
                <span className="checkmark"></span>
                <span className="option-desc">Encode each line separately (useful for when you have multiple entries).</span>
              </label>
            </div>

            <div className="options-row checkbox-row">
              <label className="checkbox-container">
                <input type="checkbox" checked={splitChunks} onChange={e => setSplitChunks(e.target.checked)} />
                <span className="checkmark"></span>
                <span className="option-desc">Split lines into 76 character wide chunks (useful for MIME).</span>
              </label>
            </div>

            <div className="options-row checkbox-row">
              <label className="checkbox-container">
                <input type="checkbox" checked={urlSafe} onChange={e => setUrlSafe(e.target.checked)} />
                <span className="checkmark"></span>
                <span className="option-desc">Perform URL-safe encoding (uses Base64URL format).</span>
              </label>
            </div>

            <div className="options-row checkbox-row" style={{ display: 'flex', alignItems: 'center' }}>
              <label className="checkbox-container">
                <input type="checkbox" checked={k8sSecret} onChange={e => setK8sSecret(e.target.checked)} />
                <span className="checkmark"></span>
                <span className="option-desc">Kubernetes Secret / Env mode (encode only values of Key-Value pairs).</span>
              </label>
              <div className="tooltip-container">
                <span className="tooltip-icon">?</span>
                <div className="tooltip-content">
                  Converts <code>KEY=value</code> or <code>KEY: value</code> into standard Kubernetes YAML <code>KEY: base64(value)</code>.
                </div>
              </div>
            </div>

            <div className="options-row action-row">
              <button 
                className={`live-mode-toggle ${liveMode ? 'on' : 'off'}`} 
                onClick={() => setLiveMode(!liveMode)}
              >
                <span className="indicator"></span>
                Live mode {liveMode ? 'ON' : 'OFF'}
              </button>
              <span className="option-desc">Encodes in real-time as you type or paste (supports only the UTF-8 character set).</span>
            </div>

            {!liveMode && (
              <div className="options-row" style={{ marginTop: '1rem' }}>
                <button className="primary-action-btn convert-btn" onClick={() => performConversion()}>
                  {mode === 'encode' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                  {mode.toUpperCase()}
                  {mode === 'encode' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
                <span className="option-desc" style={{ marginLeft: '1rem' }}>
                  {mode === 'encode' ? 'Encodes your data.' : 'Decodes your data.'}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', margin: '1rem 0', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
              {error}
            </div>
          )}

          {/* File Dropzone placed at the bottom */}
          <div 
            className="file-dropzone" 
            style={{ marginBottom: 0 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp size={48} className="icon" style={{ margin: '0 auto' }} />
            <h3 style={{ margin: '1rem 0 0.5rem' }}>Click or drag a file to upload</h3>
            <p>Maximum size: 10MB</p>
            {fileName && <p style={{ color: 'var(--success)', marginTop: '0.5rem' }}>Selected: {fileName}</p>}
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              onChange={handleFileUpload} 
            />
          </div>

        </div>

        {/* Developer Guide & FAQ for Google SEO Indexing */}
        <section className="developer-guide">
          <h2 className="guide-title">NocBase Developer & FAQ Guide</h2>
          
          <div className="guide-section">
            <h3>What is Base64 Encoding?</h3>
            <p>
              Base64 is a binary-to-text encoding scheme that translates raw binary data into a secure ASCII string format comprising 64 standard characters (<code>A-Z</code>, <code>a-z</code>, <code>0-9</code>, <code>+</code>, and <code>/</code>). This ensures safe data transmission over text-only media channels, preventing parameters from getting scrambled by network routers.
            </p>
          </div>

          <div className="guide-section">
            <h3>Standard vs. URL-Safe Base64 (Base64URL)</h3>
            <p>
              Standard Base64 contains symbols like <code>+</code> and <code>/</code>, which serve special functions in URL parameters, API query filters, and directory structures. URL-safe Base64 (Base64URL) automatically replaces these characters with <code>-</code> and <code>_</code> respectively, and omits the trailing padding sign (<code>=</code>) to produce clean, safe routes. It is standard practice for modern API designs, JWT tokens, and OAuth keys.
            </p>
          </div>

          <div className="guide-section">
            <h3>Kubernetes Secret & Env Converter</h3>
            <p>
              When creating Kubernetes Secret definitions (like YAML data structures) or `.env` files, developers often need to base64 encode individual parameters while keeping the keys intact. Enabling **Kubernetes Secret / Env mode** automatically processes environment variable statements (e.g. <code>DB_PASSWORD=mySecret</code> or <code>DB_HOST: 127.0.0.1</code>), converting the syntax and encoding *only* the values. The output is structured exactly as standard Kubernetes YAML requires: <code>DB_PASSWORD: bXlTZWNyZXQ=</code>.
            </p>
          </div>

          <div className="guide-section">
            <h3>100% Client-Side Privacy & Offline Security</h3>
            <p>
              Security and developer privacy are our core focus. Unlike other online converters, **NocBase performs all conversions 100% locally inside your web browser**. No data is transmitted to an external server or saved database, protecting your raw passwords, secret keys, and payload archives. You can safely cut off your internet connection and convert fully offline!
            </p>
          </div>
        </section>
      </main>

      <footer>
        {getFooterText()}
      </footer>
    </div>
  );
}

export default App;
