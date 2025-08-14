import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import { Globe, Map as MapIcon, Layers, Info, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import PulsingMarker from './PulsingMarker';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFzaGJyb3duMjkiLCJhIjoiY21jY2RwMHQyMDVyZzJ3cXdra2d4cmo0dCJ9.dAEPuHu86mpYBmsENGtZmw';

const markerColors = {
  'High Threat': '#FF4C4C',
  'Medium Threat': '#FFB74D',
  'Low Threat': '#FFD700',
  'No Threat': '#4CAF50',
};

const threatLevelStyles = {
  'High Threat': { bg: 'bg-threat-high', icon: 'text-threat-high' },
  'Medium Threat': { bg: 'bg-threat-medium', icon: 'text-threat-medium' },
  'Low Threat': { bg: 'bg-threat-low', icon: 'text-threat-low' },
  'No Threat': { bg: 'bg-threat-none', icon: 'text-threat-none' },
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
  const [showLegend, setShowLegend] = useState(true);
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
            <motion.div
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <PulsingMarker 
                color={markerColors[threat.threatLevel] || '#808080'} 
                size={threat.threatLevel === 'High Threat' ? 'large' : 'medium'}
              />
            </motion.div>
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
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div 
                className="local-marker"
                style={{
                  backgroundColor: markerColors[threat.threatLevel] || '#808080',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: `0 0 10px ${markerColors[threat.threatLevel] || '#808080'}40`,
                }}
              />
            </motion.div>
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
      <motion.div 
        className="absolute top-4 right-4 z-10 space-y-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Projection Toggle */}
        <div className="glass-effect rounded-lg p-1 flex space-x-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setProjection('globe')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              projection === 'globe' 
                ? 'bg-cyber-600 text-white shadow-lg' 
                : 'bg-dark-800/50 text-gray-300 hover:bg-dark-700/50'
            }`}
          >
            <Globe className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setProjection('mercator')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              projection === 'mercator' 
                ? 'bg-cyber-600 text-white shadow-lg' 
                : 'bg-dark-800/50 text-gray-300 hover:bg-dark-700/50'
            }`}
          >
            <MapIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Legend Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLegend(!showLegend)}
          className="glass-effect rounded-lg p-2 text-gray-300 hover:text-white transition-colors"
        >
          <Layers className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div 
            className="absolute top-4 left-4 z-10 glass-effect rounded-lg p-4 text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-cyber-300" />
              <span className="text-sm font-semibold text-gray-200">Threat Legend</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-300 mb-2">Threat Types</div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-threat-high animate-pulse"></div>
                    <span className="text-xs text-gray-300">Global Threats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-threat-medium"></div>
                    <span className="text-xs text-gray-300">Local Threats</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-300 mb-2">Severity Levels</div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-threat-high"></div>
                    <span className="text-xs text-gray-300">High Threat</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-threat-medium"></div>
                    <span className="text-xs text-gray-300">Medium Threat</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-threat-low"></div>
                    <span className="text-xs text-gray-300">Low Threat</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-threat-none"></div>
                    <span className="text-xs text-gray-300">No Threat</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-effect rounded-lg p-4 border border-cyber-500/30 cursor-pointer hover:bg-dark-800/80 transition-all"
              onClick={() => popupInfo.url ? window.open(popupInfo.url, '_blank', 'noopener,noreferrer') : undefined}
              title={popupInfo.url ? 'Go to original news article' : 'No article URL available'}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${threatLevelStyles[popupInfo.threatLevel]?.bg || 'bg-gray-600/20'}`}>
                  <AlertTriangle className={`w-4 h-4 ${threatLevelStyles[popupInfo.threatLevel]?.icon || 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-cyber-200 mb-1 line-clamp-2">{popupInfo.title}</h3>
                  <p className="text-xs text-gray-400 mb-2">{popupInfo.threatLevel}</p>
                  <p className="text-xs text-gray-300 line-clamp-2">{popupInfo.content}</p>
                  {popupInfo.url ? (
                    <p className="text-xs text-cyber-300 mt-2 underline">Click to read article</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2 italic">No article link</p>
                  )}
                </div>
              </div>
            </motion.div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default ThreatMap; 