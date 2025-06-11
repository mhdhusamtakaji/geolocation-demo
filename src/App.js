import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

const styles = {
  appContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: '#f8f9fa',
    color: '#212529'
  },
  appHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px 0',
    borderBottom: '1px solid #e1e4e8'
  },
  appHeaderH1: {
    color: '#4a6fa5',
    marginBottom: '10px'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '30px'
  },
  mapSection: {
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  locationCard: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  locationCardH2: {
    color: '#4a6fa5',
    marginBottom: '15px',
    fontSize: '1.3rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  locationDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  locationDetailsP: {
    margin: '0',
    fontSize: '0.95rem'
  },
  gpsButton: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    width: '100%',
    marginBottom: '15px',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  gpsButtonHover: {
    backgroundColor: '#3a5a8c'
  },
  errorMessage: {
    color: '#dc3545',
    marginTop: '10px',
    fontSize: '0.9rem'
  }
};

function App() {
  const [ipLocation, setIpLocation] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [map, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  // Fetch IP-based location
  useEffect(() => {
    fetch("https://api.allorigins.win/raw?url=https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => setIpLocation({
        ...data,
        position: { lat: data.latitude, lng: data.longitude }
      }))
      .catch((err) => console.error("IPAPI error:", err));
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
          ...coords,
          position: { lat: coords.latitude, lng: coords.longitude }
        });
        setGpsError(null);
        
        // Pan to user's location
        if (map) {
          map.panTo({ lat: coords.latitude, lng: coords.longitude });
        }
      },
      (error) => {
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
    <div style={styles.appContainer}>
      <header style={styles.appHeader}>
        <h1 style={styles.appHeaderH1}>🌍 Location Tracker</h1>
        <p>View your IP and GPS locations on the map</p>
      </header>

      <main style={styles.mainContent}>
        <section style={styles.mapSection}>
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
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              )}
            </GoogleMap>
          </LoadScript>
        </section>

        <section style={styles.controlsSection}>
          <div style={styles.locationCard}>
            <h2 style={styles.locationCardH2}>🌐 IP-Based Location</h2>
            {ipLocation ? (
              <div style={styles.locationDetails}>
                <p style={styles.locationDetailsP}><strong>IP:</strong> {ipLocation.ip}</p>
                <p style={styles.locationDetailsP}><strong>City:</strong> {ipLocation.city}</p>
                <p style={styles.locationDetailsP}><strong>Region:</strong> {ipLocation.region}</p>
                <p style={styles.locationDetailsP}><strong>Country:</strong> {ipLocation.country_name}</p>
                <p style={styles.locationDetailsP}><strong>Coordinates:</strong> {ipLocation.latitude}, {ipLocation.longitude}</p>
              </div>
            ) : (
              <p>Loading IP location...</p>
            )}
          </div>

          <div style={styles.locationCard}>
            <h2 style={styles.locationCardH2}>📍 Browser GPS Location</h2>
            <button style={styles.gpsButton} onClick={getGpsLocation}>
              Get My Precise Location
            </button>
            {gpsLocation ? (
              <div style={styles.locationDetails}>
                <p style={styles.locationDetailsP}><strong>Accuracy:</strong> {Math.round(gpsLocation.accuracy)} meters</p>
                <p style={styles.locationDetailsP}><strong>Latitude:</strong> {gpsLocation.latitude?.toFixed(6) || 'N/A'}</p>
                <p style={styles.locationDetailsP}><strong>Longitude:</strong> {gpsLocation.longitude?.toFixed(6) || 'N/A'}</p>
                <p style={styles.locationDetailsP}><strong>Altitude:</strong> {gpsLocation.altitude ? `${gpsLocation.altitude.toFixed(2)} meters` : 'N/A'}</p>
              </div>
            ) : gpsError ? (
              <p style={styles.errorMessage}>Error: {gpsError}</p>
            ) : (
              <p>Click the button to get your GPS location</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
