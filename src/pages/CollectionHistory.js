import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './CollectionHistory.css';

const CollectionHistory = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, scan, manual, qr

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Vui lòng đăng nhập');
        return;
      }

      const res = await fetch(`${API}/api/collections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tải lịch sử');
      }

      setCollections(data.collections || []);
    } catch (err) {
      console.error('Fetch collections error:', err);
      toast.error('Lỗi khi tải lịch sử thu gom');
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = filter === 'all' 
    ? collections 
    : collections.filter(c => c.method === filter);

  const getTotalPoints = () => {
    return filteredCollections.reduce((sum, c) => sum + (c.totalPoints || 0), 0);
  };

  const getTotalItems = () => {
    return filteredCollections.reduce((sum, c) => {
      return sum + (c.items || []).reduce((s, item) => s + (item.quantity || 0), 0);
    }, 0);
  };

  const getMethodBadge = (method) => {
    const badges = {
      scan: { label: 'Quét Camera', class: 'badge-scan' },
      manual: { label: 'Chọn Thủ Công', class: 'badge-manual' },
      qr: { label: 'QR Code', class: 'badge-qr' }
    };
    return badges[method] || { label: method, class: 'badge-default' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="collection-history">
        <div className="container">
          <div className="text-center">
            <h2>Vui lòng đăng nhập để xem lịch sử</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-history">
      <div className="container">
        <div className="history-header">
          <h1>Lịch Sử Thu Gom Pin</h1>
          <p className="subtitle">Theo dõi các lần thu gom pin của bạn</p>
        </div>

        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <div className="stat-value">{filteredCollections.length}</div>
              <div className="stat-label">Lần thu gom</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔋</div>
            <div className="stat-info">
              <div className="stat-value">{getTotalItems()}</div>
              <div className="stat-label">Tổng số pin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-value">{getTotalPoints()}</div>
              <div className="stat-label">Tổng điểm</div>
            </div>
          </div>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={`filter-tab ${filter === 'scan' ? 'active' : ''}`}
            onClick={() => setFilter('scan')}
          >
            Quét Camera
          </button>
          <button 
            className={`filter-tab ${filter === 'manual' ? 'active' : ''}`}
            onClick={() => setFilter('manual')}
          >
            Chọn Thủ Công
          </button>
          <button 
            className={`filter-tab ${filter === 'qr' ? 'active' : ''}`}
            onClick={() => setFilter('qr')}
          >
            QR Code
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải lịch sử...</p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Chưa có lịch sử thu gom</h3>
            <p>Bắt đầu thu gom pin để tích điểm ngay!</p>
          </div>
        ) : (
          <div className="history-list">
            {filteredCollections.map((collection) => {
              const badge = getMethodBadge(collection.method);
              return (
                <div key={collection._id} className="history-item">
                  <div className="item-header">
                    <div className="item-date">{formatDate(collection.createdAt)}</div>
                    <span className={`method-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  
                  <div className="item-body">
                    <div className="item-details">
                      {collection.items && collection.items.map((item, idx) => (
                        <div key={idx} className="pin-item">
                          <span className="pin-name">{item.pinType}</span>
                          <span className="pin-quantity">x{item.quantity}</span>
                          <span className="pin-points">+{item.points * item.quantity} điểm</span>
                        </div>
                      ))}
                    </div>
                    
                    {collection.location && (
                      <div className="item-location">
                        <span className="location-icon">📍</span>
                        {collection.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="item-footer">
                    <div className="total-points">
                      Tổng: <strong>{collection.totalPoints} điểm</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionHistory;
