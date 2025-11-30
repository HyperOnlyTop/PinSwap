import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './EventRegistrations.css';

const EventRegistrations = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchRegistrations();
    }
  }, [eventId, page]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Vui lòng đăng nhập');
        navigate('/login');
        return;
      }

      const res = await fetch(`${API}/api/events/${eventId}/registrations?page=${page}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('Bạn không có quyền xem danh sách này');
          navigate('/events');
          return;
        }
        throw new Error(data.message || 'Không thể tải danh sách đăng ký');
      }

      setEvent(data.event);
      setRegistrations(data.registrations || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Fetch registrations error:', err);
      toast.error(err.message || 'Lỗi khi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const userName = reg.userId?.name?.toLowerCase() || '';
    const userEmail = reg.userId?.email?.toLowerCase() || '';
    const userPhone = reg.userId?.phone?.toLowerCase() || '';
    return userName.includes(term) || userEmail.includes(term) || userPhone.includes(term);
  });

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

  const exportToCSV = () => {
    if (filteredRegistrations.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['STT', 'Họ tên', 'Email', 'Số điện thoại', 'Ngày đăng ký'];
    const rows = filteredRegistrations.map((reg, idx) => [
      idx + 1,
      reg.userId?.name || 'N/A',
      reg.userId?.email || 'N/A',
      reg.userId?.phone || 'N/A',
      formatDate(reg.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `event-registrations-${eventId}.csv`;
    link.click();
    toast.success('Đã xuất file CSV');
  };

  if (loading && !event) {
    return (
      <div className="event-registrations">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="event-registrations">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h3>Vui lòng đăng nhập</h3>
            <p>Bạn cần đăng nhập để xem trang này</p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role !== 'admin' && user.role !== 'business') {
    return (
      <div className="event-registrations">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🚫</div>
            <h3>Không có quyền truy cập</h3>
            <p>Chỉ Admin và Business mới có thể xem danh sách đăng ký</p>
            <button className="btn btn-primary" onClick={() => navigate('/events')}>
              Quay lại Sự kiện
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-registrations">
      <div className="container">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/events')}>
            ← Quay lại
          </button>
          <div className="header-content">
            <h1>Danh Sách Đăng Ký</h1>
            {event && (
              <div className="event-info">
                <h2>{event.title}</h2>
                <p className="event-date">
                  📅 {event.date ? formatDate(event.date) : 'Chưa xác định'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <div>
              <div className="stat-number">{total}</div>
              <div className="stat-label">Người đăng ký</div>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <div>
              <div className="stat-number">{filteredRegistrations.length}</div>
              <div className="stat-label">Đang hiển thị</div>
            </div>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn btn-export" onClick={exportToCSV}>
            📥 Xuất CSV
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Chưa có người đăng ký</h3>
            <p>Danh sách đăng ký sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div className="registrations-table">
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Avatar</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg, idx) => (
                  <tr key={reg._id}>
                    <td>{(page - 1) * 50 + idx + 1}</td>
                    <td>
                      <div className="avatar-cell">
                        {reg.userId?.avatar ? (
                          <img src={reg.userId.avatar} alt="" className="user-avatar" />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {reg.userId?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="name-cell">{reg.userId?.name || 'N/A'}</td>
                    <td>{reg.userId?.email || 'N/A'}</td>
                    <td>{reg.userId?.phone || 'N/A'}</td>
                    <td className="date-cell">{formatDate(reg.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 50 && (
          <div className="pagination">
            <button 
              className="btn-page" 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ← Trước
            </button>
            <span className="page-info">
              Trang {page} / {Math.ceil(total / 50)}
            </span>
            <button 
              className="btn-page" 
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => setPage(p => p + 1)}
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrations;
