import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  Search, 
  Filter,
  Sun,
  Moon,
  X
} from 'lucide-react';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock data for search results - in a real app, this would come from an API
  const mockThreats = [
    { id: 1, title: 'Police watchdog clears Toronto police officers', location: 'Toronto, Ontario', type: 'No Threat' },
    { id: 2, title: 'Letters to the editor, Aug. 17', location: 'Toronto, Sudbury', type: 'Medium Threat' },
    { id: 3, title: "Sydney Sweeney's New Movie", location: 'Sydney, Australia', type: 'No Threat' },
    { id: 4, title: 'Tragedy as two people die after falling from Sydney Harbour Bridge', location: 'Sydney Harbour Bridge', type: 'Medium Threat' },
    { id: 5, title: "Sydney crime boss Bassam Hamzy's Belize jungle resort plan", location: 'Sydney, Belize', type: 'High Threat' },
  ];
  
  // Apply theme changes when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);
  
  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const results = mockThreats.filter(threat => 
      threat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threat.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
  }, [searchQuery]);
  const handleSearch = (e) => {
    e.preventDefault();
    setShowResults(true);
    // In a real app, you would trigger an API search here
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };
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
          <motion.form 
            onSubmit={handleSearch}
            className="flex-1 max-w-md mx-8 relative"
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
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full pl-10 pr-10 py-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:border-cyber-500 transition-all"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute w-full mt-2 bg-dark-800/95 border border-cyber-500/30 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2">Search Results</div>
                  <div className="space-y-1">
                    {searchResults.map(result => (
                      <div 
                        key={result.id}
                        className="p-2 hover:bg-dark-700/50 rounded cursor-pointer transition-colors"
                      >
                        <div className="text-sm text-gray-200">{result.title}</div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs text-gray-400">{result.location}</div>
                          <div className={`text-xs px-1.5 py-0.5 rounded ${
                            result.type === 'High Threat' ? 'bg-threat-high/20 text-threat-high' :
                            result.type === 'Medium Threat' ? 'bg-threat-medium/20 text-threat-medium' :
                            'bg-threat-none/20 text-threat-none'
                          }`}>
                            {result.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.form>

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


            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-dark-800/50 border border-cyber-500/30 rounded-lg text-gray-300 hover:bg-dark-700/50 transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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