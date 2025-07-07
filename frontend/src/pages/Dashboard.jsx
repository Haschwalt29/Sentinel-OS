import React, { useState } from 'react';
import ThreatMap from '../components/ThreatMap';
import LiveFeed from '../components/LiveFeed';

const Dashboard = () => {
  const [filters, setFilters] = useState({
    threatLevel: 'all',
    type: 'all',
    sortBy: 'createdAt',
    // Add other filters here as needed, e.g., timeRange: 'all'
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
      <div className="lg:w-3/4 h-full relative">
        <ThreatMap filters={filters} />
      </div>
      <div className="lg:w-1/4 h-full overflow-y-auto bg-white dark:bg-gray-800 p-4">
        <LiveFeed filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
};

export default Dashboard; 