import React, { createContext, useContext, useState, useEffect } from 'react';

const VoucherContext = createContext();

export const useVoucher = () => {
  const context = useContext(VoucherContext);
  if (!context) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
};

export const VoucherProvider = ({ children }) => {
  const [vouchers, setVouchers] = useState([]);
  const [exchangeHistory, setExchangeHistory] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/vouchers`);
        if (res.ok) {
          const data = await res.json();
          // map backend voucher shape to frontend-friendly fields
          const mapped = data.map(v => ({
            id: v._id,
            title: v.title,
            name: v.title,
            description: v.description,
            quantity: v.quantity,
            available: v.quantity,
            status: v.status,
            expiry: v.expiry || v.createdAt,
            validUntil: v.expiry || v.createdAt,
            image: (v.images && v.images.length) ? v.images[0] : '',
            images: v.images || [],
            points: v.pointsRequired || 0,
            business: v.businessId ? (v.businessId.companyName || '') : '',
            raw: v
          }));
          setVouchers(mapped);
        }

        // try fetch user's history if logged in
        const token = localStorage.getItem('token');
        if (token) {
          const hRes = await fetch(`${API}/api/vouchers/history/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (hRes.ok) {
            const hist = await hRes.json();
            setExchangeHistory(hist.map(h => ({ id: h._id, voucherId: h.voucherId ? h.voucherId._id : h.voucherId, voucherName: h.voucherId ? (h.voucherId.title || '') : '', code: h.code, createdAt: h.createdAt })));
          }
        }
      } catch (err) {
        console.error('Failed to load vouchers', err);
      }
    };
    load();
  }, []);

  const exchangeVoucher = async (voucherId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Vui lòng đăng nhập để đổi voucher' };
      const res = await fetch(`${API}/api/vouchers/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ voucherId }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Đổi voucher thất bại' };

      // update local vouchers list: decrement quantity
      setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, available: (v.available || v.quantity || 0) - 1 } : v));

      // append to history
      setExchangeHistory(prev => [{ id: Date.now(), voucherId, voucherName: prev.name || '', code: data.code, createdAt: new Date().toISOString(), pointsUsed: data.pointsUsed || 0 }, ...prev]);
      return { success: true, code: data.code, remainingPoints: data.remainingPoints, pointsUsed: data.pointsUsed || 0 };
    } catch (err) {
      console.error('exchangeVoucher error', err);
      return { success: false, error: err.message };
    }
  };

  const createVoucher = (voucherData) => {
    // Client-side helper; prefer calling backend create in admin UI
    const newVoucher = { id: Date.now().toString(), ...voucherData };
    setVouchers(prev => [...prev, newVoucher]);
    return newVoucher;
  };

  const updateVoucher = (id, updates) => {
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVoucher = (id) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
  };

  const getVoucherById = (id) => {
    return vouchers.find(voucher => voucher.id === id);
  };

  const getBusinessById = (id) => {
    return businesses.find(business => business.id === id);
  };

  const value = {
    vouchers,
    exchangeHistory,
    businesses,
    exchangeVoucher,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    getVoucherById,
    getBusinessById
  };

  return (
    <VoucherContext.Provider value={value}>
      {children}
    </VoucherContext.Provider>
  );
};
