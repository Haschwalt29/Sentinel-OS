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
                                                   <div className="space-y-2 w-full">
              {threats.map((threat, index) => (
                                 <motion.div
                   key={threat._id}
                   initial={{ opacity: 0, y: 20, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: -20, scale: 0.95 }}
                   transition={{ 
                     duration: 0.3, 
                     delay: index * 0.05,
                     type: "spring",
                     stiffness: 100
                   }}
                   whileHover={{ scale: 1.01, y: -1 }}
                                       className={`glass-effect rounded-lg p-3 border transition-all duration-200 w-full overflow-hidden live-feed-card ${
                      threatLevelStyles[threat.threatLevel]?.border || 'border-gray-600/30'
                    } ${threat.threatLevel === 'High Threat' ? 'animate-pulse-slow' : ''}`}
                 >
                                                                           {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className={`p-1 rounded-full flex-shrink-0 ${threatLevelStyles[threat.threatLevel]?.bg || 'bg-gray-600/20'}`}>
                          <AlertTriangle className={`w-3 h-3 ${threatLevelStyles[threat.threatLevel]?.icon || 'text-gray-400'}`} />
                        </div>
                                             <div className="flex items-center space-x-1 min-w-0 flex-wrap">
                           <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${threatLevelStyles[threat.threatLevel]?.bg || 'bg-gray-600/20'} ${threatLevelStyles[threat.threatLevel]?.text || 'text-gray-400'}`}>
                             {threat.threatLevel}
                           </span>
                           <div className="flex items-center space-x-1 min-w-0">
                             {(() => {
                               const TypeIcon = typeStyles[threat.type]?.icon || Globe;
                               return (
                                 <TypeIcon className={`w-3 h-3 flex-shrink-0 ${typeStyles[threat.type]?.text || 'text-gray-400'}`} />
                               );
                             })()}
                             <span className={`text-xs font-medium ${typeStyles[threat.type]?.text || 'text-gray-400'}`}>
                               {threat.type}
                             </span>
                           </div>
                         </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-400 flex-shrink-0 ml-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(threat.createdAt)}</span>
                      </div>
                    </div>

                                                                           {/* Content */}
                                         <div className="mb-3 w-full text-container">
                       <h3 className="font-semibold text-gray-200 mb-2 text-sm leading-tight force-wrap w-full">{threat.title}</h3>
                       <p className="text-xs text-gray-400 leading-relaxed force-wrap w-full line-clamp-2">{threat.content}</p>
                     </div>

                                                                           {/* Footer */}
                    <div className="flex items-center justify-between">
                                           <div className="flex items-center space-x-2 text-xs text-gray-400 min-w-0 flex-1 flex-wrap">
                         <div className="flex items-center space-x-1 min-w-0">
                           <MapPin className="w-3 h-3 flex-shrink-0" />
                           <span className="truncate max-w-20">{threat.region || 'Unknown'}</span>
                         </div>
                         <div className="flex items-center space-x-1 flex-shrink-0">
                           <span>Confidence:</span>
                           <span className="font-mono text-cyber-300">{(threat.confidence * 100).toFixed(1)}%</span>
                         </div>
                       </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        {threat.url && (
                          <motion.a
                            href={threat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-1 text-cyber-400 hover:text-cyber-300 transition-colors"
                            title="View source"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </motion.a>
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