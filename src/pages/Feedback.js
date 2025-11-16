import React, { useState, useEffect } from 'react';
import './Feedback.css';
import { useAuth } from '../contexts/AuthContext';

export default function Feedback() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) return setError('Vui lòng nhập phản hồi.');
    setLoading(true); setError(null); setSuccess(null);
    try {
      const body = { message: message.trim() };
      const userId = user && (user._id || user.id);
      if (userId) body.userId = userId;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Lỗi server');
      setSuccess('Cảm ơn phản hồi của bạn!');
      setMessage('');
      // refresh history if logged in
      if (user && (user._id || user.id)) fetchHistory();
    } catch (err) {
      setError(err.message || 'Gửi thất bại');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const userId = user && (user._id || user.id);
    if (!user || !userId) return;
    setHistoryLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/feedback/me', { headers });
      if (!res.ok) {
        setHistory([]);
        return;
      }
      const data = await res.json();
      // API may return { items, total } if paginated or array
      if (Array.isArray(data)) setHistory(data);
      else if (data.items) setHistory(data.items);
      else setHistory([]);
    } catch (err) {
      console.error('fetchHistory error', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user && user._id) fetchHistory();
  }, [user]);

  return (
    <div className="feedback-page container">
      <div className="feedback-card">
        <div className="feedback-header">
          <div>
            <h2>Gửi phản hồi</h2>
            <div className="feedback-intro">Chúng tôi trân trọng mọi góp ý để cải thiện Pin Swap.</div>
          </div>
        </div>

        <div className="feedback-form">
          <textarea
            className="feedback-input"
            placeholder="Viết phản hồi của bạn ở đây..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          <div className="feedback-actions">
            <button className="btn btn-secondary" onClick={() => setMessage('')}>Xóa</button>
            <button className="btn btn-primary" onClick={send} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>

          {error && <div className="feedback-error">{error}</div>}
          {success && <div className="feedback-success">{success}</div>}
        </div>

        {user && (
          <div className="feedback-history">
            <h3>Lịch sử phản hồi của bạn</h3>
            {historyLoading && <div>Đang tải...</div>}
            {!historyLoading && history.length === 0 && <div>Bạn chưa gửi phản hồi nào.</div>}
            {!historyLoading && history.map(h => (
              <div key={h._id} className="feedback-item">
                <div className="feedback-meta">{(h.createdAt || '').slice(0,19).replace('T',' ')}</div>
                <div className="feedback-message">{h.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
