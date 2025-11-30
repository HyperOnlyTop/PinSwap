import React, { useState } from 'react';
import './SubscribeForm.css';

const SubscribeForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!email) return setStatus({ type: 'error', text: 'Vui lòng nhập email' });
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data && data.message ? data.message : 'Lỗi');
      setStatus({ type: 'success', text: data.message || 'Kiểm tra email để xác nhận.' });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Lỗi khi gửi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscribe">
      <form onSubmit={submit} className="subscribe-form">
        <input
          type="email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Đang gửi…' : 'Đăng ký'}</button>
      </form>
      {status && (
        <div className={`subscribe-status ${status.type === 'error' ? 'error' : 'success'}`}>
          {status.text}
        </div>
      )}
    </div>
  );
};

export default SubscribeForm;
