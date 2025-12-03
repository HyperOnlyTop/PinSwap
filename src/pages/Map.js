import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaPhone, FaClock, FaDirections, FaFilter, FaQrcode } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LocationQRScanner from '../components/LocationQRScanner';
import { useAuth } from '../contexts/AuthContext';
import './Map.css';

// Fix default icon paths for leaflet when bundled
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function Recenter({ latlng }) {
  const map = useMap();
  useEffect(() => {
    if (latlng) map.setView(latlng, map.getZoom(), { animate: true });
  }, [latlng, map]);
  return null;
}

const Map = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [mapCenter, setMapCenter] = useState([10.7769, 106.7009]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { user, fetchMe } = useAuth();
  const mapRef = useRef();

  const [locations, setLocations] = useState([]);
  // fetch locations from backend
  useEffect(() => {
    let mounted = true;
    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    fetch(`${API}/api/locations`)
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        // map backend shape to frontend expected shape
        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          id: item._id,
          name: item.name,
          type: item.type,
          address: item.address,
          phone: item.phone || '',
          hours: item.openHours || '',
          coordinates: { lat: item.latitude, lng: item.longitude },
          rating: item.rating || 4.0,
          pinCount: item.pinCount || 0,
        }));
        setLocations(mapped);
      })
      .catch(err => {
        console.error('Failed to load locations', err);
      });
    return () => { mounted = false; };
  }, []);

  const filterTypes = [
    { id: 'all', name: 'Tất cả', icon: '📍' },
    { id: 'shopping', name: 'Mua sắm', icon: '🛒' },
    { id: 'education', name: 'Giáo dục', icon: '🎓' },
    { id: 'park', name: 'Công viên', icon: '🌳' },
    { id: 'healthcare', name: 'Y tế', icon: '🏥' }
  ];

  const filteredLocations = locations.filter(location => 
    filterType === 'all' || location.type === filterType
  );

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    const latlng = [location.coordinates.lat, location.coordinates.lng];
    setMapCenter(latlng);
    if (mapRef.current) {
      try { mapRef.current.setView(latlng, 14); } catch (e) { /* ignore */ }
    }
  };

  // Try to use browser geolocation to center map initially
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter([latitude, longitude]);
      },
      (err) => {
        // ignore if denied or unavailable
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const handleDirections = (location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleQRSuccess = async (data) => {
    // Refresh user data to update points
    if (fetchMe) {
      await fetchMe();
    }
  };

  return (
    <div className="map-page">
      {showQRScanner && (
        <LocationQRScanner 
          onClose={() => setShowQRScanner(false)}
          onSuccess={handleQRSuccess}
        />
      )}
      
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Bản đồ điểm thu gom</h1>
            <p>Tìm các điểm thu gom pin gần bạn nhất</p>
          </div>
          {user && user.role === 'citizen' && (
            <button 
              className="btn-qr-scan"
              onClick={() => setShowQRScanner(true)}
            >
              <FaQrcode /> Quét QR Check-in
            </button>
          )}
        </div>

        <div className="map-content">
          <div className="map-container">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%', borderRadius: 12 }}
              whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Recenter latlng={selectedLocation ? [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng] : mapCenter} />
              {filteredLocations.map(loc => (
                <Marker
                  key={loc.id}
                  position={[loc.coordinates.lat, loc.coordinates.lng]}
                  eventHandlers={{ click: () => setSelectedLocation(loc) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <h4 style={{ margin: '4px 0' }}>{loc.name}</h4>
                      <div style={{ fontSize: 13 }}>{loc.address}</div>
                      <div style={{ marginTop: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.coordinates.lat},${loc.coordinates.lng}`, '_blank')}>Chỉ đường</button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Sidebar */}
          <div className="map-sidebar">
            {/* Filter */}
            <div className="filter-section">
              <h3>
                <FaFilter /> Lọc theo loại
              </h3>
              <div className="filter-buttons">
                {filterTypes.map(type => (
                  <button
                    key={type.id}
                    className={`filter-btn ${filterType === type.id ? 'active' : ''}`}
                    onClick={() => setFilterType(type.id)}
                  >
                    <span className="filter-icon">{type.icon}</span>
                    <span className="filter-name">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Locations List */}
            <div className="locations-section">
              <h3>Điểm thu gom ({filteredLocations.length})</h3>
              <div className="locations-list">
                {filteredLocations.map(location => (
                  <div
                    key={location.id}
                    className={`location-card ${selectedLocation?.id === location.id ? 'selected' : ''}`}
                    onClick={() => handleLocationSelect(location)}
                  >
                    <div className="location-header">
                      <h4>{location.name}</h4>
                      <div className="location-rating">
                        ⭐ {location.rating}
                      </div>
                    </div>
                    
                    <div className="location-info">
                      <div className="location-address">
                        <FaMapMarkerAlt />
                        <span>{location.address}</span>
                      </div>
                      
                      <div className="location-hours">
                        <FaClock />
                        <span>{location.hours}</span>
                      </div>
                      
                      <div className="location-stats">
                        <span className="pin-count">{location.pinCount} pin</span>
                      </div>
                    </div>
                    
                    <div className="location-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirections(location);
                        }}
                      >
                        <FaDirections /> Chỉ đường
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location Details Modal */}
        {selectedLocation && (
          <div className="location-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{selectedLocation.name}</h2>
                <button
                  className="modal-close"
                  onClick={() => setSelectedLocation(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="location-details">
                  <div className="detail-item">
                    <FaMapMarkerAlt />
                    <span>{selectedLocation.address}</span>
                  </div>
                  
                  <div className="detail-item">
                    <FaPhone />
                    <span>{selectedLocation.phone}</span>
                  </div>
                  
                  <div className="detail-item">
                    <FaClock />
                    <span>{selectedLocation.hours}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="rating">⭐ {selectedLocation.rating}</span>
                    <span className="pin-count">{selectedLocation.pinCount} pin đã thu gom</span>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDirections(selectedLocation)}
                  >
                    <FaDirections /> Chỉ đường
                  </button>
                  <button className="btn btn-secondary">
                    Check-in QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
