import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LocationsAdmin = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', openHours: '', type: 'supermarket' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/locations`);
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchLocations', err);
      toast.error('Không thể tải danh sách điểm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', address: '', latitude: '', longitude: '', openHours: '', type: 'supermarket' }); };
  const openEdit = (loc) => { setEditing(loc._id); setForm({ name: loc.name || '', address: loc.address || '', latitude: loc.latitude || '', longitude: loc.longitude || '', openHours: loc.openHours || '', type: loc.type || 'supermarket' }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { name: form.name, address: form.address, latitude: Number(form.latitude), longitude: Number(form.longitude), openHours: form.openHours, type: form.type };
      const opts = {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      };
      const url = editing ? `${API}/api/locations/${editing}` : `${API}/api/locations`;
      const res = await fetch(url, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      toast.success(editing ? 'Cập nhật thành công' : 'Tạo thành công');
      fetchLocations();
      setEditing(null);
    } catch (err) {
      console.error('save location', err);
      toast.error(err.message || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa điểm này?')) return;
    try {
      const res = await fetch(`${API}/api/locations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      toast.success('Đã xóa');
      fetchLocations();
    } catch (err) {
      console.error('delete location', err);
      toast.error(err.message || 'Lỗi');
    }
  };

  return (
    <div>
      <div className="content-header">
        <h2>Quản lý điểm thu gom</h2>
        <div>
          <button className="btn btn-primary" onClick={openCreate}><FaPlus /> Thêm điểm</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 2 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Địa chỉ</th>
                  <th>Loại</th>
                  <th>Toạ độ</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc._id}>
                    <td>{loc.name}</td>
                    <td>{loc.address}</td>
                    <td>{loc.type}</td>
                    <td>{loc.latitude},{loc.longitude}</td>
                    <td>{loc.status}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => openEdit(loc)}><FaEdit /></button>
                      <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => handleDelete(loc._id)}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="settings-card">
            <h3>{editing ? 'Chỉnh sửa điểm' : 'Thêm điểm mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Latitude</label>
                <input className="form-input" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input className="form-input" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Giờ mở</label>
                <input className="form-input" value={form.openHours} onChange={e => setForm({ ...form, openHours: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Loại</label>
                <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="supermarket">Siêu thị</option>
                  <option value="school">Trường học</option>
                  <option value="business">Doanh nghiệp</option>
                  <option value="park">Công viên</option>
                  <option value="healthcare">Y tế</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">{editing ? 'Lưu' : 'Tạo'}</button>
                {editing && <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => { setEditing(null); setForm({ name: '', address: '', latitude: '', longitude: '', openHours: '', type: 'supermarket' }); }}>Hủy</button>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsAdmin;
