import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NewsAdmin = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', thumbnail: '', images: '' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/news`);
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchNews', err);
      toast.error('Không thể tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ title: '', content: '', thumbnail: '' }); };
  const openEdit = (n) => { setEditingId(n._id); setForm({ title: n.title || '', content: n.content || '', thumbnail: n.thumbnail || '', images: (n.images && n.images.join(', ')) || '' }); };

  const submit = async (e) => {
    e && e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API}/api/news/${editingId}` : `${API}/api/news`;
      const payload = { ...form };
      // send images as array if provided as comma-separated
      if (payload.images && typeof payload.images === 'string') {
        payload.images = payload.images.split(',').map(s => s.trim()).filter(Boolean);
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      toast.success(editingId ? 'Cập nhật tin tức' : 'Tạo tin tức thành công');
      fetchNews();
      setEditingId(null);
    } catch (err) {
      console.error('news submit', err);
      toast.error(err.message || 'Lỗi');
    }
  };

  const remove = async (id) => {
    if (!confirm('Xác nhận xóa tin tức này?')) return;
    try {
      const res = await fetch(`${API}/api/news/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      toast.success('Đã xóa');
      fetchNews();
    } catch (err) {
      console.error('delete news', err);
      toast.error(err.message || 'Lỗi');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 2 }}>
        <div className="content-header">
          <h2>Quản lý tin tức</h2>
          <button className="btn btn-primary" onClick={openCreate}><FaPlus /> Thêm tin</button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Thumbnail</th>
                <th>Ngày</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {news.map(n => (
                <tr key={n._id}>
                  <td>{n.title}</td>
                  <td>{n.thumbnail ? <img src={n.thumbnail} alt="thumb" style={{ width: 80 }} /> : '-'}</td>
                  <td>{(n.createdAt || '').slice(0,10)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => openEdit(n)}><FaEdit /></button>
                      <button className="btn-icon delete" onClick={() => remove(n._id)}><FaTrash /></button>
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
          <h3>{editingId ? 'Chỉnh sửa tin' : 'Thêm tin mới'}</h3>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Tiêu đề</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Thumbnail (URL)</label>
              <input className="form-input" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Images (URLs, comma separated)</label>
              <input className="form-input" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} placeholder="https://..., https://..." />
            </div>
            <div className="form-group">
              <label>Nội dung</label>
              <textarea className="form-input" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn btn-success" type="submit">{editingId ? 'Lưu' : 'Tạo'}</button>
              {editingId && <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => { setEditingId(null); setForm({ title: '', content: '', thumbnail: '' }); }}>Hủy</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsAdmin;
