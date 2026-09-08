import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  Upload, Send, Bot, User, FileText,
  Sparkles, BookOpen, GraduationCap, ChevronRight, X
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SUGGESTIONS = [
  "Summarize the key topics in this document",
  "What are the most important concepts?",
  "Explain the main ideas in simple terms",
  "Create a quick study guide from this",
];

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="message-enter" style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
      <div style={{
        flexShrink:0, width:36, height:36, borderRadius:10,
        background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        <Bot size={18} color="#818cf8" />
      </div>
      <div className="glass" style={{ borderRadius:16, borderTopLeftRadius:4, padding:'14px 20px', display:'flex', gap:6, alignItems:'center' }}>
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

/* ── Single message ── */
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className="message-enter" style={{ display:'flex', gap:12, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        flexShrink:0, width:36, height:36, borderRadius:10,
        background: isUser ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(99,102,241,0.15)',
        border: isUser ? 'none' : '1px solid rgba(99,102,241,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: isUser ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
      }}>
        {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="#818cf8" />}
      </div>
      <div style={{
        maxWidth:'78%', padding:'12px 18px',
        borderRadius: 16,
        borderTopRightRadius: isUser ? 4 : 16,
        borderTopLeftRadius: isUser ? 16 : 4,
        background: isUser
          ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
          : 'rgba(255,255,255,0.04)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isUser ? '0 4px 20px rgba(99,102,241,0.25)' : 'none',
        color: '#e5e7eb',
        fontSize: '0.875rem',
        lineHeight: '1.6',
      }}>
        {isUser
          ? <p style={{ margin:0, color:'#fff' }}>{msg.content}</p>
          : <div className="dark-prose"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
        }
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [docReady, setDocReady] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.pdf')) { setFile(dropped); setUploadStatus(null); }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadStatus(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API_BASE_URL}/upload`, fd);
      setUploadStatus({ type: 'success', text: res.data.message });
      setDocReady(true);
    } catch (err) {
      setUploadStatus({ type: 'error', text: err?.response?.data?.detail || 'Failed to process PDF.' });
    } finally { setUploading(false); }
  };

  const askQuestion = async (q) => {
    const text = (q || question).trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setQuestion(''); setLoading(true);
    inputRef.current?.focus();
    try {
      const fd = new FormData(); fd.append('question', text);
      const res = await axios.post(`${API_BASE_URL}/chat`, fd);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error connecting to backend. (If on Render, it might be waking up!)';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${detail}` }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askQuestion(); }
  };

  /* ── ROOT LAYOUT ── */
  return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0f', color:'#e5e7eb', overflow:'hidden' }}>

      {/* ───── SIDEBAR ───── */}
      <aside style={{
        width: 272, display:'flex', flexDirection:'column', flexShrink:0,
        background:'rgba(17,17,27,0.9)', borderRight:'1px solid rgba(255,255,255,0.06)',
        backdropFilter:'blur(20px)'
      }}>

        {/* Logo */}
        <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 20px rgba(99,102,241,0.4)'
            }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1rem', color:'#fff', lineHeight:1 }}>StudyBuddy</div>
              <div style={{ fontSize:'0.7rem', color:'#6b7280', marginTop:3 }}>AI Tutor</div>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div style={{ flex:1, padding:16, overflowY:'auto' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:600, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, paddingLeft:4 }}>
            Knowledge Base
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:16, padding:'24px 16px',
              display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
              cursor:'pointer', marginBottom:12,
              background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
              transition:'all 0.2s ease',
            }}
          >
            <div style={{
              width:48, height:48, borderRadius:12, marginBottom:12,
              background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <Upload size={22} color="#818cf8" />
            </div>
            <div style={{ fontSize:'0.8rem', fontWeight:500, color:'#d1d5db' }}>Drop your PDF here</div>
            <div style={{ fontSize:'0.7rem', color:'#4b5563', marginTop:4 }}>or click to browse</div>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => { setFile(e.target.files[0]); setUploadStatus(null); }} style={{ display:'none' }} />
          </div>

          {/* File chip */}
          {file && (
            <div style={{
              display:'flex', alignItems:'center', gap:8, borderRadius:12,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
              padding:'8px 12px', marginBottom:10
            }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FileText size={14} color="#818cf8" />
              </div>
              <span style={{ fontSize:'0.75rem', color:'#d1d5db', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{file.name}</span>
              <button onClick={() => { setFile(null); setUploadStatus(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#4b5563', padding:2 }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              width:'100%', padding:'10px 16px', borderRadius:12, border:'none',
              background: (!file || uploading) ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: (!file || uploading) ? '#6b7280' : '#fff',
              fontSize:'0.8rem', fontWeight:600, cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: (!file || uploading) ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
              transition:'all 0.2s ease',
            }}
          >
            {uploading
              ? <><svg style={{ animation:'spin 1s linear infinite', width:16, height:16 }} viewBox="0 0 24 24" fill="none"><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>Processing…</>
              : <><Sparkles size={15} />Embed Document</>
            }
          </button>

          {/* Status */}
          {uploadStatus && (
            <div style={{
              marginTop:10, padding:'10px 14px', borderRadius:10, fontSize:'0.75rem', fontWeight:500,
              background: uploadStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${uploadStatus.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: uploadStatus.type === 'success' ? '#34d399' : '#f87171',
            }}>{uploadStatus.text}</div>
          )}

          {/* Quick questions */}
          {docReady && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:'0.65rem', fontWeight:600, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, paddingLeft:4 }}>
                Quick Questions
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => askQuestion(s)} style={{
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                    borderRadius:10, padding:'9px 12px', textAlign:'left', cursor:'pointer',
                    fontSize:'0.72rem', color:'#9ca3af', display:'flex', alignItems:'center', gap:8,
                    transition:'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#e5e7eb'; e.currentTarget.style.borderColor='rgba(99,102,241,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='#9ca3af'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
                  >
                    <ChevronRight size={13} color="#6366f1" style={{ flexShrink:0 }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:8 }}>
          <BookOpen size={13} color="#374151" />
          <span style={{ fontSize:'0.7rem', color:'#374151' }}>Powered by Ollama · LangChain</span>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{
          padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.06)',
          background:'rgba(10,10,15,0.8)', backdropFilter:'blur(12px)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0
        }}>
          <div>
            <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#fff' }}>
              {docReady ? '📄 Document loaded — ask anything!' : 'Chat'}
            </div>
            <div style={{ fontSize:'0.7rem', color:'#4b5563', marginTop:2 }}>
              {docReady ? 'Answers grounded in your document' : 'Upload a PDF from the sidebar to get started'}
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{
              background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8,
              padding:'6px 12px', color:'#6b7280', fontSize:'0.75rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6
            }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>
          {messages.length === 0 ? (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
              <div style={{
                width:80, height:80, borderRadius:24, marginBottom:24,
                background:'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.2))',
                border:'1px solid rgba(99,102,241,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 40px rgba(99,102,241,0.15)'
              }}>
                <Bot size={36} color="#818cf8" />
              </div>
              <div className="gradient-text" style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Ready to Study?</div>
              <p style={{ color:'#4b5563', fontSize:'0.875rem', maxWidth:320, lineHeight:1.6 }}>
                Upload your lecture notes, textbook chapters, or any PDF and I'll answer your questions instantly.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:28, justifyContent:'center' }}>
                {['Instant answers', 'Cited from your docs', 'No hallucinations', 'Works offline'].map(f => (
                  <span key={f} style={{
                    fontSize:'0.75rem', padding:'6px 14px', borderRadius:9999,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'#6b7280'
                  }}>✦ {f}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth:720, margin:'0 auto', display:'flex', flexDirection:'column', gap:20, paddingBottom:8 }}>
              {messages.map((msg, i) => <Message key={i} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding:'20px 32px', borderTop:'1px solid rgba(255,255,255,0.06)',
          background:'rgba(10,10,15,0.8)', backdropFilter:'blur(12px)', flexShrink:0
        }}>
          <div style={{ maxWidth:720, margin:'0 auto', position:'relative' }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={docReady ? "Ask anything about your document…" : "Upload a PDF first, then ask questions…"}
              style={{
                width:'100%', resize:'none', outline:'none',
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:16, padding:'16px 60px 16px 20px',
                color:'#e5e7eb', fontSize:'0.875rem', lineHeight:'1.6',
                fontFamily:'Inter, sans-serif', minHeight:56, maxHeight:120,
                transition:'border-color 0.2s',
                boxSizing:'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={() => askQuestion()}
              disabled={!question.trim() || loading}
              style={{
                position:'absolute', right:10, bottom:10, width:40, height:40,
                borderRadius:12, border:'none', cursor: (!question.trim() || loading) ? 'not-allowed' : 'pointer',
                background: (!question.trim() || loading)
                  ? 'rgba(99,102,241,0.2)'
                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: (!question.trim() || loading) ? 'none' : '0 4px 15px rgba(99,102,241,0.4)',
                transition:'all 0.2s ease',
              }}
            >
              <Send size={16} color={(!question.trim() || loading) ? '#4b5563' : '#fff'} />
            </button>
          </div>
          <div style={{ textAlign:'center', fontSize:'0.7rem', color:'#374151', marginTop:8 }}>
            Press <kbd style={{ background:'#1f2937', color:'#6b7280', padding:'2px 6px', borderRadius:4, fontSize:'0.65rem' }}>Enter</kbd> to send
            · <kbd style={{ background:'#1f2937', color:'#6b7280', padding:'2px 6px', borderRadius:4, fontSize:'0.65rem' }}>Shift+Enter</kbd> for newline
          </div>
        </div>
      </main>
    </div>
  );
}
