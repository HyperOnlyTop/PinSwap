import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoucher } from '../contexts/VoucherContext';
import { FaGift, FaMapMarkerAlt, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './VoucherExchange.css';

const VoucherExchange = () => {
  const { user, addPoints } = useAuth();
  const { vouchers, exchangeVoucher, exchangeHistory } = useVoucher();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userExchanges] = useState(exchangeHistory.filter(item => item.userId === user?.id));

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

    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return toast.error('Voucher không tồn tại');

    if ((user.points || 0) < (voucher.points || 0)) {
      toast.error('Điểm không đủ để đổi voucher này');
      return;
    }

    const result = await exchangeVoucher(voucherId);
    if (result.success) {
      // deduct points locally
      if (result.pointsUsed && result.pointsUsed > 0) {
        try {
          addPoints(-Number(result.pointsUsed));
        } catch (e) {
          // fallback: update localStorage user object directly
          try {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            stored.points = Math.max(0, (stored.points || 0) - Number(result.pointsUsed));
            localStorage.setItem('user', JSON.stringify(stored));
          } catch (ee) {}
        }
      }
      toast.success('Đổi voucher thành công! Mã: ' + (result.code || ''));
    } else {
      toast.error(result.error || 'Đổi voucher thất bại');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isExpired = (dateString) => {
    return new Date(dateString) < new Date();
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
            {filteredVouchers.map(voucher => (
              <div key={voucher.id} className="voucher-card">
                <div className="voucher-image">
                  <img src={voucher.image} alt={voucher.name} />
                  <div className="voucher-badge">
                    <FaGift />
                  </div>
                </div>
                
                <div className="voucher-content">
                  <h3>{voucher.name}</h3>
                  <p className="voucher-description">{voucher.description}</p>
                  
                  <div className="voucher-business">
                    <FaMapMarkerAlt />
                    <span>{voucher.business}</span>
                  </div>
                  
                  <div className="voucher-expiry">
                    <FaClock />
                    <span className={isExpired(voucher.validUntil) ? 'expired' : ''}>
                      HSD: {formatDate(voucher.validUntil)}
                    </span>
                  </div>
                  
                  <div className="voucher-stats">
                    <div className="stat">
                      <span className="stat-label">Còn lại:</span>
                      <span className="stat-value">{voucher.available}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Đã đổi:</span>
                      <span className="stat-value">{voucher.redeemed}</span>
                    </div>
                  </div>
                  
                  <div className="voucher-footer">
                    <div className="voucher-points">
                      <span className="points-required">{voucher.points} điểm</span>
                    </div>
                    
                    <button
                      className={`exchange-btn ${user.points >= voucher.points ? 'available' : 'insufficient'}`}
                      onClick={() => handleExchangeVoucher(voucher.id)}
                      disabled={user.points < voucher.points || voucher.available <= 0}
                    >
                      {user.points >= voucher.points ? (
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
            ))}
          </div>
        </div>

        {/* Exchange History */}
        <div className="exchange-history">
          <h2>Lịch sử đổi voucher</h2>
          {userExchanges.length > 0 ? (
            <div className="history-list">
              {userExchanges.map(exchange => (
                <div key={exchange.id} className="history-item">
                  <div className="history-info">
                    <h4>{exchange.voucherName}</h4>
                    <p>Mã voucher: <strong>{exchange.code}</strong></p>
                    <span className="history-date">{formatDate(exchange.date)}</span>
                  </div>
                  <div className="history-status">
                    <span className={`status-badge ${exchange.status}`}>
                      {exchange.status === 'used' ? 'Đã sử dụng' : 'Chưa sử dụng'}
                    </span>
                    <div className="points-used">-{exchange.pointsUsed} điểm</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <FaGift className="no-history-icon" />
              <p>Chưa có lịch sử đổi voucher</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherExchange;
