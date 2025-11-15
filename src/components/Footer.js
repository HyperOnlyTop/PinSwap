import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>🔋 Pin Swap</h3>
            <p>Hệ thống thu gom pin thân thiện môi trường, góp phần bảo vệ hành tinh xanh.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="YouTube"><FaYoutube /></a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Liên kết nhanh</h3>
            <ul>
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/news">Tin tức</Link></li>
              <li><Link to="/map">Bản đồ thu gom</Link></li>
              <li><Link to="/pin-collection">Thu gom pin</Link></li>
              <li><Link to="/voucher-exchange">Đổi voucher</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Hỗ trợ</h3>
            <ul>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
              <li><Link to="/contact">Liên hệ</Link></li>
              <li><Link to="/guide">Hướng dẫn sử dụng</Link></li>
              <li><Link to="/download">Tải tài liệu</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Liên hệ</h3>
            <div className="contact-info">
              <div className="contact-item">
                <FaEnvelope />
                <span>contact@pinswap.vn</span>
              </div>
              <div className="contact-item">
                <FaPhone />
                <span>00000000000</span>
              </div>
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span> Quận 9, TP.HCM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Pin Swap. Tất cả quyền được bảo lưu.</p>
          <div className="footer-links">
            <Link to="/privacy">Chính sách bảo mật</Link>
            <Link to="/terms">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
