import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import styled from 'styled-components';

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

const AppContainer = styled.div`
  max-width: 1000px; /* Adjusted max-width for a good balance */
  margin: 50px auto; /* More vertical margin */
  padding: 40px; /* Increased padding */
  font-family: 'Roboto', sans-serif; /* Changed font to Roboto */
  background-color: #f8f9fa;
  color: #343a40;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const AppHeader = styled.header`
  text-align: center;
  margin-bottom: 50px; /* More margin */
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;

  h1 {
    color: #4a6fa5;
    margin-bottom: 15px;
    font-size: 3rem;
    font-weight: 700;
  }

  p {
    color: #6c757d;
    font-size: 1.2rem;
    margin-top: 10px;
  }
`;

const AppHeaderH1 = styled.h1`
  color: #4a6fa5;
  margin-bottom: 10px;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr; /* Default for small screens */
  gap: 40px;

  @media (min-width: 992px) {
    grid-template-columns: 1fr 2fr 1fr; /* IP Location | Map | GPS Location */
  }
`;

const MapSection = styled.section`
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (min-width: 992px) {
    grid-column: 2 / 3; /* Place map in the middle column */
  }
`;

const LocationCard = styled.div`
  background: #ffffff;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }

  @media (min-width: 992px) {
    ${props => props.type === 'ip' && `grid-column: 1 / 2;`} /* IP Location on Left */
    ${props => props.type === 'gps' && `grid-column: 3 / 4;`} /* GPS Location on Right */
  }

  h2 {
    color: #4a6fa5;
    margin-bottom: 25px;
    font-size: 1.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
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
  gap: 15px;
  width: 100%;

  p {
    margin: 0;
    font-size: 1.05rem;
    color: #495057;
    strong {
      color: #343a40;
      font-weight: 700;
    }
  }
`;

const LocationDetailsP = styled.p`
  margin: 0;
  font-size: 0.95rem;
`;

const GpsButton = styled.button`
  background-color: #28a745; /* Green for action */
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  width: 100%;
  margin-top: 20px;
  transition: background-color 0.3s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background-color: #218838;
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 20px;
  font-size: 1.1rem;
  font-weight: bold;
`;

const Legend = styled.div`
  margin-top: 30px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 30px;
  font-size: 1.05rem;
  color: #555;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const MarkerIcon = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 1px solid rgba(0,0,0,0.2);
`;

function App() {
  const [ipLocation, setIpLocation] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [map, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  // Fetch IP-based location
  useEffect(() => {
    fetch("https://corsproxy.io/?https://ipapi.co/json/")
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
                        <p>Altitude: {gpsLocation.altitude ? `${gpsLocation.altitude.toFixed(2)} meters` : 'N/A'}</p>
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
