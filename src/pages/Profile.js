import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { saveProfile } = useAuth();
  const { changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    try {
      const doSave = async () => {
        const res = await saveProfile(formData);
        if (res.success) {
          toast.success('Cập nhật thông tin thành công!');
          setIsEditing(false);
        } else {
          toast.error(res.error || 'Có lỗi xảy ra khi cập nhật');
        }
      };
      doSave();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePickFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleCancelFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      const API = process.env.REACT_APP_API_URL || '';
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch(`${API}/api/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Tải ảnh thất bại');
        setUploading(false);
        return;
      }
      // save profile with avatar url
      const saveRes = await saveProfile({ avatar: data.url });
      if (saveRes.success) {
        toast.success('Cập nhật ảnh đại diện thành công');
        handleCancelFile();
      } else {
        toast.error(saveRes.error || 'Không thể lưu ảnh đại diện');
      }
    } catch (err) {
      toast.error('Lỗi khi tải ảnh: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = () => {
    setShowChangePwd((s) => !s);
  };

  const submitChangePassword = async () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận không khớp');
      return;
    }
    const res = await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
    if (res.success) {
      toast.success(res.message || 'Đổi mật khẩu thành công');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePwd(false);
    } else {
      toast.error(res.error || 'Đổi mật khẩu thất bại');
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="text-center">
            <h2>Vui lòng đăng nhập để xem hồ sơ</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>

        <div className="profile-content">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span className="avatar-text">{(user.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</span>
                )}
                <button className="btn btn-outline" style={{ position: 'absolute', right: -6, bottom: -6 }} onClick={handlePickFile}>Đổi ảnh</button>
              </div>
              <div className="profile-info">
                <h2>{user.name}</h2>
                <p className="profile-email">{user.email}</p>
                <div className="profile-badges">
                  <span className="badge badge-primary">
                    {user.type === 'user' ? 'Người dân' : 
                     user.type === 'business' ? 'Doanh nghiệp' : 'Quản trị viên'}
                  </span>
                  {user.type === 'user' && (
                    <span className="badge badge-success">
                      {user.points} điểm
                    </span>
                  )}
                </div>
              </div>
              <div className="profile-actions">
                {!isEditing ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <FaEdit /> Chỉnh sửa
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      className="btn btn-success"
                      onClick={handleSave}
                    >
                      <FaSave /> Lưu
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancel}
                    >
                      <FaTimes /> Hủy
                    </button>
                  </div>
                )}
                {previewUrl && (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-success" onClick={uploadAvatar} disabled={uploading}>{uploading ? 'Đang tải...' : 'Tải lên'}</button>
                    <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleCancelFile}>Hủy</button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-section">
                <h3>
                  <FaUser /> Thông tin cá nhân
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Họ và tên</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <span>{user.name}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <label>Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                        disabled
                      />
                    ) : (
                      <span>{user.email}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <label>Số điện thoại</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <span>{user.phone || 'Chưa cập nhật'}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <label>Địa chỉ</label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-textarea"
                        rows="3"
                      />
                    ) : (
                      <span>{user.address || 'Chưa cập nhật'}</span>
                    )}
                  </div>
                </div>
              </div>

              {user.type === 'business' && (
                <div className="detail-section">
                  <h3>
                    <FaMapMarkerAlt /> Thông tin doanh nghiệp
                  </h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Tên doanh nghiệp</label>
                      <span>{user.businessName || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Mã số thuế</label>
                      <span>{user.taxCode || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Người liên hệ</label>
                      <span>{user.contactPerson || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Địa chỉ doanh nghiệp</label>
                      <span>{user.businessAddress || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Settings */}
          <div className="settings-card">
            <h3>Cài đặt tài khoản</h3>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Đổi mật khẩu</h4>
                  <p>Cập nhật mật khẩu để bảo mật tài khoản</p>
                </div>
                <div>
                  <button className="btn btn-outline" onClick={handleChangePassword}>Đổi mật khẩu</button>
                  {showChangePwd && (
                    <div className="change-password-form" style={{ marginTop: 12 }}>
                      <input type="password" name="currentPassword" placeholder="Mật khẩu hiện tại" value={pwdForm.currentPassword} onChange={handlePwdChange} className="form-input" />
                      <input type="password" name="newPassword" placeholder="Mật khẩu mới" value={pwdForm.newPassword} onChange={handlePwdChange} className="form-input" style={{ marginTop: 8 }} />
                      <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu mới" value={pwdForm.confirmPassword} onChange={handlePwdChange} className="form-input" style={{ marginTop: 8 }} />
                      <div style={{ marginTop: 8 }}>
                        <button className="btn btn-success" onClick={submitChangePassword}>Lưu mật khẩu</button>
                        <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setShowChangePwd(false)}>Hủy</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Xác thực email</h4>
                  <p>Xác thực email để tăng cường bảo mật</p>
                </div>
                <span className="status-badge verified">Đã xác thực</span>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Thông báo</h4>
                  <p>Quản lý các thông báo từ hệ thống</p>
                </div>
                <button className="btn btn-outline">Cài đặt</button>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          {user.type === 'user' && (
            <div className="stats-card">
              <h3>Thống kê tài khoản</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">🔋</div>
                  <div className="stat-content">
                    <h4>Pin đã thu gom</h4>
                    <p>25 pin</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🎁</div>
                  <div className="stat-content">
                    <h4>Voucher đã đổi</h4>
                    <p>3 voucher</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-content">
                    <h4>Huy hiệu</h4>
                    <p>5 huy hiệu</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h4>Tham gia từ</h4>
                    <p>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
