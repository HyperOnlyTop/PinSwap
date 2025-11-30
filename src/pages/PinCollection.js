import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePin } from '../contexts/PinContext';
import { FaCamera, FaList, FaQrcode } from 'react-icons/fa';
import toast from 'react-hot-toast';
import PinScanner from '../components/PinScanner';
import './PinCollection.css';

const PinCollection = () => {
  const { user, fetchMe } = useAuth();
  const { pinTypes, addCollectionHistory } = usePin();
  const [activeTab, setActiveTab] = useState('scan');
  const [selectedPin, setSelectedPin] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [scanResult, setScanResult] = useState(null);
  const lastProcessedRef = useRef(null);

  const handlePinSelect = (pin) => { setSelectedPin(pin); setQuantity(1); setScanResult(null); };
  const handleQuantityChange = (e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) setQuantity(v); };

  const handleSubmitCollection = async () => {
    let payloadItems = [];
    let totalPoints = 0;
    if (scanResult && Array.isArray(scanResult.items) && scanResult.items.length) {
      payloadItems = scanResult.items.map(i => ({ pinType: i.pinType, quantity: Number(i.quantity), points: Number(i.points) }));
      totalPoints = Number(scanResult.totalPoints || payloadItems.reduce((s,i) => s + (i.points * i.quantity), 0));
    } else {
      if (!selectedPin) return toast.error('Vui lòng chọn loại pin');
      payloadItems = [{ pinType: selectedPin.name, quantity: Number(quantity), points: Number(selectedPin.points) }];
      totalPoints = selectedPin.points * quantity;
    }
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token'); if (!token) return toast.error('Vui lòng đăng nhập');
      const res = await fetch(`${API}/api/collections`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items: payloadItems, totalPoints, location: 'Trung tâm thu gom', method: activeTab }) });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || 'Không thể lưu kết quả thu gom');
      if (data.collection) payloadItems.forEach(i => addCollectionHistory({ userId: user.id, pinType: i.pinType, quantity: i.quantity, points: i.points * i.quantity, location: 'Trung tâm thu gom', date: (new Date()).toISOString().slice(0,10), status: 'completed' }));
      try { if (typeof fetchMe === 'function') await fetchMe(); } catch (e) { console.warn('fetchMe failed', e); }
      toast.success(`Thu gom thành công! Nhận được ${totalPoints} điểm`);
      setSelectedPin(null); setQuantity(1); setScanResult(null);
    } catch (err) { console.error('submit collection', err); toast.error('Lỗi khi lưu thu gom'); }
  };

  const handlePinDetected = useCallback((data) => {
    if (!data) {
      toast.error('Không phát hiện pin. Vui lòng thử lại.');
      return;
    }

    // Prevent duplicate processing using ref to track last processed data
    const dataKey = JSON.stringify({ 
      mdLen: data.mappedDetections?.length || 0,
      rLen: data.results?.length || 0,
      tp: data.totalPoints || 0
    });
    if (lastProcessedRef.current === dataKey) {
      return; // Skip duplicate call
    }
    lastProcessedRef.current = dataKey;

    // Handle aggregated mappedDetections from PinScanner
    if (Array.isArray(data.mappedDetections) && data.mappedDetections.length) {
      const map = {};
      let total = 0;
      data.mappedDetections.forEach((m) => {
        const name = (m.pinType && m.pinType.name) || m.label || 'Unknown';
        const pointsPer = (m.pinType && m.pinType.points) || 10;
        if (!map[name]) map[name] = { pinType: name, quantity: 0, points: pointsPer };
        map[name].quantity += 1;
        total += pointsPer;
      });
      setSelectedPin(null);
      setScanResult({ items: Object.values(map), totalPoints: total });
      toast.success('Phát hiện nhiều pin, vui lòng xác nhận thu gom');
      return;
    }

    // Handle results array
    if (Array.isArray(data.results) && data.results.length) {
      const last = data.results[data.results.length - 1];
      if (last && Array.isArray(last.detections) && last.detections.length) {
        const first = last.detections[0];
        const label = first && (first.label || first.class || first.name) ? String(first.label || first.class || first.name) : '';
        if (label) {
          let match = pinTypes.find(p => p.name && p.name.toLowerCase() === label.toLowerCase());
          if (!match) {
            match = pinTypes.find((p) => {
              const base = p.name ? p.name.toLowerCase().replace(/^pin\s*/i, '').trim() : '';
              return base === label.toLowerCase() || base.includes(label.toLowerCase()) || label.toLowerCase().includes(base);
            });
          }
          if (match) {
            setSelectedPin(match);
            setScanResult(match);
            toast.success('Quét pin thành công!');
            return;
          }
        }
      }
    }

    // Handle legacy detections array
    if (Array.isArray(data.detections) && data.detections.length) {
      const first = data.detections[0];
      const label = first && (first.label || first.class || first.name) ? String(first.label || first.class || first.name) : '';
      const ocrText = first && first.ocr ? String(first.ocr).trim() : '';

      if (label) {
        const labelLower = label.toLowerCase();
        let match = pinTypes.find((p) => p.name && p.name.toLowerCase() === labelLower);

        if (!match) {
          match = pinTypes.find((p) => {
            const base = p.name ? p.name.toLowerCase().replace(/^pin\s*/i, '').trim() : '';
            return base === labelLower || base.includes(labelLower) || labelLower.includes(base);
          });
        }

        if (!match) {
          match = pinTypes.find((p) => p.name && p.name.toLowerCase().includes(labelLower));
        }

        if (!match && ocrText) {
          const o = ocrText.toLowerCase();
          match = pinTypes.find((p) => p.name && (p.name.toLowerCase().includes(o) || o.includes(p.name.toLowerCase().replace(/^pin\s*/i, '').trim())));
        }

        if (match) {
          setSelectedPin(match);
          setScanResult(match);
          toast.success('Quét pin thành công!');
          return;
        }

        const provisionalName = label && !label.toLowerCase().startsWith('pin') ? `Pin ${label}` : label;
        const provisional = { id: 'detected', name: provisionalName, image: data?.crops?.[0] || '', points: 10 };
        setSelectedPin(provisional);
        setScanResult(provisional);
        toast.success('Phát hiện pin, vui lòng xác nhận loại pin');
        return;
      }
    }

    toast.error('Không phát hiện pin. Vui lòng thử lại.');
  }, [pinTypes]);

  const handleQRScan = () => { toast.success('Quét QR thành công! Nhận được 50 điểm bonus'); };

  if (!user) return (<div className="pin-collection"><div className="container"><div className="text-center"><h2>Vui lòng đăng nhập để sử dụng tính năng này</h2></div></div></div>);

  return (
    <div className="pin-collection">
      <div className="container">
        <div className="page-header"><h1>Thu gom pin</h1><p>Chọn phương thức thu gom pin để tích điểm</p></div>
        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => setActiveTab('scan')}><FaCamera /> Quét camera</button>
          <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}><FaList /> Chọn thủ công</button>
          <button className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}><FaQrcode /> Check-in QR</button>
        </div>

        <div className="tab-content">
          {activeTab === 'scan' && (<div className="scan-section"><div className="scan-area"><PinScanner onResult={handlePinDetected} /></div></div>)}
          {activeTab === 'manual' && (<div className="manual-section"><h3>Chọn loại pin</h3><div className="pin-grid">{pinTypes.map(pin => (<div key={pin.id} className={`pin-card ${selectedPin?.id === pin.id ? 'selected' : ''}`} onClick={() => handlePinSelect(pin)}><img src={pin.image} alt={pin.name} /><h4>{pin.name}</h4><p>{pin.points} điểm</p></div>))}</div></div>)}
          {activeTab === 'qr' && (<div className="qr-section"><div className="qr-area"><FaQrcode className="qr-icon" /><h3>Check-in tại điểm thu gom</h3><p>Quét mã QR tại điểm thu gom để nhận điểm bonus</p><button className="btn btn-primary" onClick={handleQRScan}>Quét mã QR</button></div></div>)}
        </div>

        {(selectedPin || (scanResult && Array.isArray(scanResult.items) && scanResult.items.length)) && (
          <div className="collection-form">
            {scanResult && Array.isArray(scanResult.items) && scanResult.items.length ? (
              <div className="aggregated-summary"><h3>Tổng hợp các pin phát hiện</h3><ul>{scanResult.items.map((it, idx) => (<li key={idx}>{it.pinType} — {it.quantity} cái — {it.points * it.quantity} điểm</li>))}</ul><h4>Tổng điểm: {scanResult.totalPoints} điểm</h4><button className="btn btn-primary btn-large" onClick={handleSubmitCollection}>Xác nhận thu gom ({scanResult.totalPoints} điểm)</button></div>
            ) : (
              <>
                <div className="selected-pin"><img src={selectedPin?.image} alt={selectedPin?.name} /><div className="pin-info"><h3>{selectedPin?.name}</h3><p>{selectedPin?.points} điểm/pin</p></div></div>
                <div className="quantity-section"><label htmlFor="quantity">Số lượng pin:</label><div className="quantity-controls"><button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button><input type="number" id="quantity" value={quantity} onChange={handleQuantityChange} min="1" /><button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button></div></div>
                <button className="btn btn-primary btn-large" onClick={handleSubmitCollection}>Xác nhận thu gom ({selectedPin ? selectedPin.points * quantity : 0} điểm)</button>
                <div className="points-preview"><h3>Tổng điểm nhận được: {selectedPin ? selectedPin.points * quantity : 0}</h3></div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinCollection;
