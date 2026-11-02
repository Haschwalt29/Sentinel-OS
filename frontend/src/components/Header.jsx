import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  Search, 
  Filter,
  X
} from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const Header = ({ filters, setFilters, searchQuery, setSearchQuery, setSearchCenter, setSearchFeature }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Autocomplete suggestions via Mapbox forward geocoding
  useEffect(() => {
    const q = (searchQuery || '').trim();
    if (!q || !MAPBOX_TOKEN) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&limit=5`, { signal: controller.signal });
        const data = await res.json();
        const items = (data.features || []).map((f) => ({
          id: f.id,
          title: f.text,
          location: f.place_name,
          feature: f,
        }));
        setSearchResults(items);
        setShowResults(true);
      } catch (_) {
        // ignore abort or network
      }
    }, 250); // debounce

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    if (!q) return;

    setShowResults(false);
    setSearchQuery(q);

    // Try to parse coordinates: "lat, lng" or "lng, lat"
    const coordMatch = q.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (coordMatch) {
      const a = parseFloat(coordMatch[1]);
      const b = parseFloat(coordMatch[2]);
      // Heuristic: latitude must be between -90..90
      const isLatFirst = Math.abs(a) <= 90 && Math.abs(b) <= 180;
      const lat = isLatFirst ? a : b;
      const lng = isLatFirst ? b : a;
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setSearchCenter({ lng, lat });
        return;
      }
    }

    // Fallback to geocoding via Mapbox
    if (MAPBOX_TOKEN) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.center;
          setSearchCenter({ lng, lat });
          setSearchFeature(feature);
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
      }
    }
  };

  const handleSuggestionClick = (item) => {
    setSearchQuery(item.location);
    setShowResults(false);
    const f = item.feature;
    if (f && f.center) {
      const [lng, lat] = f.center;
      setSearchCenter({ lng, lat });
      setSearchFeature(f);
    }
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
                  <div className="text-xs text-gray-400 mb-2">Suggestions</div>
                  <div className="space-y-1">
                    {searchResults.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className="p-2 hover:bg-dark-700/50 rounded cursor-pointer transition-colors"
                      >
                        <div className="text-sm text-gray-200">{item.title}</div>
                        <div className="text-xs text-gray-400">{item.location}</div>
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
                            onClick={() => setFilters(prev => ({ ...prev, threatLevel: level.value }))}
                            className={`px-2 py-1 text-xs rounded-md transition-all ${level.color} text-white hover:opacity-80 ${
                              filters.threatLevel === level.value ? 'ring-2 ring-white ring-opacity-50' : ''
                            }`}
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
                            onClick={() => setFilters(prev => ({ ...prev, type: type.value }))}
                            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-all ${
                              filters.type === type.value 
                                ? 'bg-cyber-600 text-white ring-2 ring-cyber-300 ring-opacity-50' 
                                : 'bg-cyber-600/50 text-cyber-200 hover:bg-cyber-600/70'
                            }`}
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
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
