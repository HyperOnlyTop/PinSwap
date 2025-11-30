import React, { useRef, useState, useEffect } from 'react';
import './PinScanner.css';
import { usePin } from '../contexts/PinContext';

const PinScanner = ({ onResult }) => {
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null); // hidden capture canvas
  const previewImgRef = useRef(null);
  const overlayRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // store per-file responses
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const { pinTypes, getPinTypeByName } = usePin();
  const [mappedDetections, setMappedDetections] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Notify parent when aggregated results change, but do it from an effect
  useEffect(() => {
    // Only call onResult if we have actual results (not initial empty state)
    if (typeof onResult === 'function' && results.length > 0) {
      try {
        onResult({ results, mappedDetections, totalPoints });
      } catch (e) {
        // swallow errors from parent handler to avoid crashing scanner
        console.warn('onResult handler error', e);
      }
    }
  }, [results, mappedDetections, totalPoints, onResult]);

  useEffect(() => {
    return () => {
      // cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
    } catch (err) {
      console.error('Camera start error', err);
      alert('Không thể truy cập camera. Vui lòng kiểm tra quyền và thử lại.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      // show preview from capture
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      uploadFile(file);
    }, 'image/jpeg', 0.95);
  };

  const onFileChange = (e) => {
    const files = e.target.files && Array.from(e.target.files || []);
    if (!files || files.length === 0) return;
    // clear previous combined results
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResults([]);
    setMappedDetections([]);
    setTotalPoints(0);

    // process each file (sequential UI but uploads in parallel here)
    files.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      // upload and accumulate results (reset already done above)
      uploadFile(file, false);
    });
  };

  const uploadFile = async (file, reset = true) => {
    setLoading(true);
    if (reset) {
      setResults([]);
      setMappedDetections([]);
      setTotalPoints(0);
    }
    const form = new FormData();
    form.append('image', file);

    try {
      const res = await fetch('/api/scan/pin', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Server returned ' + res.status);
      const data = await res.json();

      // append per-file result and get its index
      let fileIndex = 0;
      setResults((prev) => {
        fileIndex = prev.length;
        return [...prev, data];
      });

      // map detections and attach file info
      const mapped = mapDetectionsToPinTypes(data.detections || [], data).map(m => ({ ...m, fileIndex, fileName: file.name }));
      setMappedDetections((prev) => [...prev, ...mapped]);

      const pointsThisFile = mapped.reduce((s, m) => s + (m.pinType ? m.pinType.points : 0), 0);
      setTotalPoints((prev) => prev + pointsThisFile);

      setTimeout(() => {
        try { drawDetections(data); } catch (e) { /* ignore */ }
      }, 200);
    } catch (err) {
      console.error('Upload error', err);
      alert('Lỗi khi gửi ảnh: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const drawDetections = (data) => {
    const img = previewImgRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay || !data || !Array.isArray(data.detections)) return;
    const ctx = overlay.getContext('2d');
    // size overlay to displayed image
    overlay.width = img.clientWidth;
    overlay.height = img.clientHeight;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const scaleX = img.clientWidth / (img.naturalWidth || img.clientWidth);
    const scaleY = img.clientHeight / (img.naturalHeight || img.clientHeight);

    ctx.lineWidth = Math.max(2, Math.round(2 * Math.max(scaleX, scaleY)));
    ctx.strokeStyle = 'rgba(0,150,255,0.9)';
    ctx.fillStyle = 'rgba(0,150,255,0.8)';
    ctx.font = '14px Arial';

    data.detections.forEach((d, i) => {
      const box = d.box || d.bbox || null;
      if (!box || box.length < 4) return;
      const [x1, y1, x2, y2] = box;
      const w = (x2 - x1) * scaleX;
      const h = (y2 - y1) * scaleY;
      const x = x1 * scaleX;
      const y = y1 * scaleY;
      ctx.strokeRect(x, y, w, h);
      const label = (d.label || d.class || d.name || 'obj') + (d.score ? ` ${(d.score||d.conf||0).toFixed(2)}` : '');
      const textW = ctx.measureText(label).width + 8;
      ctx.fillRect(x, Math.max(0, y - 22), textW, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + 4, Math.max(12, y - 8));
      ctx.fillStyle = 'rgba(0,150,255,0.8)';
    });
  };

  const normalizeLabel = (label) => {
    if (!label) return '';
    return String(label).trim();
  };

  const mapDetectionsToPinTypes = (detections = [], data) => {
    // detections: array of objects with label/ocr/score
    const mapped = (detections || []).map((d, i) => {
      const label = normalizeLabel(d.label || d.name || d.class || d.ocr || '');
      let pinType = null;
      if (label) {
        // exact match
        pinType = getPinTypeByName(label);
        // try with/without leading 'Pin '
        if (!pinType) {
          const stripped = label.replace(/^Pin\s*/i, '');
          pinType = getPinTypeByName('Pin ' + stripped) || getPinTypeByName(stripped);
        }
        // try contains match
        if (!pinType) {
          const up = label.toLowerCase();
          pinType = pinTypes.find(p => p.name.toLowerCase().includes(up) || up.includes(p.name.toLowerCase()));
        }
      }
      return {
        index: i,
        raw: d,
        label,
        pinType: pinType || null,
      };
    });
    return mapped;
  };

  // when preview image loads, redraw detections for the visible preview (last uploaded)
  const onPreviewLoad = () => {
    if (results && results.length > 0) {
      const last = results[results.length - 1];
      drawDetections(last);
    }
  };

  return (
    <div className="pin-scanner">
      <div className="scanner-controls">
        <label className="file-label">
          Chọn ảnh từ máy
          <input type="file" accept="image/*" onChange={onFileChange} multiple />
        </label>

        <div className="camera-controls">
          {!streaming ? (
            <button className="btn btn-secondary" onClick={startCamera}>Bật camera</button>
          ) : (
            <>
              <button className="btn btn-danger" onClick={stopCamera}>Tắt camera</button>
              <button className="btn btn-primary" onClick={capture}>Chụp & gửi</button>
            </>
          )}
        </div>
      </div>

      <div className="scanner-preview">
        {streaming ? (
          <video ref={videoRef} className="scanner-video" playsInline muted />
        ) : (
          previewUrl ? (
            <div className="preview-wrap">
              <img ref={previewImgRef} src={previewUrl} alt="preview" onLoad={onPreviewLoad} />
              <canvas ref={overlayRef} className="overlay-canvas" />
            </div>
          ) : (
            <div className="preview-placeholder">Ảnh sẽ xuất hiện ở đây</div>
          )
        )}
      </div>

      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

      <div className="scanner-status">
        {loading && <div className="loading">Đang gửi ảnh...</div>}
        {(mappedDetections && mappedDetections.length > 0) && (
          <div className="scan-result">
            <h4>Kết quả phát hiện</h4>
            <div className="detections">
              {mappedDetections.length > 0 ? mappedDetections.map((m, idx) => (
                <div className="detection" key={`${m.fileIndex}-${m.index}-${idx}`}>
                  <div className="detection-info">
                    <strong>{m.label || 'unknown'}</strong>
                    <span> {m.raw && (m.raw.confidence || m.raw.conf || m.raw.score) ? `(${(m.raw.confidence || m.raw.conf || m.raw.score).toFixed(2)})` : ''}</span>
                    <div style={{ fontSize: 13, color: '#666' }}>{m.pinType ? `${m.pinType.name} — ${m.pinType.points} điểm` : 'Loại chưa xác định'}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{m.fileName}</div>
                  </div>
                  {results && results[m.fileIndex] && results[m.fileIndex].crops && results[m.fileIndex].crops[m.index] && (
                    <img src={results[m.fileIndex].crops[m.index]} alt={`crop-${m.fileIndex}-${m.index}`} onClick={() => window.open(results[m.fileIndex].crops[m.index], '_blank')} />
                  )}
                </div>
              )) : <div>Không tìm thấy đối tượng nào.</div>}
            </div>
            {/* Points summary */}
            <div style={{ marginTop: 12 }}>
              <strong>Tổng điểm phát hiện: </strong> {totalPoints} điểm
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinScanner;
