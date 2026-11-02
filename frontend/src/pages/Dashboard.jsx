import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, BarChart3, Activity } from 'lucide-react';
import { toast } from 'react-toastify';
import ThreatMap from '../components/ThreatMap';
import LiveFeed from '../components/LiveFeed';
import StatsPanel from '../components/StatsPanel';
import api from '../services/api';
import socketService from '../services/socket';
import { playAlertSound } from '../utils/audioAlert';

const Dashboard = ({ filters, setFilters, searchQuery, searchCenter, searchFeature }) => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('feed'); // 'feed' or 'stats'
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/ai/feed', {
        params: {
          threatLevel: filters?.threatLevel === 'all' ? undefined : filters?.threatLevel,
          sortBy: filters?.sortBy,
          type: filters?.type === 'all' ? undefined : filters?.type,
        },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setThreats(data);
    } catch (err) {
      console.error('Failed to fetch threats:', err);
      const status = err.response?.status;
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const isNetwork = err.message === 'Network Error' || err.code === 'ERR_NETWORK';
      if (status === 503 || isTimeout || isNetwork) {
        setFetchError('unavailable');
      } else {
        setFetchError('error');
      }
      setThreats([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000);
    return () => clearInterval(interval);
  }, [fetchThreats]);

  // Socket connection for real-time updates (centralized in Dashboard)
  useEffect(() => {
    const socket = socketService.connect();

    const handleNewThreat = (newThreat) => {
      console.log('Received new threat via socket:', newThreat);
      setThreats(prev => {
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
  }, []);

  // Compute live statistics from real threat records
  const dynamicStats = useMemo(() => {
    return {
      totalThreats: threats.length,
      highThreats: threats.filter(t => t.threatLevel === 'High Threat').length,
      mediumThreats: threats.filter(t => t.threatLevel === 'Medium Threat').length,
      lowThreats: threats.filter(t => t.threatLevel === 'Low Threat').length,
      globalThreats: threats.filter(t => t.type === 'global').length,
      localThreats: threats.filter(t => t.type === 'local').length,
    };
  }, [threats]);

  return (
    <div className="flex h-full bg-dark-950">
      {/* Main Map Area */}
      <motion.div 
        className="flex-1 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ThreatMap 
          filters={filters} 
          searchQuery={searchQuery} 
          searchCenter={searchCenter}
          searchFeature={searchFeature}
          threats={threats}
          loading={loading}
          feedError={fetchError}
          onRetry={fetchThreats}
          selectedThreat={selectedThreat}
          onSelectThreat={setSelectedThreat}
        />
      </motion.div>

      {/* Collapsible Side Panel */}
      <AnimatePresence>
        {!isPanelCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative bg-dark-900 border-l border-cyber-500/20 flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyber-500/20">
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('feed')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    activeView === 'feed' 
                      ? 'bg-cyber-600/50 text-cyber-200' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">Live Feed</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('stats')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    activeView === 'stats' 
                      ? 'bg-cyber-600/50 text-cyber-200' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Analytics</span>
                </motion.button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPanelCollapsed(true)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                title="Collapse Panel"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeView === 'feed' ? (
                  <motion.div
                    key="feed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <LiveFeed 
                      filters={filters} 
                      setFilters={setFilters}
                      threats={threats}
                      loading={loading}
                      fetchError={fetchError}
                      onRetry={fetchThreats}
                      selectedThreatId={selectedThreat?._id}
                      onSelectThreat={setSelectedThreat}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <StatsPanel stats={dynamicStats} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse Button (when panel is collapsed) */}
      <AnimatePresence>
        {isPanelCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPanelCollapsed(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-cyber-600/80 hover:bg-cyber-600 text-white rounded-l-lg border border-cyber-500/30 transition-all shadow-lg"
            title="Expand Panel"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mini Stats Panel (when main panel is collapsed) */}
      <AnimatePresence>
        {isPanelCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute right-4 top-20 z-10"
          >
            <div className="glass-effect rounded-lg p-4 space-y-3 shadow-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyber-300 font-mono">
                  {dynamicStats.totalThreats}
                </div>
                <div className="text-xs text-gray-400">Total Threats</div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-threat-high">
                    {dynamicStats.highThreats}
                  </div>
                  <div className="text-xs text-gray-400">High</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-threat-medium">
                    {dynamicStats.mediumThreats}
                  </div>
                  <div className="text-xs text-gray-400">Medium</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
