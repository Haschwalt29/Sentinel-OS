import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import { Globe, Map as MapIcon, Layers, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import PulsingMarker from './PulsingMarker';
import { useNavigate } from 'react-router-dom';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

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

function isValidCoordinates(coords) {
  if (!coords || typeof coords !== 'object') return false;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  return (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

const ThreatMap = ({ 
  filters, 
  searchQuery, 
  searchCenter, 
  searchFeature,
  threats: externalThreats,
  loading: externalLoading,
  feedError: externalFeedError,
  onRetry: externalOnRetry,
  selectedThreat,
  onSelectThreat
}) => {
  const [internalThreats, setInternalThreats] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [projection, setProjection] = useState('globe');
  const [viewState, setViewState] = useState({
    longitude: -40,
    latitude: 30,
    zoom: 1.3
  });
  const [clusters, setClusters] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [internalFeedError, setInternalFeedError] = useState(null);
  const [highlightGeoJson, setHighlightGeoJson] = useState(null);
  const mapRef = useRef(null);

  const isExternalManaged = Array.isArray(externalThreats);
  const threats = isExternalManaged ? externalThreats : internalThreats;
  const feedError = isExternalManaged ? externalFeedError : internalFeedError;

  // Fallback internal fetch only if not controlled by parent Dashboard
  const fetchThreats = useCallback(async () => {
    if (isExternalManaged) {
      if (externalOnRetry) externalOnRetry();
      return;
    }
    try {
      setInternalFeedError(null);
      const res = await api.get('/ai/feed', {
        params: {
          threatLevel: filters?.threatLevel === 'all' ? undefined : filters?.threatLevel,
          sortBy: filters?.sortBy,
          type: filters?.type === 'all' ? undefined : filters?.type,
        },
      });
      setInternalThreats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch threats for map:", err);
      const status = err.response?.status;
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const isNetwork = err.message === 'Network Error' || err.code === 'ERR_NETWORK';
      if (status === 503 || isTimeout || isNetwork) {
        setInternalFeedError('unavailable');
      } else {
        setInternalFeedError('error');
      }
    }
  }, [filters, isExternalManaged, externalOnRetry]);

  useEffect(() => {
    if (!isExternalManaged) {
      fetchThreats();
      const interval = setInterval(fetchThreats, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchThreats, isExternalManaged]);

  // Synchronize when a threat is selected in sidebar
  useEffect(() => {
    if (selectedThreat && isValidCoordinates(selectedThreat.coordinates)) {
      setViewState(prev => ({
        ...prev,
        longitude: Number(selectedThreat.coordinates.lng),
        latitude: Number(selectedThreat.coordinates.lat),
        zoom: Math.max(prev.zoom, 5),
        transitionDuration: 1000
      }));
      setPopupInfo(selectedThreat);
    }
  }, [selectedThreat]);

  // Text query filtering
  const normalizedQuery = useMemo(() => (searchQuery || '').trim().toLowerCase(), [searchQuery]);
  const filteredThreats = useMemo(() => {
    if (!normalizedQuery) return threats;
    return threats.filter(t => {
      const title = (t.title || '').toLowerCase();
      const content = (t.content || '').toLowerCase();
      const location = (t.region || t.location || '').toLowerCase();
      return title.includes(normalizedQuery) || content.includes(normalizedQuery) || location.includes(normalizedQuery);
    });
  }, [threats, normalizedQuery]);

  // Separate global and local threats with valid coordinates only
  const globalThreats = useMemo(() => 
    filteredThreats.filter(threat => threat.type === 'global' && isValidCoordinates(threat.coordinates)),
    [filteredThreats]
  );
  
  const localThreats = useMemo(() => 
    filteredThreats.filter(threat => threat.type === 'local' && isValidCoordinates(threat.coordinates)),
    [filteredThreats]
  );

  // Supercluster for spatial indexing
  const supercluster = useMemo(() => {
    if (localThreats.length === 0) return null;
    
    const cluster = new Supercluster({
      radius: 40,
      maxZoom: 16,
    });

    const points = localThreats.map(threat => ({
      type: 'Feature',
      properties: { cluster: false, threatId: threat._id, threat },
      geometry: {
        type: 'Point',
        coordinates: [Number(threat.coordinates.lng), Number(threat.coordinates.lat)]
      }
    }));

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

    const c = supercluster.getClusters(bounds, Math.floor(viewState.zoom));
    setClusters(c);
  }, [supercluster, viewState]);

  // Pan/zoom map to searched center
  useEffect(() => {
    if (!searchCenter || !searchCenter.lng || !searchCenter.lat) return;
    setViewState(prev => ({
      ...prev,
      longitude: searchCenter.lng,
      latitude: searchCenter.lat,
      zoom: 6,
      transitionDuration: 1200
    }));
  }, [searchCenter]);

  // Highlight searched feature boundary if provided
  useEffect(() => {
    if (!searchFeature) {
      setHighlightGeoJson(null);
      return;
    }
    
    const geometry = searchFeature.geometry;
    const bbox = searchFeature.bbox;
    
    if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
      setHighlightGeoJson({ 
        type: 'FeatureCollection', 
        features: [{ 
          type: 'Feature', 
          geometry,
          properties: {}
        }] 
      });
    } else {
      setHighlightGeoJson(null);
    }
    
    if (bbox && bbox.length === 4 && mapRef.current) {
      const [minX, minY, maxX, maxY] = bbox;
      mapRef.current.fitBounds(
        [[minX, minY], [maxX, maxY]],
        { 
          padding: 50,
          duration: 1200,
          maxZoom: 12
        }
      );
    }
  }, [searchFeature]);

  // Global threat markers (pulsing)
  const globalMarkers = useMemo(() => {
    return globalThreats.map(threat => {
      const isSelected = selectedThreat && selectedThreat._id === threat._id;
      return (
        <Marker
          key={`global-${threat._id}`}
          longitude={Number(threat.coordinates.lng)}
          latitude={Number(threat.coordinates.lat)}
          onClick={e => {
            e.originalEvent.stopPropagation();
            setPopupInfo(threat);
            if (onSelectThreat) onSelectThreat(threat);
          }}
        >
          <motion.div
            whileHover={{ scale: 1.25 }}
            animate={isSelected ? { scale: [1, 1.3, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
            className={isSelected ? "ring-4 ring-cyber-400 rounded-full" : ""}
          >
            <PulsingMarker 
              color={markerColors[threat.threatLevel] || '#808080'} 
              size={threat.threatLevel === 'High Threat' || isSelected ? 'large' : 'medium'}
            />
          </motion.div>
        </Marker>
      );
    });
  }, [globalThreats, selectedThreat, onSelectThreat]);

  // Local threat markers
  const localMarkers = useMemo(() => {
    return localThreats.map(threat => {
      const isSelected = selectedThreat && selectedThreat._id === threat._id;
      return (
        <Marker
          key={`local-${threat._id}`}
          longitude={Number(threat.coordinates.lng)}
          latitude={Number(threat.coordinates.lat)}
          onClick={e => {
            e.originalEvent.stopPropagation();
            setPopupInfo(threat);
            if (onSelectThreat) onSelectThreat(threat);
          }}
        >
          <motion.div
            whileHover={{ scale: 1.25 }}
            animate={isSelected ? { scale: [1, 1.3, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div 
              className={`local-marker ${isSelected ? 'ring-2 ring-cyber-300 ring-offset-2 ring-offset-dark-950' : ''}`}
              style={{
                backgroundColor: markerColors[threat.threatLevel] || '#808080',
                width: isSelected ? '16px' : '12px',
                height: isSelected ? '16px' : '12px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                boxShadow: `0 0 12px ${markerColors[threat.threatLevel] || '#808080'}`,
              }}
            />
          </motion.div>
        </Marker>
      );
    });
  }, [localThreats, selectedThreat, onSelectThreat]);

  return (
    <div className="w-full h-full relative">
      {/* Feed error banner */}
      <AnimatePresence>
        {feedError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 glass-effect rounded-lg px-4 py-2 flex items-center gap-3 border border-amber-500/30"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-gray-200">
              {feedError === 'unavailable'
                ? 'Threat data temporarily unavailable. Retrying…'
                : 'Failed to load threat data.'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (externalOnRetry) externalOnRetry();
                else fetchThreats();
              }}
              className="text-sm text-cyber-400 hover:text-cyber-300 font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            title="3D Globe View"
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
            title="2D Map View"
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
          title="Toggle Legend"
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
        ref={mapRef}
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

        {/* Highlight searched feature boundary */}
        {highlightGeoJson && (
          <Source id="search-highlight" type="geojson" data={highlightGeoJson}>
            <Layer
              id="search-fill"
              type="fill"
              paint={{ 
                'fill-color': '#38bdf8', 
                'fill-opacity': 0.2 
              }}
            />
            <Layer
              id="search-outline"
              type="line"
              paint={{ 
                'line-color': '#38bdf8', 
                'line-width': 3,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && isValidCoordinates(popupInfo.coordinates) && (
          <Popup
            longitude={Number(popupInfo.coordinates.lng)}
            latitude={Number(popupInfo.coordinates.lat)}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="z-10 bg-transparent"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-effect rounded-lg p-4 border border-cyber-500/30 max-w-sm"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${threatLevelStyles[popupInfo.threatLevel]?.bg || 'bg-gray-600/20'} flex-shrink-0`}>
                  <AlertTriangle className={`w-4 h-4 ${threatLevelStyles[popupInfo.threatLevel]?.icon || 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-cyber-200 mb-1 line-clamp-2">{popupInfo.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 font-medium">{popupInfo.threatLevel}</span>
                    {popupInfo.region && (
                      <span className="text-xs text-cyber-400">| {popupInfo.region}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-3">{popupInfo.content}</p>
                  {popupInfo.url ? (
                    <a
                      href={popupInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyber-300 hover:text-cyber-200 mt-2 font-medium underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Read original news article</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2 italic">No article link available</p>
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
