import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import socketService from '../services/socket';
import { playAlertSound } from '../utils/audioAlert';

const threatLevelStyles = {
  'High Threat': 'bg-red-600 text-white',
  'Medium Threat': 'bg-yellow-500 text-black',
  'No Threat': 'bg-green-600 text-white',
};

const typeStyles = {
  'global': 'bg-blue-500 text-white',
  'local': 'bg-purple-500 text-white',
};

// Hardcoded admin flag for now
const isAdmin = true;

const LiveFeed = ({ filters, setFilters }) => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

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
      
      // Add new threat to the beginning of the list
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

  const handleVerifyThreat = async (threatId) => {
    try {
      const response = await api.patch(`/admin/threat/${threatId}/verify`);
      
      // Update the threat in the local state
      setThreats(prevThreats => 
        prevThreats.map(threat => 
          threat._id === threatId 
            ? { ...threat, verified: true }
            : threat
        )
      );
      
      toast.success('Threat verified successfully!');
    } catch (error) {
      console.error('Error verifying threat:', error);
      toast.error('Failed to verify threat');
    }
  };

  const handleDeleteThreat = async (threatId) => {
    if (!window.confirm('Are you sure you want to delete this threat?')) {
      return;
    }

    try {
      await api.delete(`/admin/threat/${threatId}`);
      
      // Remove the threat from the local state
      setThreats(prevThreats => 
        prevThreats.filter(threat => threat._id !== threatId)
      );
      
      toast.success('Threat deleted successfully!');
    } catch (error) {
      console.error('Error deleting threat:', error);
      toast.error('Failed to delete threat');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type Filter */}
        <div>
          <label htmlFor="type" className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Type:</label>
          <select
            id="type"
            value={filters.type}
            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="global">Global</option>
            <option value="local">Local</option>
          </select>
        </div>

        {/* Threat Level Filter */}
        <div>
          <label htmlFor="threatLevel" className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Level:</label>
          <select
            id="threatLevel"
            value={filters.threatLevel}
            onChange={(e) => setFilters(f => ({ ...f, threatLevel: e.target.value }))}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="High Threat">High</option>
            <option value="Medium Threat">Medium</option>
            <option value="No Threat">No Threat</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Sort:</label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="createdAt">Newest</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : threats.length === 0 ? (
        <div className="text-center text-gray-500">No data yet</div>
      ) : (
        <ul className="space-y-4">
          {threats.map(threat => (
            <li key={threat._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm border-l-4" 
                style={{ borderLeftColor: threat.threatLevel === 'High Threat' ? '#EF4444' : 
                         threat.threatLevel === 'Medium Threat' ? '#F59E0B' : '#10B981' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${threatLevelStyles[threat.threatLevel] || 'bg-gray-400 text-white'}`}>
                    {threat.threatLevel}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeStyles[threat.type] || 'bg-gray-400 text-white'}`}>
                    {threat.type}
                  </span>
                  {threat.verified && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{new Date(threat.createdAt).toLocaleString()}</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{threat.title}</h3>
              <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">{threat.content}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Region: <span className="font-medium">{threat.region || 'Unknown'}</span></div>
                  <div>Confidence: <span className="font-medium">{(threat.confidence * 100).toFixed(1)}%</span></div>
                </div>
                
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex space-x-2">
                    {!threat.verified && (
                      <button
                        onClick={() => handleVerifyThreat(threat._id)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteThreat(threat._id)}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveFeed; 