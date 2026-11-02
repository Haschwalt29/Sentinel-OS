import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  AlertTriangle, 
  Globe, 
  MapPin, 
  Clock, 
  ExternalLink,
  Filter,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import { playAlertSound } from '../utils/audioAlert';

const threatLevelStyles = {
  'High Threat': {
    bg: 'bg-threat-high/20',
    border: 'border-threat-high/50',
    text: 'text-threat-high',
    icon: 'text-threat-high',
    glow: 'threat-glow-high'
  },
  'Medium Threat': {
    bg: 'bg-threat-medium/20',
    border: 'border-threat-medium/50',
    text: 'text-threat-medium',
    icon: 'text-threat-medium',
    glow: 'threat-glow-medium'
  },
  'Low Threat': {
    bg: 'bg-threat-low/20',
    border: 'border-threat-low/50',
    text: 'text-threat-low',
    icon: 'text-threat-low',
    glow: 'threat-glow-low'
  },
  'No Threat': {
    bg: 'bg-threat-none/20',
    border: 'border-threat-none/50',
    text: 'text-threat-none',
    icon: 'text-threat-none',
    glow: ''
  }
};

const LiveFeed = ({ 
  filters, 
  setFilters,
  threats: externalThreats,
  loading: externalLoading,
  fetchError: externalFetchError,
  onRetry: externalOnRetry,
  selectedThreatId,
  onSelectThreat
}) => {
  const [internalThreats, setInternalThreats] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [internalFetchError, setInternalFetchError] = useState(null);

  const isExternalManaged = Array.isArray(externalThreats);
  const threats = isExternalManaged ? externalThreats : internalThreats;
  const loading = isExternalManaged ? externalLoading : internalLoading;
  const fetchError = isExternalManaged ? externalFetchError : internalFetchError;

  const fetchFeed = useCallback(async () => {
    if (isExternalManaged) {
      if (externalOnRetry) externalOnRetry();
      return;
    }
    setInternalLoading(true);
    setInternalFetchError(null);
    try {
      const res = await api.get('/ai/feed', {
        params: {
          threatLevel: filters?.threatLevel === 'all' ? undefined : filters?.threatLevel,
          sortBy: filters?.sortBy,
          type: filters?.type === 'all' ? undefined : filters?.type,
        },
      });
      setInternalThreats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch live feed:", err);
      const status = err.response?.status;
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const isNetwork = err.message === 'Network Error' || err.code === 'ERR_NETWORK';
      if (status === 503 || isTimeout || isNetwork) {
        setInternalFetchError('unavailable');
      } else {
        setInternalFetchError('error');
      }
      setInternalThreats([]);
    } finally {
      setInternalLoading(false);
    }
  }, [filters, isExternalManaged, externalOnRetry]);

  // Socket listener only if not externally managed
  useEffect(() => {
    if (isExternalManaged) return;

    const socket = socketService.connect();
    
    const handleNewThreat = (newThreat) => {
      console.log('Received new threat via socket:', newThreat);
      setInternalThreats(prev => {
        if (!newThreat || !newThreat._id) return prev;
        if (prev.some(t => t._id === newThreat._id || t.title === newThreat.title)) {
          return prev;
        }
        return [newThreat, ...prev];
      });
      
      if (newThreat.threatLevel === 'High Threat') {
        playAlertSound();
        toast.error('🚨 High Threat Detected!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    };

    socket.on('new-threat', handleNewThreat);

    return () => {
      socket.off('new-threat', handleNewThreat);
    };
  }, [isExternalManaged]);

  useEffect(() => {
    if (!isExternalManaged) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchFeed, isExternalManaged]);

  const handleRetry = () => {
    if (isExternalManaged && externalOnRetry) {
      externalOnRetry();
    } else {
      fetchFeed();
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recent';
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-cyber-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-bold text-gray-100">Live Threat Feed</h2>
            <p className="text-xs text-gray-400">Real-time global threat monitoring</p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
              title="Refresh Feed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyber-400' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Type</label>
                  <select
                    value={filters?.type || 'all'}
                    onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
                  >
                    <option value="all">All Types</option>
                    <option value="global">Global</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Level</label>
                  <select
                    value={filters?.threatLevel || 'all'}
                    onChange={(e) => setFilters(f => ({ ...f, threatLevel: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
                  >
                    <option value="all">All Levels</option>
                    <option value="High Threat">High</option>
                    <option value="Medium Threat">Medium</option>
                    <option value="Low Threat">Low</option>
                    <option value="No Threat">No Threat</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Sort By</label>
                <select
                  value={filters?.sortBy || 'createdAt'}
                  onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="confidence">Confidence</option>
                  <option value="threatLevel">Threat Level</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-3 w-full">
        {loading && threats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-32"
          >
            <div className="text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 text-cyber-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading threats...</p>
            </div>
          </motion.div>
        ) : threats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-32 px-4"
          >
            <div className="text-center">
              {fetchError === 'unavailable' ? (
                <>
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-gray-300 font-medium">Unable to load threat data</p>
                  <p className="text-xs text-gray-500 mt-1">The service may be temporarily unavailable. Please try again shortly.</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-3 px-3 py-1.5 text-sm bg-cyber-600 hover:bg-cyber-500 text-white rounded transition-colors"
                  >
                    Try again
                  </button>
                </>
              ) : fetchError === 'error' ? (
                <>
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-gray-300">Something went wrong loading the feed.</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-3 px-3 py-1.5 text-sm bg-cyber-600 hover:bg-cyber-500 text-white rounded transition-colors"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm text-gray-400">No threats detected</p>
                  <p className="text-xs text-gray-500 mt-1">No incidents match the active filters.</p>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="w-full space-y-2">
            {threats.map((threat) => {
              const isSelected = selectedThreatId === threat._id;
              return (
                <motion.div
                  key={threat._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelectThreat && onSelectThreat(threat)}
                  className={`border-l-4 rounded-r transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-dark-800/90 ring-1 ring-cyber-400 shadow-lg' 
                      : 'hover:bg-dark-800/40 bg-dark-900/30'
                  } ${threatLevelStyles[threat.threatLevel]?.border || 'border-gray-600/30'}`}
                >
                  <div className="pl-3 pr-2 py-2.5">
                    {/* Threat title and time */}
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <h3 className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug">
                        {threat.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-400 flex-shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatTimeAgo(threat.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Metadata row */}
                    <div className="flex items-center justify-between text-xs mt-1">
                      <div className="flex items-center space-x-2">
                        {/* Threat level */}
                        <span className={`font-medium ${threatLevelStyles[threat.threatLevel]?.text || 'text-gray-400'}`}>
                          {threat.threatLevel}
                        </span>
                        
                        {/* Region */}
                        <div className="flex items-center text-gray-400">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{threat.region || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      {/* External link */}
                      {threat.url ? (
                        <a
                          href={threat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyber-400 hover:text-cyber-300 p-1 rounded hover:bg-dark-700/50 transition-colors flex items-center gap-1"
                          title="Open original news article"
                        >
                          <span className="text-[10px]">Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-500 text-[10px] italic">No source</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
