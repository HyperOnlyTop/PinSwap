import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          🔋 Pin Swap
        </Link>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-menu">
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Trang chủ</Link></li>
            <li><Link to="/news" onClick={() => setIsMenuOpen(false)}>Tin tức</Link></li>
            <li><Link to="/map" onClick={() => setIsMenuOpen(false)}>Bản đồ</Link></li>
            <li><Link to="/feedback" onClick={() => setIsMenuOpen(false)}>Phản hồi</Link></li>
            {user && (
              <>
                <li><Link to="/pin-collection" onClick={() => setIsMenuOpen(false)}>Thu gom pin</Link></li>
                <li><Link to="/voucher-exchange" onClick={() => setIsMenuOpen(false)}>Đổi voucher</Link></li>
                {(user.role === 'admin' || user.type === 'admin') && (
                  <li><Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin</Link></li>
                )}
              </>
            )}
          </ul>
        </nav>

        <div className="user-menu">
          {user ? (
            <div className="user-info">
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                {(user.role === 'citizen' || user.type === 'user' || user.role === 'user') && (
                  <span className="user-points">{user.points} điểm</span>
                )}
              </div>
              <div className="avatar" onClick={toggleUserMenu}>
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" />
                ) : (
                  <span>{(user.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</span>
                )}
              </div>
              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/dashboard" onClick={() => setIsUserMenuOpen(false)}>
                    <FaUser /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}>
                    <FaUser /> Hồ sơ
                  </Link>
                  <button onClick={handleLogout}>
                    <FaSignOutAlt /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary">Đăng ký</Link>
            </div>
          )}

          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
