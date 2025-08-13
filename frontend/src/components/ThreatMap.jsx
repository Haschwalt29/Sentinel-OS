import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import api from '../services/api';
import socketService from '../services/socket';
import PulsingMarker from './PulsingMarker';
import { useNavigate } from 'react-router-dom';

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
  const [clusters, setClusters] = useState(null);
  const [clusterId, setClusterId] = useState(null);
  const navigate = useNavigate();

  // Separate global and local threats
  const globalThreats = useMemo(() => 
    threats.filter(threat => threat.type === 'global'), [threats]
  );
  
  const localThreats = useMemo(() => 
    threats.filter(threat => threat.type === 'local'), [threats]
  );

  // Create supercluster for local threats
  const supercluster = useMemo(() => {
    console.log('[ThreatMap] Creating supercluster with local threats:', localThreats.length);
    
    if (localThreats.length === 0) return null;
    
    const cluster = new Supercluster({
      radius: 40,
      maxZoom: 16,
    });

    const points = localThreats
      .filter(threat => {
        const hasCoords = threat.coordinates && threat.coordinates.lng && threat.coordinates.lat;
        if (!hasCoords) {
          console.warn('[ThreatMap] Filtering out local threat with missing coordinates:', threat);
        }
        return hasCoords;
      })
      .map(threat => ({
        type: 'Feature',
        properties: { cluster: false, threatId: threat._id, threat },
        geometry: {
          type: 'Point',
          coordinates: [threat.coordinates.lng, threat.coordinates.lat]
        }
      }));

    console.log('[ThreatMap] Created', points.length, 'points for supercluster');
    cluster.load(points);
    return cluster;
  }, [localThreats]);

  // Update clusters when viewport changes
  useEffect(() => {
    if (!supercluster) return;

    const bounds = [
      [viewState.longitude - 180, viewState.latitude - 90],
      [viewState.longitude + 180, viewState.latitude + 90]
    ];

    const clusters = supercluster.getClusters(bounds, Math.floor(viewState.zoom));
    setClusters(clusters);
  }, [supercluster, viewState]);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const res = await api.get('/ai/feed', {
          params: {
            threatLevel: filters.threatLevel === 'all' ? undefined : filters.threatLevel,
            sortBy: filters.sortBy,
            type: filters.type === 'all' ? undefined : filters.type,
          },
        });
        console.log("[ThreatMap] Threats fetched from API:", res.data);
        setThreats(res.data);
      } catch (err) {
        console.error("Failed to fetch threats for map:", err);
      }
    };
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = socketService.connect();
    
    // Listen for new threats
    socket.on('new-threat', (newThreat) => {
      console.log('[ThreatMap] Received new threat on map:', newThreat);
      setThreats(prevThreats => [newThreat, ...prevThreats]);
    });

    return () => {
      socket.off('new-threat');
    };
  }, []);

  // Global threat markers (pulsing)
  const globalMarkers = useMemo(() => {
    console.log('[ThreatMap] Processing global threats:', globalThreats.length);
    
    return globalThreats.map(threat => {
      if (threat.coordinates && threat.coordinates.lng && threat.coordinates.lat) {
        console.log('[ThreatMap] Rendering global marker for:', threat.title, 'at', threat.coordinates);
        return (
          <Marker
            key={`global-${threat._id}`}
            longitude={threat.coordinates.lng}
            latitude={threat.coordinates.lat}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(threat);
            }}
          >
            <PulsingMarker 
              color={markerColors[threat.threatLevel] || '#808080'} 
              size={threat.threatLevel === 'High Threat' ? 'large' : 'medium'}
            />
          </Marker>
        );
      } else {
        console.warn('[ThreatMap] Skipping global threat with missing coordinates:', threat);
      }
      return null;
    });
  }, [globalThreats]);

  // Local threat markers (always visible, not clustered)
  const localMarkers = useMemo(() => {
    return localThreats.map(threat => {
      if (threat.coordinates && threat.coordinates.lng && threat.coordinates.lat) {
        console.log('[ThreatMap] Rendering local marker for:', threat);
        return (
          <Marker
            key={`local-${threat._id}`}
            longitude={threat.coordinates.lng}
            latitude={threat.coordinates.lat}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(threat);
            }}
          >
            <div 
              className="local-marker"
              style={{
                backgroundColor: markerColors[threat.threatLevel] || '#808080',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </Marker>
        );
      } else {
        console.warn('[ThreatMap] Skipping local threat with missing coordinates:', threat);
        return null;
      }
    });
  }, [localThreats]);

  return (
    <div className="w-full h-full relative">
      {/* Map Controls */}
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
      {/* Legend */}
      <div className="absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-75 rounded-md p-3 text-white text-sm">
        <div className="font-semibold mb-2">Threat Types</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span>Global Threats</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Local Threats</span>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>High Threat</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Medium Threat</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>No Threat</span>
          </div>
        </div>
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
        {/* Global threat markers */}
        {globalMarkers}
        
        {/* Local threat markers */}
        {localMarkers}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.coordinates.lng}
            latitude={popupInfo.coordinates.lat}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="z-10 bg-transparent"
          >
            <div
              className="p-2 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 cursor-pointer hover:bg-cyan-900 transition-colors"
              onClick={() => popupInfo.url ? window.open(popupInfo.url, '_blank', 'noopener,noreferrer') : undefined}
              title={popupInfo.url ? 'Go to original news article' : 'No article URL available'}
            >
              <h3 className="text-base font-bold text-cyan-400">{popupInfo.title}</h3>
              <p className="text-xs text-gray-300">{popupInfo.threatLevel}</p>
              {popupInfo.url ? (
                <p className="text-xs text-blue-300 mt-1 underline">Read original article</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1 italic">No article link</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default ThreatMap; 