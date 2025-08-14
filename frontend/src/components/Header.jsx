import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  Search, 
  Filter, 
  Bell,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const threatLevels = [
    { label: 'All', value: 'all', color: 'bg-gray-500' },
    { label: 'High', value: 'High Threat', color: 'bg-threat-high' },
    { label: 'Medium', value: 'Medium Threat', color: 'bg-threat-medium' },
    { label: 'Low', value: 'Low Threat', color: 'bg-threat-low' },
  ];

  const threatTypes = [
    { label: 'All', value: 'all', icon: Globe },
    { label: 'Global', value: 'global', icon: Globe },
    { label: 'Local', value: 'local', icon: Shield },
  ];

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 glass-effect border-b border-cyber-500/20"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-cyber-400 to-cyber-600 rounded-lg flex items-center justify-center cyber-glow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-threat-high rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-cyber-400 to-cyber-200 bg-clip-text text-transparent">
                Sentinel OS
              </h1>
              <p className="text-xs text-gray-400 font-mono">
                Global Instability Monitoring
              </p>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            className="flex-1 max-w-md mx-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search threats, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:border-cyber-500 transition-all"
              />
            </div>
          </motion.div>

          {/* Quick Filters */}
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Threat Level Filter */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 hover:bg-dark-700/50 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </motion.button>
              
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-64 glass-effect rounded-lg p-4 border border-cyber-500/20"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Threat Level</h3>
                      <div className="flex flex-wrap gap-2">
                        {threatLevels.map((level) => (
                          <button
                            key={level.value}
                            className={`px-2 py-1 text-xs rounded-md transition-all ${level.color} text-white hover:opacity-80`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Type</h3>
                      <div className="flex flex-wrap gap-2">
                        {threatTypes.map((type) => (
                          <button
                            key={type.value}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-cyber-600/50 text-cyber-200 rounded-md hover:bg-cyber-600/70 transition-all"
                          >
                            <type.icon className="w-3 h-3" />
                            <span>{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 hover:bg-dark-700/50 transition-all"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-threat-high rounded-full animate-pulse"></div>
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 hover:bg-dark-700/50 transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 hover:bg-dark-700/50 transition-all"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

        {/* Global Alert Banner */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-3 bg-gradient-to-r from-threat-high/20 to-threat-medium/20 border border-threat-high/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-threat-high" />
            <span className="text-sm text-gray-300">
              <span className="font-semibold text-threat-high">3 Active High Threats</span> detected globally
            </span>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header; 