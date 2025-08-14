import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Globe, 
  MapPin, 
  Activity,
  Clock,
  Target
} from 'lucide-react';

const StatsPanel = ({ stats }) => {
  const threatTrends = [
    { label: 'High Threats', value: stats.highThreats, change: '+12%', trend: 'up', color: 'threat-high' },
    { label: 'Medium Threats', value: stats.mediumThreats, change: '+5%', trend: 'up', color: 'threat-medium' },
    { label: 'Low Threats', value: stats.lowThreats, change: '-3%', trend: 'down', color: 'threat-low' },
  ];

  const regionStats = [
    { region: 'North America', threats: 45, level: 'high' },
    { region: 'Europe', threats: 38, level: 'medium' },
    { region: 'Asia Pacific', threats: 52, level: 'high' },
    { region: 'Middle East', threats: 21, level: 'medium' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-heading font-bold text-gray-100 mb-1">Threat Analytics</h2>
        <p className="text-xs text-gray-400">Real-time global threat monitoring</p>
      </div>

      {/* Overall Stats */}
      <motion.div 
        className="glass-effect rounded-lg p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyber-300 font-mono">{stats.totalThreats}</div>
            <div className="text-xs text-gray-400">Total Threats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-threat-high font-mono">{stats.highThreats}</div>
            <div className="text-xs text-gray-400">High Priority</div>
          </div>
        </div>
      </motion.div>

      {/* Threat Trends */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4" />
          <span>Threat Trends</span>
        </h3>
        <div className="space-y-2">
          {threatTrends.map((trend, index) => (
            <motion.div
              key={trend.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-cyber-500/20"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full bg-${trend.color}`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-200">{trend.label}</div>
                  <div className="text-xs text-gray-400">{trend.value} active</div>
                </div>
              </div>
              <div className={`flex items-center space-x-1 text-xs ${
                trend.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend.change}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Regional Distribution */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>Regional Distribution</span>
        </h3>
        <div className="space-y-2">
          {regionStats.map((region, index) => (
            <motion.div
              key={region.region}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-cyber-500/20"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  region.level === 'high' ? 'bg-threat-high' : 'bg-threat-medium'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-200">{region.region}</div>
                  <div className="text-xs text-gray-400">{region.threats} threats</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 capitalize">{region.level}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
          <Target className="w-4 h-4" />
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-3 bg-cyber-600/50 hover:bg-cyber-600/70 rounded-lg border border-cyber-500/30 transition-all"
          >
            <div className="text-center">
              <Activity className="w-5 h-5 mx-auto mb-1 text-cyber-200" />
              <div className="text-xs text-cyber-200">Refresh Data</div>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-3 bg-dark-800/50 hover:bg-dark-700/50 rounded-lg border border-cyber-500/30 transition-all"
          >
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <div className="text-xs text-gray-400">History</div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div 
        className="glass-effect rounded-lg p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">System Status</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Online</span>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Database:</span>
            <span className="text-green-400">Connected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">API Status:</span>
            <span className="text-green-400">Healthy</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Update:</span>
            <span className="text-cyber-300">2 min ago</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StatsPanel;
