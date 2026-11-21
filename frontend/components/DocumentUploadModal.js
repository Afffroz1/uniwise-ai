import { useState, useEffect } from 'react';
import { Upload, FileText, Globe, ListFilter, X, Trash2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DocumentUploadModal({ isOpen, onClose, onDocumentAdded }) {
  const [tab, setTab] = useState('pdf');
  const [documents, setDocuments] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', error: false });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfProg, setPdfProg] = useState('ALL');

  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textProg, setTextProg] = useState('ALL');

  const [urlInput, setUrlInput] = useState('');
  const [urlProg, setUrlProg] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  async function fetchDocuments() {
    try {
      const res = await fetch(`${API}/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
      setTotalChunks(data.total_chunks || 0);
    } catch (e) {
      console.error(e);
    }
  }

  async function handlePdfUpload(e) {
    e.preventDefault();
    if (!pdfFile) return;
    setLoading(true);
    setStatusMsg({ text: '', error: false });

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('programme', pdfProg);
    if (pdfTitle.trim()) formData.append('source_title', pdfTitle.trim());

    try {
      const res = await fetch(`${API}/documents/upload-pdf`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setStatusMsg({ text: `${data.message} (${data.chunks_created} vector chunks created)`, error: false });
      setPdfFile(null);
      setPdfTitle('');
      fetchDocuments();
      if (onDocumentAdded) onDocumentAdded();
    } catch (err) {
      setStatusMsg({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleTextSubmit(e) {
    e.preventDefault();
    if (!textTitle.trim() || !textContent.trim()) return;
    setLoading(true);
    setStatusMsg({ text: '', error: false });

    try {
      const res = await fetch(`${API}/documents/add-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: textTitle.trim(),
          text: textContent.trim(),
          programme: textProg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setStatusMsg({ text: `${data.message} (${data.chunks_created} vector chunks created)`, error: false });
      setTextTitle('');
      setTextContent('');
      fetchDocuments();
      if (onDocumentAdded) onDocumentAdded();
    } catch (err) {
      setStatusMsg({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlSubmit(e) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setLoading(true);
    setStatusMsg({ text: '', error: false });

    try {
      const res = await fetch(`${API}/documents/add-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          programme: urlProg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Scraping failed');
      setStatusMsg({ text: `${data.message} (${data.chunks_created} vector chunks created)`, error: false });
      setUrlInput('');
      fetchDocuments();
      if (onDocumentAdded) onDocumentAdded();
    } catch (err) {
      setStatusMsg({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sourceName) {
    if (!confirm(`Delete document "${sourceName}" from RAG index?`)) return;
    try {
      const res = await fetch(`${API}/documents/${encodeURIComponent(sourceName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDocuments();
        if (onDocumentAdded) onDocumentAdded();
      }
    } catch (e) {
      alert('Could not delete document.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-amu-border">
        
        {/* Header */}
        <div className="bg-amu-primary text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm tracking-wide uppercase">Knowledge Base & Document Ingestion</h2>
            <p className="text-[11px] text-white/80 mt-0.5">Upload PDF circulars, syllabi, or enter URLs into RAG vector index</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-medium">
          <button
            onClick={() => { setTab('pdf'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${tab === 'pdf' ? 'border-amu-primary text-amu-primary bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
          <button
            onClick={() => { setTab('text'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${tab === 'text' ? 'border-amu-primary text-amu-primary bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Notice</span>
          </button>
          <button
            onClick={() => { setTab('url'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${tab === 'url' ? 'border-amu-primary text-amu-primary bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ingest URL</span>
          </button>
          <button
            onClick={() => { setTab('list'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${tab === 'list' ? 'border-amu-primary text-amu-primary bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Indexed Documents ({documents.length})</span>
          </button>
        </div>

        {/* Status */}
        {statusMsg.text && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-xs font-medium ${statusMsg.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'pdf' && (
            <form onSubmit={handlePdfUpload} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload official university PDF circulars, lab manuals, or syllabi. The system will parse text, chunk into vector embeddings, and update the RAG index.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select PDF File</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={e => setPdfFile(e.target.files[0])}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amu-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title (Optional)</label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={e => setPdfTitle(e.target.value)}
                    placeholder="e.g. MCA 3rd Sem Lab Manual"
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amu-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Programme Filter</label>
                  <select
                    value={pdfProg}
                    onChange={e => setPdfProg(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amu-primary"
                  >
                    <option value="ALL">All Programmes</option>
                    <option value="MCA">MCA</option>
                    <option value="FYUP">FYUP</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !pdfFile}
                className="w-full bg-amu-primary hover:bg-amu-dark text-white text-xs font-medium py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Parsing and Chunking Document...' : 'Ingest Document into RAG'}
              </button>
            </form>
          )}

          {tab === 'text' && (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <p className="text-xs text-gray-500">
                Paste official announcements, exam dates, or departmental notices directly.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder="e.g. End Semester Practical Schedule Nov 2025"
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amu-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notice Content</label>
                <textarea
                  required
                  rows={5}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder="Paste the full circular text or regulations here..."
                  className="w-full text-xs border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-amu-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !textTitle.trim() || !textContent.trim()}
                className="w-full bg-amu-primary hover:bg-amu-dark text-white text-xs font-medium py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Chunking and Indexing...' : 'Index Notice into Knowledge Base'}
              </button>
            </form>
          )}

          {tab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <p className="text-xs text-gray-500">
                Enter an official AMU circular URL (web page or direct PDF link).
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">AMU Web Page or PDF URL</label>
                <input
                  type="url"
                  required
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://amu.ac.in/notices/exam-dates.pdf"
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amu-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="w-full bg-amu-primary hover:bg-amu-dark text-white text-xs font-medium py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Scraping and Indexing...' : 'Scrape and Add to RAG'}
              </button>
            </form>
          )}

          {tab === 'list' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Total Documents: {documents.length}</span>
                <span>Total Chunks in Index: {totalChunks}</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {documents.map((doc, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:border-amu-primary/50 transition flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{doc.source}</span>
                        {doc.is_custom && (
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">Custom</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{doc.preview}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                        <span>Chunks: {doc.chunks_count}</span>
                        <span>Programme: {doc.programme}</span>
                      </div>
                    </div>
                    {doc.is_custom && (
                      <button
                        onClick={() => handleDelete(doc.source)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-4 py-1.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
