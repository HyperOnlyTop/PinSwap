import React from 'react';
import './LockedAccountModal.css';

const LockedAccountModal = ({ show, onClose, message }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="locked-modal" onClick={(e) => e.stopPropagation()}>
        <div className="locked-modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C8.676 1 6 3.676 6 7v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2h-1V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
        </div>
        <div className="locked-modal-content">
          <h2>Tài khoản bị khóa</h2>
          <p>{message || 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ với chúng tôi để biết thêm thông tin.'}</p>
          <div className="locked-modal-actions">
            <button className="btn-primary" onClick={onClose}>
              Đã hiểu
            </button>
          </div>
          <div className="locked-modal-contact">
            <p>Cần hỗ trợ?</p>
            <a href="mailto:support@pinswap.com">support@pinswap.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockedAccountModal;
