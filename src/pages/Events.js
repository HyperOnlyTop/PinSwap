import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // full event
  const [modalOpen, setModalOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/events`);
      const data = await res.json();
      if (data && data.items) setEvents(data.items);
      else if (Array.isArray(data)) setEvents(data);
    } catch (err) {
      console.error('load events', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/events/${id}`);
      if (!res.ok) return;
      const ev = await res.json();
      setSelected(ev);
      setGalleryIndex(0);
      setModalOpen(true);
      setIsRegistered(false);

      // if user is logged in, check registration status
      if (user) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const r = await fetch(`${API}/api/events/${id}/check-registration`, { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            if (r.ok) {
              const data = await r.json();
              setIsRegistered(data.isRegistered);
            }
          }
        } catch (err) {
          console.warn('could not check registration', err);
        }
      }
    } catch (err) {
      console.error('openDetail', err);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký');
      navigate('/login');
      return;
    }

    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/events/${selected._id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Không thể đăng ký');
      }

      setIsRegistered(true);
      toast.success('Đăng ký thành công!');
    } catch (err) {
      console.error('register error', err);
      toast.error(err.message || 'Lỗi khi đăng ký');
    }
  };

  const handleCancelRegistration = async () => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/events/${selected._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Không thể hủy đăng ký');
      }

      setIsRegistered(false);
      toast.success('Đã hủy đăng ký');
    } catch (err) {
      console.error('cancel registration error', err);
      toast.error(err.message || 'Lỗi khi hủy đăng ký');
    }
  };

  const viewRegistrations = (eventId) => {
    navigate(`/events/${eventId}/registrations`);
  };

  const closeModal = () => { setModalOpen(false); setSelected(null); };

  const prevImage = () => {
    if (!selected || !selected.images) return;
    setGalleryIndex(i => (i <= 0 ? selected.images.length - 1 : i - 1));
  };
  const nextImage = () => {
    if (!selected || !selected.images) return;
    setGalleryIndex(i => (i >= selected.images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Sự kiện</h1>
        <p className="lead">Cập nhật các hoạt động thu gom pin và sự kiện cộng đồng</p>
      </div>

      {loading && <p>Đang tải…</p>}
      {!loading && events.length === 0 && <p>Chưa có sự kiện.</p>}

      <div className="events-list">
        {events.map(ev => (
          <article key={ev._id} className="event-card" onClick={() => openDetail(ev._id)}>
            {ev.thumbnail || (ev.images && ev.images[0]) ? (
              <div className="event-image" style={{ backgroundImage: `url(${ev.thumbnail || (ev.images && ev.images[0])})` }} />
            ) : (
              <div className="event-image placeholder" />
            )}

            <div className="event-content">
              <h3 className="title">{ev.title}</h3>
              <div className="meta">
                <span className="loc">{ev.location}</span>
                <span className="date">{new Date(ev.date).toLocaleString()}</span>
              </div>
              <p className="desc">{ev.description ? (ev.description.length > 180 ? ev.description.slice(0,180) + '…' : ev.description) : ''}</p>
              <div className="card-actions">
                <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); openDetail(ev._id); }}>Xem chi tiết</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-grid">
              <div className="modal-gallery">
                {selected.images && selected.images.length > 0 ? (
                  <>
                    <div className="gallery-image" style={{ backgroundImage: `url(${selected.images[galleryIndex]})` }} />
                    {selected.images.length > 1 && (
                      <div className="gallery-controls">
                        <button className="btn small" onClick={prevImage}>‹</button>
                        <button className="btn small" onClick={nextImage}>›</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="gallery-image placeholder" />
                )}
              </div>
                <div className="modal-info">
                <h2>{selected.title}</h2>
                <div className="meta">
                  <span>{selected.location}</span>
                  <span>{new Date(selected.date).toLocaleString()}</span>
                </div>
                <p className="full-desc">{selected.description}</p>
                {selected.sponsor && <div className="sponsor">Nhà tài trợ: {selected.sponsor}</div>}
                <div style={{ marginTop: 20, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {user ? (
                    isRegistered ? (
                      <button className="btn btn-danger" onClick={handleCancelRegistration}>
                        Hủy đăng ký
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={handleRegister}>
                        Đăng ký tham gia
                      </button>
                    )
                  ) : (
                    <button className="btn" onClick={() => navigate('/login')}>
                      Đăng nhập để đăng ký
                    </button>
                  )}
                  {user && (user.role === 'admin' || user.role === 'business') && (
                    <button className="btn btn-outline" onClick={() => viewRegistrations(selected._id)}>
                      👥 Xem danh sách đăng ký
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
