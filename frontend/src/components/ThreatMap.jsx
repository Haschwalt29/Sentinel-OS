import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../services/api';
import PulsingMarker from './PulsingMarker';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFzaGJyb3duMjkiLCJhIjoiY21jY2RwMHQyMDVyZzJ3cXdra2d4cmo0dCJ9.dAEPuHu86mpYBmsENGtZmw';

const markerColors = {
  'High Threat': '#F44336', // Red
  'Medium Threat': '#FFC107', // Yellow
  'No Threat': '#4CAF50',   // Green
};

const ThreatMap = ({ filters }) => {
  const [threats, setThreats] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [projection, setProjection] = useState('globe');
  const [viewState, setViewState] = useState({
    longitude: -40,
    latitude: 30,
    zoom: 1.3
  });

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const res = await api.get('/ai/feed', {
          params: {
            threatLevel: filters.threatLevel === 'all' ? undefined : filters.threatLevel,
            sortBy: filters.sortBy,
          },
        });
        setThreats(res.data);
      } catch (err) {
        console.error("Failed to fetch threats for map:", err);
      }
    };
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const markers = useMemo(() =>
    threats.map(threat => {
      if (threat.coordinates && threat.coordinates.lng && threat.coordinates.lat) {
        return (
          <Marker
            key={threat._id}
            longitude={threat.coordinates.lng}
            latitude={threat.coordinates.lat}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(threat);
            }}
          >
            <PulsingMarker color={markerColors[threat.threatLevel] || '#808080'} />
          </Marker>
        );
      }
      return null;
    }), [threats]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10 bg-gray-800 bg-opacity-75 rounded-md p-1 flex space-x-1">
        <button
          onClick={() => setProjection('globe')}
          className={`px-3 py-1 text-sm font-medium rounded ${projection === 'globe' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Globe
        </button>
        <button
          onClick={() => setProjection('mercator')}
          className={`px-3 py-1 text-sm font-medium rounded ${projection === 'mercator' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Map
        </button>
      </div>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={projection === 'globe' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/dark-v11'}
        projection={{name: projection}}
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={e => {
          if (projection === 'globe') e.target.setFog({});
        }}
      >
        {markers}
        {popupInfo && (
          <Popup
            longitude={popupInfo.coordinates.lng}
            latitude={popupInfo.coordinates.lat}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="z-10 bg-transparent"
          >
             <div className="p-2 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
              <h3 className="text-base font-bold text-cyan-400">{popupInfo.title}</h3>
              <p className="text-xs text-gray-300">{popupInfo.threatLevel}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default ThreatMap; 