import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import './News.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NewsDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/news/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error('Failed to load news item', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

  if (loading) return <div className="container"><p>Đang tải...</p></div>;
  if (!item) return <div className="container"><p>Bài viết không tồn tại.</p></div>;

  return (
    <div className="news-article container">
      <div className="page-header">
        <h1>{item.title}</h1>
        <p className="article-meta"><FaCalendarAlt /> {formatDate(item.createdAt)} {item.createdBy ? <span style={{ marginLeft: 12 }}><FaUser /> {item.createdBy.name || item.createdBy}</span> : null}</p>
      </div>

      {(item.images && item.images.length > 0) ? (
        <div className="article-image">
          <img src={item.images[0]} alt={item.title} style={{ maxWidth: '100%' }} />
          {item.images.length > 1 && (
            <div className="thumb-row" style={{ marginTop: 8 }}>
              {item.images.map((img, i) => (
                <img key={i} src={img} alt={`img-${i}`} style={{ width: 80, marginRight: 8 }} />
              ))}
            </div>
          )}
        </div>
      ) : (item.thumbnail && (
        <div className="article-image">
          <img src={item.thumbnail} alt={item.title} style={{ maxWidth: '100%' }} />
        </div>
      ))}

      <div className="article-content">
        <div dangerouslySetInnerHTML={{ __html: item.content }} />
      </div>
    </div>
  );
};

export default NewsDetail;
