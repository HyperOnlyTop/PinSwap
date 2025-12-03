import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaImage, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './VoucherManagement.css';

const VoucherManagement = () => {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsRequired: '',
    quantity: '',
    discount: '',
    expiryDate: '',
    images: [],
    status: 'active'
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // For business users, use 'me' to let backend find their business
      const businessId = user.role === 'business' ? 'me' : 'all';
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/business/${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      } else {
        toast.error('Không thể tải danh sách voucher');
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Lỗi khi tải voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        title: voucher.title || '',
        description: voucher.description || '',
        pointsRequired: voucher.pointsRequired || '',
        quantity: voucher.quantity || '',
        discount: voucher.discount || '',
        expiryDate: voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().split('T')[0] : '',
        images: voucher.images || [],
        status: voucher.status || 'active'
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        title: '',
        description: '',
        pointsRequired: '',
        quantity: '',
        discount: '',
        expiryDate: '',
        images: [],
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVoucher(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingVoucher
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/${editingVoucher._id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/create`;
      
      const method = editingVoucher ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          // Don't send businessId for business users - backend will handle it
          businessId: user.role === 'admin' ? formData.businessId : undefined
        })
      });

      if (response.ok) {
        toast.success(editingVoucher ? 'Cập nhật voucher thành công!' : 'Tạo voucher thành công!');
        handleCloseModal();
        fetchVouchers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error('Lỗi khi lưu voucher');
    }
  };

  const handleDelete = async (voucherId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/${voucherId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        toast.success('Xóa voucher thành công!');
        fetchVouchers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể xóa voucher');
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('Lỗi khi xóa voucher');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="voucher-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-management">
      <div className="page-header">
        <h1>Quản Lý Voucher</h1>
        <button className="btn-create" onClick={() => handleOpenModal()}>
          <FaPlus /> Tạo Voucher Mới
        </button>
      </div>

      <div className="vouchers-grid">
        {vouchers.length === 0 ? (
          <div className="no-vouchers">
            <FaImage size={60} />
            <p>Chưa có voucher nào</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              Tạo Voucher Đầu Tiên
            </button>
          </div>
        ) : (
          vouchers.map(voucher => (
            <div key={voucher._id} className="voucher-card">
              <div className="voucher-image">
                {voucher.images && voucher.images[0] ? (
                  <img 
                    src={
                      voucher.images[0].startsWith('http') 
                        ? voucher.images[0] 
                        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${voucher.images[0].startsWith('/') ? '' : '/'}${voucher.images[0]}`
                    } 
                    alt={voucher.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/voucher-default.jpg';
                    }}
                  />
                ) : (
                  <div className="no-image">
                    <FaImage />
                  </div>
                )}
                <span className={`status-badge ${voucher.status}`}>
                  {voucher.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                </span>
              </div>

              <div className="voucher-content">
                <h3>{voucher.title}</h3>
                <p className="description">{voucher.description}</p>
                
                <div className="voucher-info">
                  <div className="info-item">
                    <span className="label">Điểm:</span>
                    <span className="value">{voucher.pointsRequired}</span>
                  </div>
                  {voucher.discount && (
                    <div className="info-item">
                      <span className="label">Giảm:</span>
                      <span className="value">{voucher.discount}%</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Còn lại:</span>
                    <span className="value">{voucher.quantity}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Hạn:</span>
                    <span className="value">{formatDate(voucher.expiryDate)}</span>
                  </div>
                </div>

                <div className="voucher-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => handleOpenModal(voucher)}
                  >
                    <FaEdit /> Sửa
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(voucher._id)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVoucher ? 'Sửa Voucher' : 'Tạo Voucher Mới'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="voucher-form">
              <div className="form-group">
                <label>Tên voucher *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: Giảm giá 20% cho đơn hàng"
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Mô tả chi tiết về voucher"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Điểm yêu cầu *</label>
                  <input
                    type="number"
                    name="pointsRequired"
                    value={formData.pointsRequired}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Số lượng *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giảm giá (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="0-100"
                  />
                </div>

                <div className="form-group">
                  <label>Hạn sử dụng</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  <FaCheck /> {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
