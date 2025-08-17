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
  SortAsc,
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

const typeStyles = {
  'global': {
    bg: 'bg-cyber-600/20',
    text: 'text-cyber-300',
    icon: Globe
  },
  'local': {
    bg: 'bg-purple-600/20',
    text: 'text-purple-300',
    icon: MapPin
  }
};



const LiveFeed = ({ filters, setFilters }) => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/feed', {
        params: {
          threatLevel: filters.threatLevel === 'all' ? undefined : filters.threatLevel,
          sortBy: filters.sortBy,
          type: filters.type === 'all' ? undefined : filters.type,
        },
      });
      setThreats(res.data);
    } catch (err) {
      console.error("Failed to fetch live feed:", err);
      setThreats([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Socket connection and event handling
  useEffect(() => {
    const socket = socketService.connect();
    
    // Listen for new threats
    socket.on('new-threat', (newThreat) => {
      console.log('Received new threat via socket:', newThreat);
      
      // Add new threat to the beginning of the list with animation
      setThreats(prevThreats => [newThreat, ...prevThreats]);
      
      // Play audio alert for high threats
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
    });

    return () => {
      socket.off('new-threat');
    };
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);



  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
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
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchFeed}
              className="p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
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
                    value={filters.type}
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
                    value={filters.threatLevel}
                    onChange={(e) => setFilters(f => ({ ...f, threatLevel: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
                  >
                    <option value="all">All Levels</option>
                    <option value="High Threat">High</option>
                    <option value="Medium Threat">Medium</option>
                    <option value="Low Threat">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Sort By</label>
                <select
                  value={filters.sortBy}
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
        {loading ? (
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
            className="flex items-center justify-center h-32"
          >
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-400">No threats detected</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
              <div className="w-full">
                {threats.map((threat, index) => (
                  <motion.div
                    key={threat._id}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeInOut"
                    }}
                    className={`border-l-4 mb-2 ${threatLevelStyles[threat.threatLevel]?.border || 'border-gray-600/30'}`}
                  >
                    <div className="pl-3 py-2 hover:bg-dark-800/30 transition-colors">
                      {/* Threat title and time */}
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-medium text-gray-200">{threat.title}</h3>
                        <div className="flex items-center text-xs text-gray-400 ml-2 flex-shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatTimeAgo(threat.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Metadata row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {/* Threat level */}
                          <span className={`${threatLevelStyles[threat.threatLevel]?.text || 'text-gray-400'}`}>
                            {threat.threatLevel}
                          </span>
                          
                          {/* Region */}
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="text-gray-400">{threat.region || 'Unknown'}</span>
                          </div>
                        </div>
                        
                        {/* External link */}
                        {threat.url && (
                          <a
                            href={threat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyber-400 hover:text-cyber-300"
                            title="View source"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LiveFeed; 