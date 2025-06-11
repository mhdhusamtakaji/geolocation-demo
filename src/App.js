import './App.css';
import './index.css';
import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

function App() {
  const [ipLocation, setIpLocation] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [map, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  // Fetch IP-based location
  useEffect(() => {
    const fetchIpLocation = async () => {
      try {
        const response = await fetch("https://corsproxy.io/?https://ipapi.co/json/");
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded for IP location service. Please try again later.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setIpLocation({
          ...data,
          position: { lat: data.latitude, lng: data.longitude }
        });
      } catch (err) {
        console.error("IPAPI error:", err);
        // Fallback to a default location or show error message
        setIpLocation({
          error: err.message || 'Failed to fetch IP location',
          position: { lat: 0, lng: 0 } // Default position
        });
      }
    };

    fetchIpLocation();
  }, []);

  // Request GPS location
  const getGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        setGpsLocation({
          accuracy: coords.accuracy,
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          position: { lat: coords.latitude, lng: coords.longitude }
        });
        setGpsError(null);
        
        // Pan to user's location
        if (map) {
          map.panTo({ lat: coords.latitude, lng: coords.longitude });
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsError(error.message);
      },
      { enableHighAccuracy: true }
    );
  }, [map]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
    // If we already have IP location, center the map there
    if (ipLocation?.position) {
      map.panTo(ipLocation.position);
    }
  }, [ipLocation]);

  const onMapClick = useCallback(() => {
    setActiveMarker(null);
  }, []);

  const onMarkerClick = useCallback((marker) => {
    return () => {
      setActiveMarker(marker);
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🌍 Location Tracker</h1>
        <p>View your IP and GPS locations on the map</p>
        <div className="legend">
          <span><span className="marker-icon" style={{ backgroundColor: 'blue' }}></span> IP Location</span>
          <span><span className="marker-icon" style={{ backgroundColor: 'red' }}></span> Browser GPS Location</span>
        </div>
      </header>

      <main className="main-content">
        {/* IP Location Card on the left */}
        <div className="location-card ip-location">
          <h2 className="location-card-title">🌐 IP-Based Location</h2>
          {ipLocation ? (
            ipLocation.error ? (
              <div className="error-message">
                <p>{ipLocation.error}</p>
                <p>Using default location (0,0)</p>
              </div>
            ) : (
              <div className="location-details">
                <p><strong>IP:</strong> {ipLocation.ip || 'N/A'}</p>
                <p><strong>ISP:</strong> {ipLocation.org || 'N/A'}</p>
                <p><strong>City:</strong> {ipLocation.city || 'N/A'}</p>
                <p><strong>Region:</strong> {ipLocation.region || 'N/A'}</p>
                <p><strong>Country:</strong> {ipLocation.country_name || 'N/A'}</p>
                <p><strong>Latitude:</strong> {ipLocation.latitude || 'N/A'}</p>
                <p><strong>Longitude:</strong> {ipLocation.longitude || 'N/A'}</p>
              </div>
            )
          ) : (
            <p>Loading IP location...</p>
          )}
        </div>

        <section className="map-section">
          <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={ipLocation?.position || defaultCenter}
              zoom={ipLocation ? 10 : 2}
              onLoad={onMapLoad}
              onClick={onMapClick}
            >
              {ipLocation && (
                <Marker
                  position={ipLocation.position}
                  onClick={onMarkerClick('ip')}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                >
                  {activeMarker === 'ip' && (
                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                      <div>
                        <h3>IP Location</h3>
                        <p>{ipLocation.city}, {ipLocation.region}, {ipLocation.country_name}</p>
                        <p>IP: {ipLocation.ip}</p>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              )}
              
              {gpsLocation && (
                <Marker
                  position={gpsLocation.position}
                  onClick={onMarkerClick('gps')}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  }}
                >
                  {activeMarker === 'gps' && (
                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                      <div>
                        <h3>Your GPS Location</h3>
                        <p>Accuracy: {Math.round(gpsLocation.accuracy)} meters</p>
                        <p>Lat: {gpsLocation.latitude?.toFixed(6) || 'N/A'}</p>
                        <p>Lng: {gpsLocation.longitude?.toFixed(6) || 'N/A'}</p>
                        <p>Altitude: {gpsLocation.altitude ? `${gpsLocation.altitude.toFixed(2)} meters` : 'N/A'}</p>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              )}
            </GoogleMap>
          </LoadScript>
        </section>

        {/* Browser GPS Location Card on the right */}
        <div className="location-card gps-location">
          <h2 className="location-card-title">📍 Browser GPS Location</h2>
          <button 
            className="gps-button" 
            onClick={getGpsLocation}
          >
            Get My Precise Location
          </button>
          {gpsLocation ? (
            <div className="location-details">
              <p><strong>Accuracy:</strong> {gpsLocation.accuracy !== null && gpsLocation.accuracy !== undefined ? `${Math.round(gpsLocation.accuracy)} meters` : 'N/A'}</p>
              <p><strong>Latitude:</strong> {gpsLocation.latitude !== null && gpsLocation.latitude !== undefined ? gpsLocation.latitude.toFixed(6) : 'N/A'}</p>
              <p><strong>Longitude:</strong> {gpsLocation.longitude !== null && gpsLocation.longitude !== undefined ? gpsLocation.longitude.toFixed(6) : 'N/A'}</p>
              <p><strong>Altitude:</strong> {gpsLocation.altitude ? `${gpsLocation.altitude.toFixed(2)} meters` : 'N/A'}</p>
            </div>
          ) : gpsError ? (
            <p className="error-message">Error: {gpsError}</p>
          ) : (
            <p>Click the button to get your GPS location</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
