import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePin } from '../contexts/PinContext';
import { FaCamera, FaList, FaQrcode, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './PinCollection.css';

const PinCollection = () => {
  const { user, addPoints } = useAuth();
  const { pinTypes, addCollectionHistory } = usePin();
  const [activeTab, setActiveTab] = useState('scan');
  const [selectedPin, setSelectedPin] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handlePinSelect = (pin) => {
    setSelectedPin(pin);
    setQuantity(1);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleSubmitCollection = () => {
    if (!selectedPin) {
      toast.error('Vui lòng chọn loại pin');
      return;
    }

    if (quantity <= 0) {
      toast.error('Số lượng pin phải lớn hơn 0');
      return;
    }

    const totalPoints = selectedPin.points * quantity;
    
    const collection = {
      userId: user.id,
      pinType: selectedPin.name,
      quantity: quantity,
      points: totalPoints,
      location: 'Trung tâm thu gom',
      method: activeTab
    };

    addCollectionHistory(collection);
    addPoints(totalPoints);
    
    toast.success(`Thu gom thành công! Nhận được ${totalPoints} điểm`);
    
    // Reset form
    setSelectedPin(null);
    setQuantity(1);
    setScanResult(null);
  };

  const handleScanPin = () => {
    setIsScanning(true);
    
    // Mock camera scan - replace with actual camera implementation
    setTimeout(() => {
      const randomPin = pinTypes[Math.floor(Math.random() * pinTypes.length)];
      setScanResult(randomPin);
      setSelectedPin(randomPin);
      setIsScanning(false);
      toast.success('Quét pin thành công!');
    }, 2000);
  };

  const handleQRScan = () => {
    // Mock QR scan - replace with actual QR scanner
    toast.success('Quét QR thành công! Nhận được 50 điểm bonus');
    addPoints(50);
  };

  if (!user) {
    return (
      <div className="pin-collection">
        <div className="container">
          <div className="text-center">
            <h2>Vui lòng đăng nhập để sử dụng tính năng này</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-collection">
      <div className="container">
        <div className="page-header">
          <h1>Thu gom pin</h1>
          <p>Chọn phương thức thu gom pin để tích điểm</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <FaCamera /> Quét camera
          </button>
          <button
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <FaList /> Chọn thủ công
          </button>
          <button
            className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <FaQrcode /> Check-in QR
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'scan' && (
            <div className="scan-section">
              <div className="scan-area">
                {!isScanning && !scanResult ? (
                  <div className="scan-placeholder">
                    <FaCamera className="scan-icon" />
                    <h3>Quét pin bằng camera</h3>
                    <p>Đặt pin vào khung và nhấn nút quét</p>
                    <button className="btn btn-primary" onClick={handleScanPin}>
                      Bắt đầu quét
                    </button>
                  </div>
                ) : isScanning ? (
                  <div className="scanning">
                    <div className="scanning-animation">
                      <div className="scan-line"></div>
                    </div>
                    <h3>Đang quét...</h3>
                    <p>Vui lòng giữ pin trong khung</p>
                  </div>
                ) : (
                  <div className="scan-result">
                    <div className="result-pin">
                      <img src={scanResult.image} alt={scanResult.name} />
                      <h3>{scanResult.name}</h3>
                      <p>{scanResult.points} điểm/pin</p>
                    </div>
                    <div className="result-actions">
                      <button className="btn btn-secondary" onClick={() => setScanResult(null)}>
                        <FaTimes /> Quét lại
                      </button>
                      <button className="btn btn-success" onClick={() => setSelectedPin(scanResult)}>
                        <FaCheck /> Xác nhận
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="manual-section">
              <h3>Chọn loại pin</h3>
              <div className="pin-grid">
                {pinTypes.map((pin) => (
                  <div
                    key={pin.id}
                    className={`pin-card ${selectedPin?.id === pin.id ? 'selected' : ''}`}
                    onClick={() => handlePinSelect(pin)}
                  >
                    <img src={pin.image} alt={pin.name} />
                    <h4>{pin.name}</h4>
                    <p>{pin.points} điểm</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="qr-section">
              <div className="qr-area">
                <FaQrcode className="qr-icon" />
                <h3>Check-in tại điểm thu gom</h3>
                <p>Quét mã QR tại điểm thu gom để nhận điểm bonus</p>
                <button className="btn btn-primary" onClick={handleQRScan}>
                  Quét mã QR
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quantity and Submit */}
        {selectedPin && (
          <div className="collection-form">
            <div className="selected-pin">
              <img src={selectedPin.image} alt={selectedPin.name} />
              <div className="pin-info">
                <h3>{selectedPin.name}</h3>
                <p>{selectedPin.points} điểm/pin</p>
              </div>
            </div>

            <div className="quantity-section">
              <label htmlFor="quantity">Số lượng pin:</label>
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                />
                <button
                  className="quantity-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="points-preview">
              <h3>Tổng điểm nhận được: {selectedPin.points * quantity}</h3>
            </div>

            <button className="btn btn-primary btn-large" onClick={handleSubmitCollection}>
              Xác nhận thu gom
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinCollection;
