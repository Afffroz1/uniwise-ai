import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DocumentUploadModal({ isOpen, onClose, onDocumentAdded }) {
  const [tab, setTab] = useState('pdf'); // 'pdf' | 'text' | 'url' | 'list'
  const [documents, setDocuments] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', error: false });

  // PDF Form
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfProg, setPdfProg] = useState('ALL');

  // Text Form
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textProg, setTextProg] = useState('ALL');

  // URL Form
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
      setStatusMsg({ text: `✅ ${data.message} (${data.chunks_created} chunks)`, error: false });
      setPdfFile(null);
      setPdfTitle('');
      fetchDocuments();
      if (onDocumentAdded) onDocumentAdded();
    } catch (err) {
      setStatusMsg({ text: `❌ ${err.message}`, error: true });
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
      setStatusMsg({ text: `✅ ${data.message} (${data.chunks_created} chunks)`, error: false });
      setTextTitle('');
      setTextContent('');
      fetchDocuments();
      if (onDocumentAdded) onDocumentAdded();
    } catch (err) {
      setStatusMsg({ text: `❌ ${err.message}`, error: true });
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
      setStatusMsg({ text: `✅ ${data.message} (${data.chunks_created} chunks)`, error: false });
      setUrlInput('');
      fetchDocuments();
      if (onDocumentAdded) onDocumentAdded();
    } catch (err) {
      setStatusMsg({ text: `❌ ${err.message}`, error: true });
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-amu-green text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📂</span>
            <div>
              <h2 className="font-bold text-lg">RAG Knowledge Base & Document Ingestion</h2>
              <p className="text-xs text-white/80">Add PDFs, AMU Circulars, or Web Links for RAG retrieval</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-sm font-medium">
          <button
            onClick={() => { setTab('pdf'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${tab === 'pdf' ? 'border-amu-green text-amu-green bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📄 Upload PDF
          </button>
          <button
            onClick={() => { setTab('text'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${tab === 'text' ? 'border-amu-green text-amu-green bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📝 Paste Notice
          </button>
          <button
            onClick={() => { setTab('url'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${tab === 'url' ? 'border-amu-green text-amu-green bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🌐 Ingest URL
          </button>
          <button
            onClick={() => { setTab('list'); setStatusMsg({ text: '', error: false }); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${tab === 'list' ? 'border-amu-green text-amu-green bg-white font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📚 Indexed ({documents.length})
          </button>
        </div>

        {/* Status Message */}
        {statusMsg.text && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-xs font-medium ${statusMsg.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'pdf' && (
            <form onSubmit={handlePdfUpload} className="space-y-4">
              <p className="text-xs text-gray-500">
                Upload university documents such as syllabus PDFs, examination guidelines, ordinance circulars, or fee notices. They will be auto-parsed and chunked into the vector index.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={e => setPdfFile(e.target.files[0])}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title (Optional)</label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={e => setPdfTitle(e.target.value)}
                    placeholder="e.g. MCA Syllabus 2025"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amu-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Programme Filter</label>
                  <select
                    value={pdfProg}
                    onChange={e => setPdfProg(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amu-green"
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
                className="w-full bg-amu-green hover:bg-amu-dark text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Processing & Chunking PDF...' : '⚡ Ingest PDF into RAG'}
              </button>
            </form>
          )}

          {tab === 'text' && (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <p className="text-xs text-gray-500">
                Paste official announcements, exam dates, or departmental notices directly.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notice / Document Title *</label>
                <input
                  type="text"
                  required
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder="e.g. End Semester Practical Schedule Nov 2025"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notice Content *</label>
                <textarea
                  required
                  rows={5}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder="Paste the full circular text, dates, or regulations here..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !textTitle.trim() || !textContent.trim()}
                className="w-full bg-amu-green hover:bg-amu-dark text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Chunking & Indexing...' : '⚡ Index Notice into Knowledge Base'}
              </button>
            </form>
          )}

          {tab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <p className="text-xs text-gray-500">
                Input an AMU notice URL or online circular (HTML or direct PDF link). UniWise will scrape the text and add it to the hybrid RAG store.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">AMU Web Page or PDF URL *</label>
                <input
                  type="url"
                  required
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://amu.ac.in/notices/exam-dates.pdf"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="w-full bg-amu-green hover:bg-amu-dark text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Scraping & Indexing...' : '🌐 Scrape & Add to RAG'}
              </button>
            </form>
          )}

          {tab === 'list' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                <span>Total Documents: {documents.length}</span>
                <span>Total Chunks in Index: {totalChunks}</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {documents.map((doc, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:border-amu-green transition flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 truncate">{doc.source}</span>
                        {doc.is_custom && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Custom Upload</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.preview}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span>Chunks: <b>{doc.chunks_count}</b></span>
                        <span>Prog: <b>{doc.programme}</b></span>
                      </div>
                    </div>
                    {doc.is_custom && (
                      <button
                        onClick={() => handleDelete(doc.source)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50"
                        title="Delete custom document"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-4 py-2"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
