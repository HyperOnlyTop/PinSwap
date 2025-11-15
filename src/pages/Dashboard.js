import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePin } from '../contexts/PinContext';
import { useVoucher } from '../contexts/VoucherContext';
import { FaRecycle, FaGift, FaMapMarkerAlt, FaQrcode, FaChartLine, FaTrophy } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { collectionHistory } = usePin();
  const { exchangeHistory } = useVoucher();

  if (!user) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="text-center">
            <h2>Vui lòng đăng nhập để xem dashboard</h2>
            <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
          </div>
        </div>
      </div>
    );
  }

  const userCollections = collectionHistory.filter(item => item.userId === user.id);
  const userExchanges = exchangeHistory.filter(item => item.userId === user.id);
  const totalPointsEarned = userCollections.reduce((sum, item) => sum + item.points, 0);
  const totalPointsUsed = userExchanges.reduce((sum, item) => sum + item.pointsUsed, 0);

  const quickActions = [
    {
      title: 'Thu gom pin',
      description: 'Quét QR hoặc chọn loại pin',
      icon: <FaRecycle />,
      link: '/pin-collection',
      color: '#28a745'
    },
    {
      title: 'Đổi voucher',
      description: 'Sử dụng điểm để đổi voucher',
      icon: <FaGift />,
      link: '/voucher-exchange',
      color: '#ffc107'
    },
    {
      title: 'Tìm điểm thu gom',
      description: 'Xem bản đồ các điểm thu gom',
      icon: <FaMapMarkerAlt />,
      link: '/map',
      color: '#17a2b8'
    },
    {
      title: 'Check-in QR',
      description: 'Check-in tại điểm thu gom',
      icon: <FaQrcode />,
      link: '/pin-collection',
      color: '#6f42c1'
    }
  ];

  const stats = [
    {
      title: 'Điểm hiện tại',
      value: user.points || 0,
      icon: <FaTrophy />,
      color: '#ffc107'
    },
    {
      title: 'Pin đã thu gom',
      value: userCollections.length,
      icon: <FaRecycle />,
      color: '#28a745'
    },
    {
      title: 'Voucher đã đổi',
      value: userExchanges.length,
      icon: <FaGift />,
      color: '#17a2b8'
    },
    {
      title: 'Tổng điểm tích lũy',
      value: totalPointsEarned,
      icon: <FaChartLine />,
      color: '#6f42c1'
    }
  ];

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Xin chào, {user.name}!</h1>
          <p>Chào mừng bạn đến với dashboard Pin Swap</p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Thao tác nhanh</h2>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="action-card">
                <div className="action-icon" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2>Hoạt động gần đây</h2>
          <div className="activity-grid">
            <div className="activity-card">
              <h3>Lịch sử thu gom pin</h3>
              {userCollections.length > 0 ? (
                <div className="activity-list">
                  {userCollections.slice(0, 3).map((item) => (
                    <div key={item.id} className="activity-item">
                      <div className="activity-info">
                        <h4>{item.pinType}</h4>
                        <p>{item.quantity} pin - {item.points} điểm</p>
                        <span className="activity-date">{item.date}</span>
                      </div>
                      <div className="activity-points">+{item.points}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">Chưa có hoạt động thu gom pin</p>
              )}
              <Link to="/pin-collection" className="btn btn-outline">
                Xem tất cả
              </Link>
            </div>

            <div className="activity-card">
              <h3>Lịch sử đổi voucher</h3>
              {userExchanges.length > 0 ? (
                <div className="activity-list">
                  {userExchanges.slice(0, 3).map((item) => (
                    <div key={item.id} className="activity-item">
                      <div className="activity-info">
                        <h4>{item.voucherName}</h4>
                        <p>Mã: {item.code}</p>
                        <span className="activity-date">{item.date}</span>
                      </div>
                      <div className="activity-points">-{item.pointsUsed}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">Chưa có hoạt động đổi voucher</p>
              )}
              <Link to="/voucher-exchange" className="btn btn-outline">
                Xem tất cả
              </Link>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="dashboard-section">
          <h2>Huy hiệu thành tích</h2>
          <div className="badges-grid">
            <div className="badge-card earned">
              <div className="badge-icon">🥇</div>
              <h4>Người mới</h4>
              <p>Thu gom pin lần đầu</p>
            </div>
            <div className="badge-card earned">
              <div className="badge-icon">🌱</div>
              <h4>Bảo vệ môi trường</h4>
              <p>Thu gom 10 pin</p>
            </div>
            <div className="badge-card locked">
              <div className="badge-icon">🏆</div>
              <h4>Chuyên gia</h4>
              <p>Thu gom 50 pin</p>
            </div>
            <div className="badge-card locked">
              <div className="badge-icon">💎</div>
              <h4>Siêu sao</h4>
              <p>Thu gom 100 pin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
