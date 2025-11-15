import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRecycle, FaLeaf, FaTrophy, FaMapMarkerAlt, FaQrcode, FaGift } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: <FaRecycle />,
      title: 'Thu gom pin dễ dàng',
      description: 'Quét mã QR hoặc chọn loại pin để tích điểm nhanh chóng'
    },
    {
      icon: <FaLeaf />,
      title: 'Bảo vệ môi trường',
      description: 'Góp phần giảm thiểu ô nhiễm và bảo vệ hành tinh xanh'
    },
    {
      icon: <FaTrophy />,
      title: 'Tích điểm thưởng',
      description: 'Nhận điểm thưởng cho mỗi lần thu gom pin'
    },
    {
      icon: <FaGift />,
      title: 'Đổi voucher',
      description: 'Sử dụng điểm để đổi voucher từ các đối tác'
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Tìm điểm thu gom',
      description: 'Tìm các điểm thu gom pin gần bạn nhất'
    },
    {
      icon: <FaQrcode />,
      title: 'Check-in QR',
      description: 'Check-in tại điểm thu gom để nhận điểm bonus'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Pin đã thu gom' },
    { number: '2,500+', label: 'Người tham gia' },
    { number: '150+', label: 'Điểm thu gom' },
    { number: '25+', label: 'Đối tác liên kết' }
  ];

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API}/api/news`);
        const data = await res.json();
        if (Array.isArray(data)) setNews(data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load news', err);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Thu gom pin thân thiện môi trường</h1>
          <p>
            Tham gia cùng Pin Swap để góp phần bảo vệ môi trường, 
            tích điểm thưởng và đổi voucher từ các đối tác uy tín.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Tham gia ngay
            </Link>
            <Link to="/map" className="btn btn-secondary btn-large">
              Tìm điểm thu gom
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Tại sao chọn Pin Swap?</h2>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-section">
        <div className="container">
          <h2>Tin tức nổi bật</h2>
          <div className="news-grid">
            {news.map((article) => (
              <div key={article._id || article.id} className="news-card">
                <div className="news-image">
                  <img src={(article.images && article.images[0]) || article.thumbnail || article.image || '/images/news-1.jpg'} alt={article.title} />
                  {article.images && article.images.length > 1 && (
                    <div className="thumb-row">
                      {article.images.slice(0,3).map((img, i) => (
                        <img key={i} src={img} alt={`thumb-${i}`} className="thumb-small" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="news-content">
                  <h3>{article.title}</h3>
                  <p>{(article.excerpt || (article.content || '').slice(0, 150) + '...')}</p>
                  <div className="news-meta">
                    <span className="news-date">{(article.createdAt || article.date || '').slice(0,10)}</span>
                    <span className="news-author">{article.createdBy && article.createdBy.name ? ` • ${article.createdBy.name}` : ''}</span>
                    <Link to={`/news/${article._id || article.id}`} className="news-link">
                      Đọc thêm →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/news" className="btn btn-primary">
              Xem tất cả tin tức
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Sẵn sàng bắt đầu?</h2>
            <p>Tham gia ngay để trở thành một phần của cộng đồng bảo vệ môi trường!</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Đăng ký miễn phí
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
