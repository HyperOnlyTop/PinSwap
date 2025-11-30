import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EventsAdmin = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocationKey, setSelectedLocationKey] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessKey, setSelectedBusinessKey] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', date: '', sponsor: '' });
  const [eventImages, setEventImages] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/events`);
      const data = await res.json();
      if (data && data.items) setEvents(data.items);
      else if (Array.isArray(data)) setEvents(data);
    } catch (err) {
      console.error('fetchEvents', err);
      toast.error('Không thể tải sự kiện');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  // load locations for dropdown
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch(`${API}/api/locations`);
        if (!res.ok) return;
        const data = await res.json();
        // data may be array
        const list = Array.isArray(data) ? data : (data.items || []);
        setLocations(list);
      } catch (err) {
        console.error('loadLocations', err);
      }
    };
    loadLocations();
    // load businesses for sponsor dropdown (admin)
    const loadBusinesses = async () => {
      try {
        const res = await fetch(`${API}/api/admin/businesses`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const jb = await res.json();
        // admin endpoint may return { businesses }
        const list = (jb && jb.businesses && Array.isArray(jb.businesses)) ? jb.businesses : (Array.isArray(jb) ? jb : []);
        setBusinesses(list);
      } catch (err) {
        console.error('loadBusinesses', err);
      }
    };
    loadBusinesses();
  }, []);

  const openCreate = () => { setEditingId(null); setForm({ title: '', description: '', location: '', date: '', sponsor: '' }); setSelectedLocationKey(''); };
  const openEdit = (e) => {
    setEditingId(e._id);
    const dateVal = e.date ? (new Date(e.date)).toISOString().slice(0,16) : '';
    setForm({ title: e.title || '', description: e.description || '', location: e.location || '', date: dateVal, sponsor: e.sponsor || '' });
    // try to match existing event.location to a known location name or address
    const match = locations.find(l => (l.name && l.name === e.location) || (l.address && l.address === e.location));
    setSelectedLocationKey(match ? match._id : (e.location ? '__manual' : ''));
    // match sponsor to existing business
    const bmatch = businesses.find(b => (b.companyName && b.companyName === e.sponsor) || (b.userId && (b.userId.name === e.sponsor || b.userId.email === e.sponsor)));
    setSelectedBusinessKey(bmatch ? bmatch._id : (e.sponsor ? '__manual' : ''));
  };

  const submit = async (ev) => {
    ev && ev.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API}/api/events/${editingId}` : `${API}/api/events`;
      const payload = { ...form };
      // ensure ISO date
      if (payload.date) payload.date = new Date(payload.date).toISOString();
      // include images
      payload.images = eventImages.slice();
      if (!payload.thumbnail && payload.images && payload.images.length) payload.thumbnail = payload.images[0];
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      toast.success(editingId ? 'Cập nhật sự kiện' : 'Tạo sự kiện thành công');
      fetchEvents();
      setEditingId(null);
    } catch (err) {
      console.error('event submit', err);
      toast.error(err.message || 'Lỗi');
    }
  };

  const uploadImageFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      if (data.url) setEventImages(prev => [...prev, data.url]);
    } catch (err) {
      console.error('uploadImageFile', err);
      toast.error('Upload ảnh thất bại');
    }
  };

  const handleImageInput = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    uploadImageFile(f);
    e.target.value = '';
  };

  const removeEventImage = (url) => setEventImages(prev => prev.filter(u => u !== url));

  const remove = async (id) => {
    if (!confirm('Xác nhận xóa sự kiện này?')) return;
    try {
      const res = await fetch(`${API}/api/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      toast.success('Đã xóa');
      fetchEvents();
    } catch (err) {
      console.error('delete event', err);
      toast.error(err.message || 'Lỗi');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 2 }}>
        <div className="content-header">
          <h2>Quản lý sự kiện</h2>
          <button className="btn btn-primary" onClick={openCreate}><FaPlus /> Thêm sự kiện</button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Địa điểm</th>
                <th>Ngày</th>
                <th>Nhà tài trợ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev._id}>
                  <td>{ev.title}</td>
                  <td>{ev.location || '-'}</td>
                  <td>{ev.date ? (new Date(ev.date)).toLocaleString() : ''}</td>
                  <td>{ev.sponsor || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => openEdit(ev)}><FaEdit /></button>
                      <button className="btn-icon delete" onClick={() => remove(ev._id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="settings-card">
          <h3>{editingId ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h3>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Tiêu đề</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Địa điểm</label>
              <select className="form-input" value={selectedLocationKey || ''} onChange={e => {
                const v = e.target.value;
                setSelectedLocationKey(v);
                if (v === '__manual') {
                  setForm({ ...form, location: '' });
                } else if (!v) {
                  setForm({ ...form, location: '' });
                } else {
                  const loc = locations.find(x => String(x._id) === String(v));
                  const text = loc ? (loc.name + (loc.address ? (' - ' + loc.address) : '')) : '';
                  setForm({ ...form, location: text });
                }
              }}>
                <option value="">-- Chọn địa điểm từ danh sách --</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}{l.address ? ` - ${l.address}` : ''}</option>
                ))}
                <option value="__manual">Khác (nhập tay)</option>
              </select>

              {selectedLocationKey === '__manual' && (
                <input className="form-input" placeholder="Nhập địa điểm" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ marginTop: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label>Ngày & giờ</label>
              <input className="form-input" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nhà tài trợ</label>
              <select className="form-input" value={selectedBusinessKey || ''} onChange={e => {
                const v = e.target.value;
                setSelectedBusinessKey(v);
                if (v === '__manual') {
                  setForm({ ...form, sponsor: '' });
                } else if (!v) {
                  setForm({ ...form, sponsor: '' });
                } else {
                  const b = businesses.find(x => String(x._id) === String(v));
                  const text = b ? (b.companyName || (b.userId && (b.userId.name || b.userId.email)) || b._id) : '';
                  setForm({ ...form, sponsor: text });
                }
              }}>
                <option value="">-- Chọn nhà tài trợ --</option>
                {businesses.map(b => (
                  <option key={b._id} value={b._id}>{b.companyName || (b.userId && (b.userId.name || b.userId.email)) || b._id}</option>
                ))}
                <option value="__manual">Khác (nhập tay)</option>
              </select>

              {selectedBusinessKey === '__manual' && (
                <input className="form-input" placeholder="Nhập nhà tài trợ" value={form.sponsor} onChange={e => setForm({ ...form, sponsor: e.target.value })} style={{ marginTop: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea className="form-input" rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Hình ảnh</label>
              <input type="file" accept="image/*" onChange={handleImageInput} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {eventImages.map(url => (
                  <div key={url} style={{ position: 'relative' }}>
                    <img src={url} alt="event" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    <button type="button" onClick={() => removeEventImage(url)} style={{ position: 'absolute', right: 4, top: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>x</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-success" type="submit">{editingId ? 'Lưu' : 'Tạo'}</button>
              {editingId && <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => { setEditingId(null); setForm({ title: '', description: '', location: '', date: '', sponsor: '' }); }}>Hủy</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventsAdmin;
