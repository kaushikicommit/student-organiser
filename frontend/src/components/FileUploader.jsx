import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, File, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'uploadedStudyMaterials';

export default function FileUploader() {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFiles(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const saveToLocalStorage = (newFiles) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles));
    setFiles(newFiles);
  };

  const handleFiles = (fileList) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const newUploads = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
        toast.error(`Skipped ${file.name}: only PDF, .txt, .md files allowed`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        newUploads.push({
          id: Date.now() + i + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result, // base64 or text
          uploadedAt: new Date().toISOString(),
        });
        if (newUploads.length === fileList.length) {
          const updated = [...files, ...newUploads];
          saveToLocalStorage(updated);
          toast.success(`Added ${newUploads.length} file(s)`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteFile = (id) => {
    const updated = files.filter(f => f.id !== id);
    saveToLocalStorage(updated);
    toast.success('File removed');
  };

  const openFile = (file) => {
    if (file.type === 'application/pdf') {
      window.open(file.data, '_blank');
    } else {
      // text files: show in a new tab with content
      const blob = dataURLtoBlob(file.data);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 className="card-title">📄 Study Materials</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Upload PDFs, text files, or notes to keep your study resources in one place.
      </p>

      {/* Drag & drop area */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${dragActive ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: dragActive ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
          cursor: 'pointer',
          marginBottom: '1.5rem',
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.txt,.md';
          input.multiple = true;
          input.onchange = (e) => handleFiles(e.target.files);
          input.click();
        }}
      >
        <Upload size={32} style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }} />
        <p style={{ color: 'var(--text)' }}>Drag & drop files here or click to browse</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Supports PDF, .txt, .md</p>
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <p className="empty-text">No study materials uploaded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.6rem 1rem',
                borderRadius: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                {file.type === 'application/pdf' ? (
                  <FileText size={20} color="#f87171" />
                ) : (
                  <File size={20} color="#a78bfa" />
                )}
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                    {file.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                    {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => openFile(file)}
                  style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                  title="Open"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  title="Delete"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}