import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get('token');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromQuery || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    const res = await resetPassword(token, newPassword);
    setLoading(false);
    if (res.success) {
      toast.success('Mật khẩu đã được đặt lại');
      navigate('/login');
    } else {
      toast.error(res.error || 'Đặt lại mật khẩu thất bại');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Đặt lại mật khẩu</h1>
            <p>Nhập token (nếu có) và mật khẩu mới</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Token</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            <div className="form-actions">
              <button className="btn btn-success w-100" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
