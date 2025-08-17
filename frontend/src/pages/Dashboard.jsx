import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, BarChart3, Activity } from 'lucide-react';
import ThreatMap from '../components/ThreatMap';
import LiveFeed from '../components/LiveFeed';
import StatsPanel from '../components/StatsPanel';

const Dashboard = () => {
  const [filters, setFilters] = useState({
    threatLevel: 'all',
    type: 'all',
    sortBy: 'createdAt',
  });
  
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('feed'); // 'feed' or 'stats'
  const [globalStats, setGlobalStats] = useState({
    totalThreats: 0,
    highThreats: 0,
    mediumThreats: 0,
    lowThreats: 0,
    globalThreats: 0,
    localThreats: 0,
  });

  // Update global stats when threats change
  useEffect(() => {
    // This would be updated when threats are fetched
    setGlobalStats({
      totalThreats: 156,
      highThreats: 23,
      mediumThreats: 67,
      lowThreats: 66,
      globalThreats: 89,
      localThreats: 67,
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-dark-950">
      {/* Main Map Area */}
      <motion.div 
        className="flex-1 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ThreatMap filters={filters} />
      </motion.div>

      {/* Collapsible Side Panel */}
      <AnimatePresence>
        {!isPanelCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative bg-dark-900 border-l border-cyber-500/20"
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
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Panel Content */}
            <div className="h-full overflow-hidden">
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
                    <LiveFeed filters={filters} setFilters={setFilters} />
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
                    <StatsPanel stats={globalStats} />
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
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-cyber-600/80 hover:bg-cyber-600 text-white rounded-l-lg border border-cyber-500/30 transition-all"
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
            className="absolute right-4 top-4 z-10"
          >
            <div className="glass-effect rounded-lg p-4 space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyber-300 font-mono">
                  {globalStats.totalThreats}
                </div>
                <div className="text-xs text-gray-400">Total Threats</div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-threat-high">
                    {globalStats.highThreats}
                  </div>
                  <div className="text-xs text-gray-400">High</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-threat-medium">
                    {globalStats.mediumThreats}
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