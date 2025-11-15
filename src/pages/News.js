import React, { useEffect, useState } from 'react';
import { FaNewspaper, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './News.css';

const News = () => {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [news, setNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API}/api/news`);
        const data = await res.json();
        if (Array.isArray(data)) setNews(data);
      } catch (err) {
        console.error('Failed to load news', err);
      }
    };
    fetchNews();
  }, []);

  // derive featured + regular from returned news
  const featuredNews = news.length ? [news[0]] : [];
  const regularNews = news.slice(1);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="news-page">
      <div className="container">
        <div className="page-header">
          <h1>Tin tức môi trường</h1>
          <p>Cập nhật những tin tức mới nhất về bảo vệ môi trường và thu gom pin</p>
        </div>

        {/* Featured News */}
        {featuredNews.length > 0 && (
          <div className="featured-section">
            <h2>
              <FaNewspaper /> Tin nổi bật
            </h2>
            <div className="featured-news">
              {featuredNews.map(article => (
                <div key={article._id || article.id} className="featured-card">
                  <div className="featured-image">
                      <img src={(article.images && article.images[0]) || article.thumbnail || '/images/news-1.jpg'} alt={article.title} />
                      <div className="featured-badge">Nổi bật</div>
                    </div>
                  <div className="featured-content">
                    <div className="article-meta">
                      <span className="article-date">
                        <FaCalendarAlt /> {formatDate(article.createdAt || article.date)}
                      </span>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{(article.excerpt || (article.content || '').slice(0, 200) + '...')}</p>
                    <div className="article-author">
                      <FaUser /> {article.createdBy && article.createdBy.name ? article.createdBy.name : ''}
                    </div>
                    <Link to={`/news/${article._id || article.id}`} className="btn btn-primary">Đọc thêm</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular News */}
        <div className="news-section">
          <h2>Tin tức mới nhất</h2>
          <div className="news-grid">
            {regularNews.map(article => (
              <div key={article._id || article.id} className="news-card">
                <div className="news-image">
                  <img src={(article.images && article.images[0]) || article.thumbnail || '/images/news-1.jpg'} alt={article.title} />
                </div>
                <div className="news-content">
                  <div className="article-meta">
                    <span className="article-date">
                      <FaCalendarAlt /> {formatDate(article.createdAt || article.date)}
                    </span>
                    <span className="article-author">
                      <FaUser /> {article.createdBy && article.createdBy.name ? article.createdBy.name : ''}
                    </span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{(article.excerpt || (article.content || '').slice(0, 200) + '...')}</p>
                  <Link to={`/news/${article._id || article.id}`} className="btn btn-outline">Đọc thêm</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="newsletter-section">
          <div className="newsletter-card">
            <h3>Đăng ký nhận tin tức</h3>
            <p>Nhận thông tin mới nhất về các chương trình và sự kiện môi trường</p>
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="newsletter-input"
              />
              <button className="btn btn-primary">Đăng ký</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
