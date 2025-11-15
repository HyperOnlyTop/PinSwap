import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    userType: 'user',
    // Business specific fields
    businessName: '',
    taxCode: '',
    businessAddress: '',
    contactPerson: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        // backend expects 'citizen' for regular users (enum in user model). Map 'user' -> 'citizen'
        role: formData.userType === 'user' ? 'citizen' : formData.userType
      };

      // Add business specific data if business type
      if (formData.userType === 'business') {
        // map frontend field names to backend expected names
        userData.companyName = formData.businessName;
        userData.taxCode = formData.taxCode;
        userData.contactName = formData.contactPerson;
        // put business address into user's address field (backend uses address on user)
        userData.address = formData.businessAddress || formData.address;
      }

  setErrors({});
  const result = await register(userData, formData.userType);
      
      if (result.success) {
        toast.success('Đăng ký thành công!');
        navigate('/dashboard');
      } else {
        // show detailed validation errors if present
        if (result.errors && typeof result.errors === 'object') {
          setErrors(result.errors);
          const msgs = Object.values(result.errors).join('; ');
          toast.error(msgs || 'Đăng ký thất bại');
        } else if (result.error && typeof result.error === 'string') {
          toast.error(result.error);
        } else {
          toast.error('Đăng ký thất bại');
        }
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Đăng ký</h1>
            <p>Tạo tài khoản mới để tham gia Pin Swap</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="userType">Loại tài khoản</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="user">Người dân</option>
                <option value="business">Doanh nghiệp</option>
              </select>
            </div>

            {formData.userType === 'user' ? (
              <>
                <div className="form-group">
                  <label htmlFor="name">Họ và tên</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="address">Địa chỉ</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                    rows="3"
                    required
                  />
                  {errors.address && <div className="field-error">{errors.address}</div>}
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="businessName">Tên doanh nghiệp</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Nhập tên doanh nghiệp"
                    required
                  />
                  {errors.companyName && <div className="field-error">{errors.companyName}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="taxCode">Mã số thuế</label>
                  <input
                    type="text"
                    id="taxCode"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleChange}
                    placeholder="Nhập mã số thuế"
                    required
                  />
                  {errors.taxCode && <div className="field-error">{errors.taxCode}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="contactPerson">Người liên hệ</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Nhập tên người liên hệ"
                    required
                  />
                  {errors.contactName && <div className="field-error">{errors.contactName}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="businessAddress">Địa chỉ doanh nghiệp</label>
                  <textarea
                    id="businessAddress"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ doanh nghiệp"
                    rows="3"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                required
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </div>

            <div className="auth-links">
              <p>
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </p>
            </div>
          </form>

          <div className="auth-divider">
            <span>Hoặc</span>
          </div>

          <div className="social-login">
            <button className="btn btn-social google">
              <img src="/images/google-icon.png" alt="Google" />
              Đăng ký với Google
            </button>
            <button className="btn btn-social facebook">
              <img src="/images/facebook-icon.png" alt="Facebook" />
              Đăng ký với Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
