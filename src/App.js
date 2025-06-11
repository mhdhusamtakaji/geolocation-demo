import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import styled from 'styled-components';

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

const AppContainer = styled.div`
  max-width: 900px; /* Reduced width */
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  background-color: #f8f9fa;
  color: #212529;
`;

const AppHeader = styled.header`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid #e1e4e8;
`;

const AppHeaderH1 = styled.h1`
  color: #4a6fa5;
  margin-bottom: 10px;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr; /* Default for small screens */
  gap: 30px;

  @media (min-width: 992px) {
    grid-template-columns: 1fr 2fr 1fr; /* Left sidebar, map, right sidebar */
  }
`;

const MapSection = styled.section`
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (min-width: 992px) {
    grid-column: 2 / 3; /* Place map in the middle column */
  }
`;

const LocationCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  @media (min-width: 992px) {
    ${props => props.type === 'ip' && `grid-column: 1 / 2;`} /* IP Location on Left */
    ${props => props.type === 'gps' && `grid-column: 3 / 4;`} /* GPS Location on Right */
  }
`;

const LocationCardH2 = styled.h2`
  color: #4a6fa5;
  margin-bottom: 15px;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LocationDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LocationDetailsP = styled.p`
  margin: 0;
  font-size: 0.95rem;
`;

const GpsButton = styled.button`
  background-color: #4a6fa5;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  width: 100%;
  margin-bottom: 15px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: #3a5a8c;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9rem;
`;

const Legend = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 0.9rem;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

const MarkerIcon = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.color};
`;

function App() {
  const [ipLocation, setIpLocation] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [map, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  // Fetch IP-based location
  useEffect(() => {
    fetch("/api/get-ip-location")
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
        console.log('GPS Coordinates:', coords);
        console.log('Type of accuracy:', typeof coords.accuracy);
        console.log('Type of latitude:', typeof coords.latitude);
        console.log('Type of longitude:', typeof coords.longitude);
        setGpsLocation({
          accuracy: coords.accuracy,
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          position: { lat: coords.latitude, lng: coords.longitude }
        });
        setGpsError(null);
        console.log('gpsLocation after set:', {
          accuracy: coords.accuracy,
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          position: { lat: coords.latitude, lng: coords.longitude }
        });
        
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
    <AppContainer>
      <AppHeader>
        <AppHeaderH1>🌍 Location Tracker</AppHeaderH1>
        <p>View your IP and GPS locations on the map</p>
        <Legend>
          <span><MarkerIcon color="blue" /> IP Location</span>
          <span><MarkerIcon color="red" /> Browser GPS Location</span>
        </Legend>
      </AppHeader>

      <MainContent>
        {/* IP Location Card on the left */}
        <LocationCard type="ip">
          <LocationCardH2>🌐 IP-Based Location</LocationCardH2>
          {ipLocation ? (
            <LocationDetails>
              <LocationDetailsP><strong>IP:</strong> {ipLocation.ip}</LocationDetailsP>
              <LocationDetailsP><strong>City:</strong> {ipLocation.city}</LocationDetailsP>
              <LocationDetailsP><strong>Region:</strong> {ipLocation.region}</LocationDetailsP>
              <LocationDetailsP><strong>Country:</strong> {ipLocation.country_name}</LocationDetailsP>
              <LocationDetailsP><strong>Coordinates:</strong> {ipLocation.latitude}, {ipLocation.longitude}</LocationDetailsP>
            </LocationDetails>
          ) : (
            <p>Loading IP location...</p>
          )}
        </LocationCard>

        <MapSection>
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
        </MapSection>

        {/* Browser GPS Location Card on the right */}
        <LocationCard type="gps">
          <LocationCardH2>📍 Browser GPS Location</LocationCardH2>
          <GpsButton onClick={getGpsLocation}>
            Get My Precise Location
          </GpsButton>
          {gpsLocation ? (
            <LocationDetails>
              <LocationDetailsP><strong>Accuracy:</strong> {gpsLocation.accuracy !== null && gpsLocation.accuracy !== undefined ? `${Math.round(gpsLocation.accuracy)} meters` : 'N/A'}</LocationDetailsP>
              <LocationDetailsP><strong>Latitude:</strong> {gpsLocation.latitude !== null && gpsLocation.latitude !== undefined ? gpsLocation.latitude.toFixed(6) : 'N/A'}</LocationDetailsP>
              <LocationDetailsP><strong>Longitude:</strong> {gpsLocation.longitude !== null && gpsLocation.longitude !== undefined ? gpsLocation.longitude.toFixed(6) : 'N/A'}</LocationDetailsP>
              <LocationDetailsP><strong>Altitude:</strong> {gpsLocation.altitude ? `${gpsLocation.altitude.toFixed(2)} meters` : 'N/A'}</LocationDetailsP>
            </LocationDetails>
          ) : gpsError ? (
            <ErrorMessage>Error: {gpsError}</ErrorMessage>
          ) : (
            <p>Click the button to get your GPS location</p>
          )}
        </LocationCard>
      </MainContent>
    </AppContainer>
  );
}

export default App;
