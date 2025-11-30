import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaGift, FaMapMarkerAlt, FaClock, FaCheck, FaTimes, FaQrcode } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './VoucherExchange.css';

const VoucherExchange = () => {
  const { user, fetchMe } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [exchangeHistory, setExchangeHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    fetchVouchers();
    if (user) {
      fetchExchangeHistory();
    }
  }, [user]);

  const fetchVouchers = async () => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/vouchers`);
      const data = await res.json();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch vouchers error:', err);
    }
  };

  const fetchExchangeHistory = async () => {
    try {
      setLoading(true);
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token) return;

      const res = await fetch(`${API}/api/vouchers/history/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setExchangeHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Fetch exchange history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'food', name: 'Ẩm thực' },
    { id: 'shopping', name: 'Mua sắm' },
    { id: 'service', name: 'Dịch vụ' }
  ];

  const filteredVouchers = vouchers.filter(voucher => {
    if (selectedCategory === 'all') return true;
    // Add category filtering logic based on business type
    return true;
  });

  const handleExchangeVoucher = async (voucherId) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đổi voucher');
      return;
    }

    const voucher = vouchers.find(v => v._id === voucherId || v.id === voucherId);
    if (!voucher) return toast.error('Voucher không tồn tại');

    if ((user.points || 0) < (voucher.pointsRequired || voucher.points || 0)) {
      toast.error('Điểm không đủ để đổi voucher này');
      return;
    }

    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API}/api/vouchers/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voucherId })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Đổi voucher thất bại');
      }

      if (result.success) {
        toast.success(`Đổi voucher thành công! Mã: ${result.code || ''}`);
        
        // Refresh user data to get updated points
        if (typeof fetchMe === 'function') {
          await fetchMe();
        }
        
        // Refresh vouchers list
        await fetchVouchers();
        
        // Refresh exchange history
        await fetchExchangeHistory();
      }
    } catch (err) {
      console.error('Exchange voucher error:', err);
      toast.error(err.message || 'Đổi voucher thất bại');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isExpired = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const handleUseVoucher = (history) => {
    setSelectedVoucher(history);
    setShowVoucherModal(true);
  };

  const closeModal = () => {
    setShowVoucherModal(false);
    setSelectedVoucher(null);
  };

  if (!user) {
    return (
      <div className="voucher-exchange">
        <div className="container">
          <div className="text-center">
            <h2>Vui lòng đăng nhập để sử dụng tính năng này</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-exchange">
      <div className="container">
        <div className="page-header">
          <h1>Đổi voucher</h1>
          <p>Sử dụng điểm để đổi voucher từ các đối tác</p>
          <div className="points-display">
            <span className="points-label">Điểm hiện tại:</span>
            <span className="points-value">{user.points}</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Vouchers Grid */}
        <div className="vouchers-section">
          <h2>Voucher có sẵn</h2>
          <div className="vouchers-grid">
            {filteredVouchers.map(voucher => {
              const voucherId = voucher._id || voucher.id;
              const pointsRequired = voucher.pointsRequired || voucher.points || 0;
              const available = voucher.quantity || voucher.available || 0;
              const imageUrl = voucher.images && voucher.images[0] 
                ? (voucher.images[0].startsWith('http') 
                    ? voucher.images[0] 
                    : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${voucher.images[0].startsWith('/') ? '' : '/'}${voucher.images[0]}`)
                : '/images/voucher-default.jpg';
              
              return (
                <div key={voucherId} className="voucher-card">
                  <div className="voucher-image">
                    <img src={imageUrl} alt={voucher.title || voucher.name} onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/voucher-default.jpg';
                    }} />
                    <div className="voucher-badge">
                      <FaGift />
                    </div>
                  </div>
                  
                  <div className="voucher-content">
                    <h3>{voucher.title || voucher.name}</h3>
                    <p className="voucher-description">{voucher.description}</p>
                    
                    <div className="voucher-business">
                      <FaMapMarkerAlt />
                      <span>{voucher.businessId?.companyName || voucher.business || 'Đối tác'}</span>
                    </div>
                    
                    {voucher.expiryDate && (
                      <div className="voucher-expiry">
                        <FaClock />
                        <span className={isExpired(voucher.expiryDate) ? 'expired' : ''}>
                          HSD: {formatDate(voucher.expiryDate)}
                        </span>
                      </div>
                    )}
                    
                    <div className="voucher-stats">
                      <div className="stat">
                        <span className="stat-label">Còn lại:</span>
                        <span className="stat-value">{available}</span>
                      </div>
                      {voucher.discount && (
                        <div className="stat">
                          <span className="stat-label">Giảm:</span>
                          <span className="stat-value">{voucher.discount}%</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="voucher-footer">
                      <div className="voucher-points">
                        <span className="points-required">{pointsRequired} điểm</span>
                      </div>
                      
                      <button
                        className={`exchange-btn ${user.points >= pointsRequired ? 'available' : 'insufficient'}`}
                        onClick={() => handleExchangeVoucher(voucherId)}
                        disabled={user.points < pointsRequired || available <= 0}
                      >
                        {user.points >= pointsRequired ? (
                          <>
                            <FaCheck /> Đổi ngay
                          </>
                        ) : (
                          <>
                            <FaTimes /> Không đủ điểm
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exchange History */}
        <div className="exchange-history">
          <h2>Lịch sử đổi voucher</h2>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : exchangeHistory.length > 0 ? (
            <div className="history-list">
              {exchangeHistory.map(history => {
                const voucher = history.voucherId;
                const isUsed = history.usedAt || history.status === 'used';
                const isHistoryExpired = voucher?.expiryDate && isExpired(voucher.expiryDate);
                
                return (
                  <div key={history._id} className="history-item">
                    <div className="history-info">
                      <h4>{voucher?.title || 'Voucher'}</h4>
                      <p>Mã voucher: <strong>{history.code || 'N/A'}</strong></p>
                      {voucher?.discount && (
                        <p className="discount-info">Giảm giá: {voucher.discount}%</p>
                      )}
                      <span className="history-date">{formatDate(history.createdAt)}</span>
                      {isUsed && <span className="voucher-status used">Đã sử dụng</span>}
                      {!isUsed && isHistoryExpired && <span className="voucher-status expired">Đã hết hạn</span>}
                      {!isUsed && !isHistoryExpired && <span className="voucher-status active">Chưa sử dụng</span>}
                    </div>
                    <div className="history-status">
                      <div className="points-used">-{history.pointsUsed || 0} điểm</div>
                      {!isUsed && !isHistoryExpired && (
                        <button 
                          className="use-voucher-btn" 
                          onClick={() => handleUseVoucher(history)}
                        >
                          <FaQrcode /> Sử dụng
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-history">
              <FaGift className="no-history-icon" />
              <p>Chưa có lịch sử đổi voucher</p>
            </div>
          )}
        </div>
      </div>

      {/* Voucher Usage Modal */}
      {showVoucherModal && selectedVoucher && (
        <div className="voucher-modal-overlay" onClick={closeModal}>
          <div className="voucher-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <div className="modal-header">
              <FaGift className="modal-icon" />
              <h2>Sử dụng Voucher</h2>
            </div>
            
            <div className="modal-body">
              <div className="voucher-details">
                <h3>{selectedVoucher.voucherId?.title || 'Voucher'}</h3>
                {selectedVoucher.voucherId?.description && (
                  <p className="modal-description">{selectedVoucher.voucherId.description}</p>
                )}
                {selectedVoucher.voucherId?.discount && (
                  <div className="modal-discount">
                    <span className="discount-badge">Giảm {selectedVoucher.voucherId.discount}%</span>
                  </div>
                )}
              </div>
              
              <div className="voucher-code-display">
                <div className="code-label">Mã voucher:</div>
                <div className="code-value">{selectedVoucher.code}</div>
              </div>
              
              <div className="qr-code-placeholder">
                <FaQrcode size={120} />
                <p>Mã QR sẽ được tích hợp trong tương lai</p>
              </div>
              
              <div className="voucher-expiry-info">
                <FaClock />
                <span>Hạn sử dụng: {formatDate(selectedVoucher.voucherId?.expiryDate)}</span>
              </div>
              
              <div className="usage-instructions">
                <h4>Hướng dẫn sử dụng:</h4>
                <ol>
                  <li>Xuất trình mã voucher này cho nhân viên</li>
                  <li>Nhân viên sẽ quét mã hoặc nhập mã thủ công</li>
                  <li>Nhận ưu đãi theo mô tả voucher</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherExchange;
