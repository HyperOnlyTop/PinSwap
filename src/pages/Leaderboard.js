import React, { useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaAward, FaBatteryFull, FaCoins, FaChartLine } from 'react-icons/fa';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState({
    byPins: [],
    byPoints: []
  });
  const [activeTab, setActiveTab] = useState('pins');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, month, week

  useEffect(() => {
    fetchLeaderboard();
  }, [timeRange]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/leaderboard?range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Leaderboard data:', data);
        setLeaderboardData(data);
      } else {
        console.error('Failed to fetch leaderboard:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1:
        return <FaTrophy className="rank-icon gold" />;
      case 2:
        return <FaMedal className="rank-icon silver" />;
      case 3:
        return <FaMedal className="rank-icon bronze" />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  const getRankClass = (rank) => {
    switch(rank) {
      case 1: return 'rank-1';
      case 2: return 'rank-2';
      case 3: return 'rank-3';
      default: return '';
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const renderLeaderboardList = (data, type) => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải bảng xếp hạng...</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="no-data">
          <FaChartLine className="no-data-icon" />
          <p>Chưa có dữ liệu xếp hạng</p>
        </div>
      );
    }

    return (
      <div className="leaderboard-list">
        {data.map((user, index) => {
          const rank = index + 1;
          return (
            <div key={user._id} className={`leaderboard-item ${getRankClass(rank)}`}>
              <div className="rank-badge">
                {getRankIcon(rank)}
              </div>
              
              <div className="user-info">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img 
                      src={user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.avatar}`} 
                      alt={user.fullName || 'User'} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="avatar-fallback" style={{ display: user.avatar ? 'none' : 'flex' }}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="user-details">
                  <h4>{user.fullName || 'Người dùng'}</h4>
                  <p className="user-email">{user.email}</p>
                  {user.phone && <p className="user-phone">{user.phone}</p>}
                </div>
              </div>

              <div className="user-stats">
                {type === 'pins' ? (
                  <>
                    <div className="stat-item primary">
                      <FaBatteryFull />
                      <span className="stat-value">{formatNumber(user.totalPins || 0)}</span>
                      <span className="stat-label">pin</span>
                    </div>
                    <div className="stat-item secondary">
                      <FaCoins />
                      <span className="stat-value">{formatNumber(user.points || 0)}</span>
                      <span className="stat-label">điểm</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-item primary">
                      <FaCoins />
                      <span className="stat-value">{formatNumber(user.points || 0)}</span>
                      <span className="stat-label">điểm</span>
                    </div>
                    <div className="stat-item secondary">
                      <FaBatteryFull />
                      <span className="stat-value">{formatNumber(user.totalPins || 0)}</span>
                      <span className="stat-label">pin</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="page-header">
          <FaAward className="header-icon" />
          <h1>Bảng Xếp Hạng</h1>
          <p>Những người đóng góp tích cực nhất trong việc thu gom pin</p>
        </div>

        {/* Time Range Filter */}
        <div className="time-filter">
          <button 
            className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            Tất cả
          </button>
          <button 
            className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Tháng này
          </button>
          <button 
            className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Tuần này
          </button>
        </div>

        {/* Tabs */}
        <div className="leaderboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pins' ? 'active' : ''}`}
            onClick={() => setActiveTab('pins')}
          >
            <FaBatteryFull />
            <span>Top Thu Gom Pin</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`}
            onClick={() => setActiveTab('points')}
          >
            <FaCoins />
            <span>Top Điểm Cao</span>
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="leaderboard-content">
          {activeTab === 'pins' && renderLeaderboardList(leaderboardData.byPins, 'pins')}
          {activeTab === 'points' && renderLeaderboardList(leaderboardData.byPoints, 'points')}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
