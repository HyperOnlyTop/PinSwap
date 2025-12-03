import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FaQrcode, FaTimes, FaMapMarkerAlt, FaCoins } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './LocationQRScanner.css';

const LocationQRScanner = ({ onClose, onSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    if (scanning && scannerRef.current && !qrScannerRef.current) {
      qrScannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      qrScannerRef.current.render(onScanSuccess, onScanError);
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(console.error);
        qrScannerRef.current = null;
      }
    };
  }, [scanning]);

  const onScanSuccess = async (decodedText) => {
    if (processing) return;
    
    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/locations/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ qrCode: decodedText })
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCoins size={24} color="#ffc107" />
            <div>
              <strong>{data.message}</strong>
              <br />
              <small>Tổng điểm: {data.totalPoints}</small>
            </div>
          </div>,
          { duration: 4000 }
        );
        
        if (onSuccess) {
          onSuccess(data);
        }
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        if (data.alreadyCheckedIn) {
          toast.error('Bạn đã check-in tại địa điểm này hôm nay rồi!');
        } else {
          toast.error(data.message || 'Check-in thất bại');
        }
        setProcessing(false);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Lỗi khi check-in');
      setProcessing(false);
    }
  };

  const onScanError = (error) => {
    // Ignore common scanning errors
    if (error.includes('NotFoundException')) return;
    console.warn('QR scan error:', error);
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h3>
            <FaQrcode /> Quét QR Code tại địa điểm
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="qr-scanner-body">
          {!scanning ? (
            <div className="start-scanning">
              <FaMapMarkerAlt size={80} color="#28a745" />
              <h4>Sẵn sàng quét mã QR</h4>
              <p>Hãy đưa camera đến mã QR tại địa điểm để nhận điểm thưởng</p>
              <button 
                className="btn-start-scan" 
                onClick={() => setScanning(true)}
              >
                <FaQrcode /> Bắt đầu quét
              </button>
            </div>
          ) : (
            <div className="scanner-viewport" ref={scannerRef}>
              <div id="qr-reader"></div>
              
              {processing && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>Đang xử lý...</p>
                </div>
              )}
            </div>
          )}

          <div className="qr-scanner-info">
            <div className="info-item">
              <FaMapMarkerAlt />
              <span>Chỉ quét tại địa điểm có đánh dấu trên bản đồ</span>
            </div>
            <div className="info-item">
              <FaCoins />
              <span>Mỗi địa điểm chỉ được check-in 1 lần/ngày</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationQRScanner;
