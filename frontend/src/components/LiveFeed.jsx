import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const threatLevelStyles = {
  'High Threat': 'bg-red-600 text-white',
  'Medium Threat': 'bg-yellow-500 text-black',
  'No Threat': 'bg-green-600 text-white',
};

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

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <div className="flex justify-between items-center mb-4 space-x-2">
        <div>
          <label htmlFor="threatLevel" className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Filter:</label>
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
            <li key={threat._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${threatLevelStyles[threat.threatLevel] || 'bg-gray-400 text-white'}`}>{threat.threatLevel}</span>
                <span className="text-xs text-gray-400">{new Date(threat.createdAt).toLocaleString()}</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{threat.title}</h3>
              <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">{threat.content}</p>
              <div className="text-xs text-gray-500">Confidence: {threat.confidence.toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveFeed; 