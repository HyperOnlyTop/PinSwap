import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUsers, FaBuilding, FaRecycle, FaGift, FaChartBar, FaCog, FaPlus, FaEdit, FaTrash, FaComments, FaCalendarAlt } from 'react-icons/fa';
import EventsAdmin from './EventsAdmin';
import LocationsAdmin from './LocationsAdmin';
import NewsAdmin from './NewsAdmin';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // live data states
  const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, totalLocations: 0, totalNews: 0, totalPoints: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [voucherForm, setVoucherForm] = useState({ businessId: '', title: '', description: '', expiry: '', images: '', quantity: 0, pointsRequired: 0, status: 'active' });
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [voucherImages, setVoucherImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [feedbackFormMessage, setFeedbackFormMessage] = useState('');

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    // load dashboard stats and lists
    const load = async () => {
      await loadAdminData();
    };
    load();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, usersRes, businessesRes, locationsRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/users?limit=10`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/businesses?pending=true`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/locations`),
        fetch(`${API}/api/admin/vouchers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (usersRes.ok) {
        const u = await usersRes.json();
        setRecentUsers(u.users || []);
      }
      if (businessesRes.ok) {
        const b = await businessesRes.json();
        setPendingBusinesses(b.businesses || []);
      }
      // vouchers
      try {
        const vres = await (await fetch(`${API}/api/admin/vouchers`, { headers: { Authorization: `Bearer ${token}` } })).json();
        if (vres && Array.isArray(vres.vouchers)) setVouchers(vres.vouchers);
      } catch (err) {
        // ignore
      }

      // all businesses for voucher dropdown
      try {
        const bres = await fetch(`${API}/api/admin/businesses`, { headers: { Authorization: `Bearer ${token}` } });
        if (bres.ok) {
          const jb = await bres.json();
          // adminController.listBusinesses returns { businesses }
          if (jb.businesses && Array.isArray(jb.businesses)) setAllBusinesses(jb.businesses);
          else if (Array.isArray(jb)) setAllBusinesses(jb);
        }
      } catch (err) {
        // ignore
      }
      if (locationsRes.ok) {
        const locs = await locationsRes.json();
        setRecentCollections((locs || []).slice(0, 10).map(l => ({ id: l._id, user: l.name || '', pinType: l.type, quantity: 0, points: 0, date: (l.createdAt || '').slice(0,10) })));
      }
      // don't load feedbacks here - loaded on demand when admin opens the tab
    } catch (err) {
      console.error('load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  // load feedbacks when admin opens the feedback tab
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab !== 'feedback') return;
    const loadFeedbacks = async () => {
      try {
        const res = await fetch(`${API}/api/feedback`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          console.error('Failed to load feedbacks', res.status);
          setFeedbacks([]);
          return;
        }
        const data = await res.json();
        setFeedbacks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('loadFeedbacks error', err);
        setFeedbacks([]);
      }
    };
    loadFeedbacks();
  }, [activeTab, user]);

  // load paginated lists when switching to tabs
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 'users') {
      loadUsersPage(1, usersLimit, usersSearch);
    }
    if (activeTab === 'businesses') {
      loadBusinessesPage(1, businessesLimit, businessesSearch);
    }
  }, [activeTab, user]);

  // forms state for users and businesses
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', phone: '', address: '', role: 'citizen' });
  const [editingUserId, setEditingUserId] = useState(null);
  // users management pagination/search
  const [usersList, setUsersList] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(10);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [businessForm, setBusinessForm] = useState({ userId: '', companyName: '', taxCode: '', verified: false });
  const [editingBusinessId, setEditingBusinessId] = useState(null);
  // businesses management pagination/search
  const [businessesList, setBusinessesList] = useState([]);
  const [businessesPage, setBusinessesPage] = useState(1);
  const [businessesLimit, setBusinessesLimit] = useState(10);
  const [businessesTotal, setBusinessesTotal] = useState(0);
  const [businessesSearch, setBusinessesSearch] = useState('');
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  // User CRUD
  const handleEditUser = (u) => {
    setEditingUserId(u._id || u.id);
    setUserForm({ name: u.name || '', email: u.email || '', password: '', phone: u.phone || '', address: u.address || '', role: u.role || u.type || 'citizen' });
  };

  const handleCancelEditUser = () => { setEditingUserId(null); setUserForm({ name: '', email: '', password: '', phone: '', address: '', role: 'citizen' }); };

  const submitUser = async (e) => {
    e && e.preventDefault();
    try {
      const method = editingUserId ? 'PUT' : 'POST';
      const url = editingUserId ? `${API}/api/admin/users/${editingUserId}` : `${API}/api/admin/users`;
      const payload = { ...userForm };
      // don't send empty password on update
      if (editingUserId && !payload.password) delete payload.password;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      // refresh users list if on users tab
      if (activeTab === 'users') await loadUsersPage(usersPage, usersLimit, usersSearch);
      handleCancelEditUser();
    } catch (err) {
      console.error('submitUser', err);
      alert(err.message || 'Lỗi');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Xác nhận xóa người dùng này?')) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      // refresh usersList if viewing users tab, otherwise refresh admin data
      if (activeTab === 'users') await loadUsersPage(usersPage, usersLimit, usersSearch);
      else await loadAdminData();
    } catch (err) {
      console.error('deleteUser', err);
      alert(err.message || 'Lỗi');
    }
  };

  const lockUser = async (id) => {
    if (!confirm('Bạn có chắc muốn khóa tài khoản này?')) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/lock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (activeTab === 'users') await loadUsersPage(usersPage, usersLimit, usersSearch);
      else await loadAdminData();
      alert('Đã khóa tài khoản thành công');
    } catch (err) {
      console.error('lockUser', err);
      alert(err.message || 'Lỗi');
    }
  };

  const unlockUser = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (activeTab === 'users') await loadUsersPage(usersPage, usersLimit, usersSearch);
      else await loadAdminData();
      alert('Đã mở khóa tài khoản thành công');
    } catch (err) {
      console.error('unlockUser', err);
      alert(err.message || 'Lỗi');
    }
  };

  const lockBusiness = async (id) => {
    if (!confirm('Bạn có chắc muốn khóa doanh nghiệp này?')) return;
    try {
      const res = await fetch(`${API}/api/admin/businesses/${id}/lock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (activeTab === 'businesses') await loadBusinessesPage(businessesPage, businessesLimit, businessesSearch);
      else await loadAdminData();
      alert('Đã khóa doanh nghiệp thành công');
    } catch (err) {
      console.error('lockBusiness', err);
      alert(err.message || 'Lỗi');
    }
  };

  const unlockBusiness = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/businesses/${id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (activeTab === 'businesses') await loadBusinessesPage(businessesPage, businessesLimit, businessesSearch);
      else await loadAdminData();
      alert('Đã mở khóa doanh nghiệp thành công');
    } catch (err) {
      console.error('unlockBusiness', err);
      alert(err.message || 'Lỗi');
    }
  };

  // Business CRUD & approve
  const handleEditBusiness = (b) => {
    setEditingBusinessId(b._id);
    setBusinessForm({ userId: b.userId?._id || (b.userId || ''), companyName: b.companyName || '', taxCode: b.taxCode || '', verified: !!b.verified });
  };

  const handleCancelEditBusiness = () => { setEditingBusinessId(null); setBusinessForm({ userId: '', companyName: '', taxCode: '', verified: false }); };

  const submitBusiness = async (e) => {
    e && e.preventDefault();
    try {
      const method = editingBusinessId ? 'PUT' : 'POST';
      const url = editingBusinessId ? `${API}/api/admin/businesses/${editingBusinessId}` : `${API}/api/admin/businesses`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(businessForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (activeTab === 'businesses') await loadBusinessesPage(businessesPage, businessesLimit, businessesSearch);
      else await loadAdminData();
      handleCancelEditBusiness();
    } catch (err) {
      console.error('submitBusiness', err);
      alert(err.message || 'Lỗi');
    }
  };

  const deleteBusiness = async (id) => {
    if (!confirm('Xác nhận xóa doanh nghiệp này?')) return;
    try {
      const res = await fetch(`${API}/api/admin/businesses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (activeTab === 'businesses') await loadBusinessesPage(businessesPage, businessesLimit, businessesSearch);
      else await loadAdminData();
    } catch (err) {
      console.error('deleteBusiness', err);
      alert(err.message || 'Lỗi');
    }
  };

  const approveBusinessNow = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/businesses/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      await loadAdminData();
    } catch (err) {
      console.error('approveBusinessNow', err);
      alert(err.message || 'Lỗi');
    }
  };

  // Vouchers CRUD
  const handleEditVoucher = (v) => {
    setEditingVoucherId(v._id);
    setVoucherForm({ businessId: v.businessId?._id || (v.businessId || ''), title: v.title || '', description: v.description || '', expiry: v.expiry ? (new Date(v.expiry)).toISOString().slice(0,10) : '', images: (v.images && v.images.length) ? v.images.join(', ') : '', quantity: v.quantity || 0, pointsRequired: v.pointsRequired || 0, status: v.status || 'active' });
    setVoucherImages((v.images && v.images.length) ? v.images.slice() : []);
  };

  const handleCancelEditVoucher = () => { setEditingVoucherId(null); setVoucherForm({ businessId: '', title: '', description: '', expiry: '', images: '', quantity: 0, pointsRequired: 0, status: 'active' }); setVoucherImages([]); };

  const submitVoucher = async (e) => {
    e && e.preventDefault();
    try {
      const method = editingVoucherId ? 'PUT' : 'POST';
      const url = editingVoucherId ? `${API}/api/admin/vouchers/${editingVoucherId}` : `${API}/api/admin/vouchers`;
      const payload = { ...voucherForm };
      // convert expiry empty string to undefined
      if (!payload.expiry) delete payload.expiry;
      // use uploaded images array
      payload.images = voucherImages.slice();
      // ensure pointsRequired is a number
      payload.pointsRequired = Number(payload.pointsRequired) || 0;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      await loadAdminData();
      handleCancelEditVoucher();
    } catch (err) {
      console.error('submitVoucher', err);
      alert(err.message || 'Lỗi');
    }
  };

  // Upload image file to backend and append returned URL to voucherImages
  const uploadImageFile = async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      if (data.url) {
        setVoucherImages(prev => [...prev, data.url]);
      }
    } catch (err) {
      console.error('uploadImageFile', err);
      alert('Upload ảnh thất bại');
    }
  };

  const handleFileInput = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    uploadImageFile(f);
    // clear input
    e.target.value = '';
  };

  const removeImage = (url) => {
    setVoucherImages(prev => prev.filter(u => u !== url));
  };

  const deleteVoucher = async (id) => {
    if (!confirm('Xác nhận xóa voucher này?')) return;
    try {
      const res = await fetch(`${API}/api/admin/vouchers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      await loadAdminData();
    } catch (err) {
      console.error('deleteVoucher', err);
      alert(err.message || 'Lỗi');
    }
  };

  const deleteFeedback = async (id) => {
    if (!confirm('Xác nhận xóa phản hồi này?')) return;
    try {
      const res = await fetch(`${API}/api/feedback/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      // refresh list
      setFeedbacks(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error('deleteFeedback', err);
      alert(err.message || 'Lỗi');
    }
  };

  const [showUserHistory, setShowUserHistory] = useState(false);
  const [historyUserId, setHistoryUserId] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);

  const loadHistoryPage = async (userId, page = 1) => {
    try {
      const res = await fetch(`${API}/api/feedback?userId=${userId}&page=${page}&limit=${historyLimit}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        setHistoryItems([]);
        setHistoryTotal(0);
        return;
      }
      const data = await res.json();
      setHistoryItems(Array.isArray(data.items) ? data.items : []);
      setHistoryTotal(data.total || 0);
      setHistoryPage(data.page || page);
    } catch (err) {
      console.error('loadHistoryPage', err);
      setHistoryItems([]);
      setHistoryTotal(0);
    }
  };

  const openUserHistory = async (userId) => {
    if (!userId) return alert('Không có userId');
    setHistoryUserId(userId);
    setShowUserHistory(true);
    await loadHistoryPage(userId, 1);
  };

  const closeUserHistory = () => {
    setShowUserHistory(false);
    setHistoryUserId(null);
    setHistoryItems([]);
  };

  const historyPrev = () => {
    if (historyPage <= 1) return;
    const next = historyPage - 1;
    loadHistoryPage(historyUserId, next);
  };

  const historyNext = () => {
    const maxPage = Math.ceil(historyTotal / historyLimit) || 1;
    if (historyPage >= maxPage) return;
    const next = historyPage + 1;
    loadHistoryPage(historyUserId, next);
  };

  const handleEditFeedback = (f) => {
    setEditingFeedbackId(f._id);
    setFeedbackFormMessage(f.message || '');
  };

  const cancelEditFeedback = () => {
    setEditingFeedbackId(null);
    setFeedbackFormMessage('');
  };

  // Users / Businesses pagination + search loaders
  const loadUsersPage = async (page = 1, limit = usersLimit, search = usersSearch) => {
    setLoadingUsers(true);
    try {
      if (!token) {
        alert('Không có token. Vui lòng đăng nhập lại.');
        setUsersList([]);
        setUsersTotal(0);
        return;
      }
      const q = `?page=${page}&limit=${limit}` + (search ? `&search=${encodeURIComponent(search)}` : '');
      const res = await fetch(`${API}/api/admin/users${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        let text = '';
        try { text = await res.text(); } catch(e) {}
        console.error('loadUsersPage bad response', res.status, text);
        alert('Lỗi khi tải danh sách người dùng: ' + (res.status || '')); 
        setUsersList([]);
        setUsersTotal(0);
        return;
      }
      const data = await res.json();
      // support responses { users, total, page, limit } or plain array
      let items = data.users || (Array.isArray(data) ? data : []);
      // client-side filter fallback when server didn't apply search
      if (search && items.length > 0) {
        const s = search.toLowerCase();
        const filtered = items.filter(it => ((it.name || '') + ' ' + (it.email || '')).toLowerCase().includes(s));
        if (filtered.length > 0) items = filtered;
      }
      setUsersList(items);
      setUsersTotal(data.total || (items.length));
      setUsersPage(data.page || page);
      setUsersLimit(data.limit || limit);
    } catch (err) {
      console.error('loadUsersPage', err);
      alert('Lỗi khi tải danh sách người dùng');
      setUsersList([]);
      setUsersTotal(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadBusinessesPage = async (page = 1, limit = businessesLimit, search = businessesSearch) => {
    setLoadingBusinesses(true);
    try {
      if (!token) {
        alert('Không có token. Vui lòng đăng nhập lại.');
        setBusinessesList([]);
        setBusinessesTotal(0);
        return;
      }
      const q = `?page=${page}&limit=${limit}` + (search ? `&search=${encodeURIComponent(search)}` : '');
      const res = await fetch(`${API}/api/admin/businesses${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        let text = '';
        try { text = await res.text(); } catch(e) {}
        console.error('loadBusinessesPage bad response', res.status, text);
        alert('Lỗi khi tải danh sách doanh nghiệp: ' + (res.status || ''));
        setBusinessesList([]);
        setBusinessesTotal(0);
        return;
      }
      const data = await res.json();
      let items = data.businesses || (Array.isArray(data) ? data : []);
      if (search && items.length > 0) {
        const s = search.toLowerCase();
        const filtered = items.filter(it => ((it.companyName || '') + ' ' + (it.userId?.name || '') + ' ' + (it.userId?.email || '')).toLowerCase().includes(s));
        if (filtered.length > 0) items = filtered;
      }
      setBusinessesList(items);
      setBusinessesTotal(data.total || (items.length));
      setBusinessesPage(data.page || page);
      setBusinessesLimit(data.limit || limit);
    } catch (err) {
      console.error('loadBusinessesPage', err);
      alert('Lỗi khi tải danh sách doanh nghiệp');
      setBusinessesList([]);
      setBusinessesTotal(0);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const submitFeedbackForm = async (e) => {
    e && e.preventDefault();
    if (!feedbackFormMessage.trim()) return alert('Nhập nội dung phản hồi');
    try {
      const payload = { message: feedbackFormMessage.trim() };
      const method = editingFeedbackId ? 'PUT' : 'POST';
      const url = editingFeedbackId ? `${API}/api/feedback/${editingFeedbackId}` : `${API}/api/feedback`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Error');
      // update local list
      if (editingFeedbackId) {
        setFeedbacks(prev => prev.map(f => (f._id === editingFeedbackId ? data : f)));
        cancelEditFeedback();
      } else {
        setFeedbacks(prev => [data, ...prev]);
        setFeedbackFormMessage('');
      }
    } catch (err) {
      console.error('submitFeedbackForm', err);
      alert(err.message || 'Lỗi');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="text-center">
            <h2>Bạn không có quyền truy cập trang này</h2>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Tổng quan', icon: <FaChartBar /> },
    { id: 'users', name: 'Người dùng', icon: <FaUsers /> },
    { id: 'businesses', name: 'Doanh nghiệp', icon: <FaBuilding /> },
    { id: 'news', name: 'Tin tức', icon: <FaChartBar /> },
    { id: 'events', name: 'Sự kiện', icon: <FaCalendarAlt /> },
    { id: 'collections', name: 'Thu gom pin', icon: <FaRecycle /> },
    { id: 'locations', name: 'Điểm thu gom', icon: <FaRecycle /> },
    { id: 'vouchers', name: 'Voucher', icon: <FaGift /> },
    { id: 'feedback', name: 'Phản hồi', icon: <FaComments /> },
    { id: 'settings', name: 'Cài đặt', icon: <FaCog /> }
  ];

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Quản lý hệ thống Pin Swap</p>
        </div>

        <div className="admin-content">
          {/* Sidebar */}
          <div className="admin-sidebar">
            <div className="sidebar-header">
              <h3>Quản lý</h3>
            </div>
            <nav className="sidebar-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="admin-main">
            {activeTab === 'dashboard' && (
              <div className="dashboard-content">
                {/* Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <FaUsers />
                    </div>
                    <div className="stat-content">
                      <h3>{(stats.totalUsers || 0).toLocaleString()}</h3>
                      <p>Tổng người dùng</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <FaBuilding />
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalBusinesses || 0}</h3>
                      <p>Doanh nghiệp</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <FaRecycle />
                    </div>
                    <div className="stat-content">
                      <h3>{(stats.totalLocations || 0).toLocaleString()}</h3>
                      <p>Pin đã thu gom</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <FaGift />
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalNews || 0}</h3>
                      <p>Tin tức</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="activity-section">
                  <div className="activity-card">
                    <h3>Người dùng mới</h3>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Loại</th>
                            <th>Ngày tham gia</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map(u => (
                            <tr key={u._id || u.id}>
                              <td>{u.name}</td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`type-badge ${u.role || u.type}`}>
                                  {u.role === 'citizen' || u.type === 'user' ? 'Người dân' : (u.role === 'business' ? 'Doanh nghiệp' : u.role)}
                                </span>
                              </td>
                              <td>{(u.createdAt || u.joinDate || '').slice(0,10)}</td>
                              <td>
                                <span className={`status-badge ${u.status || 'active'}`}>
                                  {(u.status === 'active' || u.status === undefined) ? 'Hoạt động' : u.status}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button className="btn-icon edit" title="Chỉnh sửa" onClick={() => handleEditUser(u)}>
                                    <FaEdit />
                                  </button>
                                  {(u.status === 'locked') ? (
                                    <button className="btn-icon unlock" title="Mở khóa" onClick={() => unlockUser(u._id || u.id)}>
                                      🔓
                                    </button>
                                  ) : (
                                    <button className="btn-icon lock" title="Khóa tài khoản" onClick={() => lockUser(u._id || u.id)}>
                                      🔒
                                    </button>
                                  )}
                                  <button className="btn-icon delete" title="Xóa" onClick={() => deleteUser(u._id || u.id)}>
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="activity-card">
                    <h3>Thu gom pin gần đây</h3>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Người dùng</th>
                            <th>Loại pin</th>
                            <th>Số lượng</th>
                            <th>Điểm</th>
                            <th>Ngày</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentCollections.map(collection => (
                            <tr key={collection.id}>
                              <td>{collection.user}</td>
                              <td>{collection.pinType}</td>
                              <td>{collection.quantity}</td>
                              <td>{collection.points}</td>
                              <td>{collection.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-content" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 2 }}>
                  <div className="content-header">
                    <h2>Quản lý người dùng</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input placeholder="Tìm theo tên hoặc email" value={usersSearch} onChange={e => setUsersSearch(e.target.value)} className="form-input" style={{ width: 260 }} />
                      <button className="btn btn-outline" onClick={() => loadUsersPage(1, usersLimit, usersSearch)} style={{ padding: '8px 12px' }} disabled={loadingUsers}>{loadingUsers ? 'Đang tải...' : 'Tìm'}</button>
                      <button className="btn btn-primary" onClick={() => { handleCancelEditUser(); setUsersSearch(''); loadUsersPage(1, usersLimit, ''); }}><FaPlus /> Thêm người dùng</button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tên</th>
                          <th>Email</th>
                          <th>Loại</th>
                          <th>Trạng thái</th>
                          <th>Ngày</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map(u => (
                          <tr key={u._id || u.id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role || u.type}</td>
                            <td>
                              <span className={`status-badge ${u.status === 'locked' ? 'locked' : 'active'}`}>
                                {u.status === 'locked' ? 'Đã khóa' : 'Hoạt động'}
                              </span>
                            </td>
                            <td>{(u.createdAt || '').slice(0,10)}</td>
                            <td>
                              <button className="btn btn-outline" onClick={() => handleEditUser(u)}><FaEdit /></button>
                              {u.status === 'locked' ? (
                                <button className="btn btn-success" style={{ marginLeft: 8 }} onClick={() => unlockUser(u._id || u.id)} title="Mở khóa">🔓</button>
                              ) : (
                                <button className="btn btn-warning" style={{ marginLeft: 8 }} onClick={() => lockUser(u._id || u.id)} title="Khóa">🔒</button>
                              )}
                              <button className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => deleteUser(u._id || u.id)}><FaTrash /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div>Hiển thị trang {usersPage} / {Math.max(1, Math.ceil(usersTotal / usersLimit))}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={usersLimit} onChange={e => { const l = Number(e.target.value); setUsersLimit(l); loadUsersPage(1, l, usersSearch); }} className="form-input" style={{ width: 88 }}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                      </select>
                      <button className="btn btn-outline" onClick={() => { if (usersPage <= 1) return; loadUsersPage(usersPage - 1, usersLimit, usersSearch); }} disabled={usersPage <= 1}>Trước</button>
                      <button className="btn btn-outline" onClick={() => { if (usersPage >= Math.ceil(usersTotal / usersLimit)) return; loadUsersPage(usersPage + 1, usersLimit, usersSearch); }} disabled={usersPage >= Math.ceil(usersTotal / usersLimit)}>Tiếp</button>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="settings-card">
                    <h3>{editingUserId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
                    <form onSubmit={submitUser}>
                      <div className="form-group">
                        <label>Tên</label>
                        <input className="form-input" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input className="form-input" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Mật khẩu {editingUserId ? '(để trống nếu không đổi)' : ''}</label>
                        <input className="form-input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Loại</label>
                        <select className="form-input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                          <option value="citizen">Người dân</option>
                          <option value="business">Doanh nghiệp</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-success">{editingUserId ? 'Lưu' : 'Tạo'}</button>
                        {editingUserId && <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleCancelEditUser}>Hủy</button>}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'businesses' && (
              <div className="businesses-content" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 2 }}>
                  <div className="content-header">
                    <h2>Quản lý doanh nghiệp</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input placeholder="Tìm theo tên hoặc email người liên hệ" value={businessesSearch} onChange={e => setBusinessesSearch(e.target.value)} className="form-input" style={{ width: 300 }} />
                      <button className="btn btn-outline" onClick={() => loadBusinessesPage(1, businessesLimit, businessesSearch)} style={{ padding: '8px 12px' }} disabled={loadingBusinesses}>{loadingBusinesses ? 'Đang tải...' : 'Tìm'}</button>
                      <button className="btn btn-primary" onClick={() => { handleCancelEditBusiness(); setBusinessesSearch(''); loadBusinessesPage(1, businessesLimit, ''); }}><FaPlus /> Thêm doanh nghiệp</button>
                    </div>
                  </div>

                  <div className="pending-section">
                    <h3>Doanh nghiệp</h3>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tên doanh nghiệp</th>
                            <th>Người liên hệ</th>
                            <th>Mã số thuế</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {businessesList.map(business => (
                            <tr key={business._id || business.id}>
                              <td>{business.companyName}</td>
                              <td>{business.userId ? (business.userId.name || business.userId.email) : ''}</td>
                              <td>{business.taxCode}</td>
                              <td>
                                <span className={`status-badge ${business.verified ? 'active' : 'pending'}`}>{business.verified ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  {!business.verified && <button className="btn btn-success btn-sm" onClick={() => approveBusinessNow(business._id)}>Duyệt</button>}
                                  <button className="btn btn-outline btn-sm" onClick={() => handleEditBusiness(business)} style={{ marginLeft: 8 }}><FaEdit /></button>
                                  {business.verified ? (
                                    <button className="btn btn-warning btn-sm" onClick={() => lockBusiness(business._id)} style={{ marginLeft: 8 }} title="Khóa">🔒</button>
                                  ) : (
                                    <button className="btn btn-success btn-sm" onClick={() => unlockBusiness(business._id)} style={{ marginLeft: 8 }} title="Mở khóa">🔓</button>
                                  )}
                                  <button className="btn btn-danger btn-sm" onClick={() => deleteBusiness(business._id)} style={{ marginLeft: 8 }}><FaTrash /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <div>Hiển thị trang {businessesPage} / {Math.max(1, Math.ceil(businessesTotal / businessesLimit))}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select value={businessesLimit} onChange={e => { const l = Number(e.target.value); setBusinessesLimit(l); loadBusinessesPage(1, l, businessesSearch); }} className="form-input" style={{ width: 88 }}>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                        </select>
                        <button className="btn btn-outline" onClick={() => { if (businessesPage <= 1) return; loadBusinessesPage(businessesPage - 1, businessesLimit, businessesSearch); }} disabled={businessesPage <= 1}>Trước</button>
                        <button className="btn btn-outline" onClick={() => { if (businessesPage >= Math.ceil(businessesTotal / businessesLimit)) return; loadBusinessesPage(businessesPage + 1, businessesLimit, businessesSearch); }} disabled={businessesPage >= Math.ceil(businessesTotal / businessesLimit)}>Tiếp</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="settings-card">
                    <h3>{editingBusinessId ? 'Chỉnh sửa doanh nghiệp' : 'Thêm doanh nghiệp mới'}</h3>
                    <form onSubmit={submitBusiness}>
                      <div className="form-group">
                        <label>User ID (tùy chọn)</label>
                        <input className="form-input" value={businessForm.userId} onChange={e => setBusinessForm({ ...businessForm, userId: e.target.value })} placeholder="ObjectId của user (nếu có)" />
                      </div>
                      <div className="form-group">
                        <label>Tên công ty</label>
                        <input className="form-input" value={businessForm.companyName} onChange={e => setBusinessForm({ ...businessForm, companyName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Mã số thuế</label>
                        <input className="form-input" value={businessForm.taxCode} onChange={e => setBusinessForm({ ...businessForm, taxCode: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>
                          <input type="checkbox" checked={businessForm.verified} onChange={e => setBusinessForm({ ...businessForm, verified: e.target.checked })} /> Đã duyệt
                        </label>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-success">{editingBusinessId ? 'Lưu' : 'Tạo'}</button>
                        {editingBusinessId && <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleCancelEditBusiness}>Hủy</button>}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Locations tab */}
            {activeTab === 'locations' && (
              <div>
                <LocationsAdmin />
              </div>
            )}

            {/* News admin */}
            {activeTab === 'news' && (
              <div>
                <NewsAdmin />
              </div>
            )}

            {/* Events admin */}
            {activeTab === 'events' && (
              <div>
                <EventsAdmin />
              </div>
            )}

            {/* Other tabs content placeholder */}
            {activeTab === 'vouchers' && (
              <div className="vouchers-content" style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 2 }}>
                  <div className="content-header">
                    <h2>Quản lý Voucher</h2>
                    <button className="btn btn-primary" onClick={() => handleCancelEditVoucher()}><FaPlus /> Thêm voucher</button>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tiêu đề</th>
                          <th>Doanh nghiệp</th>
                          <th>Hạn</th>
                          <th>Số lượng</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.map(v => (
                          <tr key={v._id || v.id}>
                            <td>{v.title}</td>
                            <td>{v.businessId ? (v.businessId.companyName || v.businessId._id) : ''}</td>
                            <td>{v.expiry ? (new Date(v.expiry)).toISOString().slice(0,10) : ''}</td>
                            <td>{v.quantity}</td>
                            <td>{v.status}</td>
                            <td>
                              <button className="btn btn-outline" onClick={() => handleEditVoucher(v)}><FaEdit /></button>
                              <button className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => deleteVoucher(v._id || v.id)}><FaTrash /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="settings-card">
                    <h3>{editingVoucherId ? 'Chỉnh sửa voucher' : 'Thêm voucher mới'}</h3>
                    <form onSubmit={submitVoucher}>
                      <div className="form-group">
                        <label>Doanh nghiệp (tùy chọn)</label>
                        <select className="form-input" value={voucherForm.businessId || ''} onChange={e => setVoucherForm({ ...voucherForm, businessId: e.target.value })}>
                          <option value="">-- Không chọn --</option>
                          {allBusinesses.map(b => (
                            <option key={b._id || b.id} value={b._id || b.id}>{b.companyName || (b.userId?._id || b._id)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tiêu đề</label>
                        <input className="form-input" value={voucherForm.title} onChange={e => setVoucherForm({ ...voucherForm, title: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Mô tả</label>
                        <textarea className="form-input" value={voucherForm.description} onChange={e => setVoucherForm({ ...voucherForm, description: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Hạn</label>
                        <input className="form-input" type="date" value={voucherForm.expiry} onChange={e => setVoucherForm({ ...voucherForm, expiry: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Số lượng</label>
                        <input className="form-input" type="number" value={voucherForm.quantity} onChange={e => setVoucherForm({ ...voucherForm, quantity: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label>Hình ảnh</label>
                        <input className="form-input" type="file" accept="image/*" onChange={handleFileInput} />
                        <div className="image-previews" style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {voucherImages.map(url => (
                            <div key={url} style={{ position: 'relative' }}>
                              <img src={url} alt="preview" style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                              <button type="button" onClick={() => removeImage(url)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Điểm cần thiết để đổi</label>
                        <input className="form-input" type="number" value={voucherForm.pointsRequired || 0} onChange={e => setVoucherForm({ ...voucherForm, pointsRequired: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label>Trạng thái</label>
                        <select className="form-input" value={voucherForm.status} onChange={e => setVoucherForm({ ...voucherForm, status: e.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-success">{editingVoucherId ? 'Lưu' : 'Tạo'}</button>
                        {editingVoucherId && <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={handleCancelEditVoucher}>Hủy</button>}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="feedback-admin">
                <div className="content-header">
                  <h2>Phản hồi người dùng</h2>
                </div>
                <div className="feedback-form-admin" style={{ marginBottom: 12 }}>
                  <form onSubmit={submitFeedbackForm}>
                    <textarea placeholder="Nội dung phản hồi" value={feedbackFormMessage} onChange={e => setFeedbackFormMessage(e.target.value)} style={{ width: '100%', minHeight: 80 }} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" type="submit">{editingFeedbackId ? 'Lưu' : 'Thêm phản hồi'}</button>
                      {editingFeedbackId && <button type="button" className="btn btn-secondary" onClick={cancelEditFeedback}>Hủy</button>}
                    </div>
                  </form>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Nội dung</th>
                        <th>Ngày</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.map(f => (
                        <tr key={f._id}>
                          <td>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span>{(f.userId && (f.userId.name || f.userId.email)) || (f.userId || 'Khách')}</span>
                              {f.userId && (
                                <button className="btn btn-outline" onClick={() => openUserHistory(f.userId)} style={{ padding: '4px 8px' }}>Xem lịch sử</button>
                              )}
                            </div>
                          </td>
                          <td style={{ maxWidth: 400, whiteSpace: 'normal' }}>{f.message}</td>
                          <td>{(f.createdAt || '').slice(0,10)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-outline" onClick={() => handleEditFeedback(f)}><FaEdit /></button>
                              <button className="btn btn-danger" onClick={() => deleteFeedback(f._id)}><FaTrash /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showUserHistory && (
                  <div className="modal" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 6, width: '80%', maxWidth: 800, maxHeight: '80%', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Lịch sử phản hồi của người dùng</h3>
                        <div>
                          <button className="btn btn-secondary" onClick={closeUserHistory}>Đóng</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {historyItems.length === 0 && <div>Không có phản hồi.</div>}
                        {historyItems.map(h => (
                          <div key={h._id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <div style={{ color: '#666', fontSize: 12 }}>{(h.createdAt || '').slice(0,19).replace('T',' ')}</div>
                            <div style={{ marginTop: 6 }}>{h.message}</div>
                          </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                          <div>Hiển thị trang {historyPage} / {Math.max(1, Math.ceil(historyTotal / historyLimit))}</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline" onClick={historyPrev} disabled={historyPage <= 1}>Trước</button>
                            <button className="btn btn-outline" onClick={historyNext} disabled={historyPage >= Math.ceil(historyTotal / historyLimit)}>Tiếp</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'dashboard' && activeTab !== 'businesses' && activeTab !== 'locations' && activeTab !== 'news' && activeTab !== 'vouchers' && (
              <div className="tab-content">
                <h2>{tabs.find(tab => tab.id === activeTab)?.name}</h2>
                <p>Nội dung cho tab {activeTab} sẽ được triển khai sớm.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
