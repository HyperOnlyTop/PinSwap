import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.success) {
      toast.success('Yêu cầu đổi mật khẩu đã được xử lý. Kiểm tra email.');
      setResult(res.data);
    } else {
      toast.error(res.error || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Quên mật khẩu</h1>
            <p>Nhập email liên kết với tài khoản để nhận hướng dẫn đổi mật khẩu</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success w-100" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}</button>
            </div>
          </form>

          {result && (
            <div style={{ marginTop: 16 }}>
              <h4>DEBUG (dev):</h4>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
