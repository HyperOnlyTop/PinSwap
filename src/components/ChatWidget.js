import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

export default function ChatWidget({
  apiBase = "http://localhost:5000"

}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `sess-${Date.now()}`);

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Load old messages
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`chat:${sessionId}`);
      if (raw) setMessages(JSON.parse(raw));
    } catch (_) {}
  }, [sessionId]);

  // Save messages
  useEffect(() => {
    try {
      localStorage.setItem(`chat:${sessionId}`, JSON.stringify(messages));
    } catch (_) {}
  }, [messages, sessionId]);

  // Auto focus textarea
  useEffect(() => {
    if (open && textareaRef.current) textareaRef.current.focus();
  }, [open]);

  // --- SEND MESSAGE ---
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput('');
    setError(null);

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      time: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text })
      });

      // Nếu server lỗi (500, 404, 401…)
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi server');
      }

      const data = await res.json();

      const botText = data?.reply || 'Không có phản hồi từ mô hình.';
      const botMsg = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        text: botText,
        time: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Không thể kết nối tới server chat');

      setMessages(prev => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'assistant',
          text: '⚠ Lỗi kết nối tới server. Vui lòng thử lại.',
          time: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = e => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(200, ta.scrollHeight) + 'px';
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(`chat:${sessionId}`);
    } catch (_) {}
  };

  return (
    <div className={`chat-widget ${open ? 'open' : ''}`}>
      {/* Floating button */}
      <div className="chat-button" onClick={() => setOpen(o => !o)}>
        <div className="chat-button-icon">💬</div>
      </div>

      {/* Chat panel */}
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-title">Trợ lý AI</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chat-clear" onClick={clearChat}>
              Xóa
            </button>
            <button className="chat-close" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        <div className="chat-body" ref={messagesRef}>
          {messages.length === 0 && (
            <div className="chat-empty">Xin chào — bạn muốn hỏi gì về Pin Swap?</div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`chat-message ${m.role}`}>
              <div className="chat-message-text">{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-message-text">Đang suy nghĩ...</div>
            </div>
          )}

          {error && <div className="chat-error">{error}</div>}
        </div>

        <div className="chat-footer">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Gõ câu hỏi..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <button
            className="chat-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
}
