import React, { useState, useEffect } from 'react';
import CategoryChart from './charts/CategoryChart';
// import TrendChart from './charts/TrendChart'; // For future implementation
import api from '../services/api';

const RegionPanel = ({ region, onClose }) => {
  const [detailedRegion, setDetailedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedData = async () => {
      if (!region) return;
      setLoading(true);
      try {
        const res = await api.get(`/region/${region.region}`);
        setDetailedRegion(res.data.data);
      } catch (error) {
        console.error("Error fetching detailed region data:", error);
        // Fallback to summary data if detailed fetch fails
        setDetailedRegion(region); 
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedData();
  }, [region]);

  if (loading || !detailedRegion) {
    return (
      <div className="absolute top-0 left-0 bg-white dark:bg-gray-800 p-4 w-full md:w-1/3 h-full shadow-lg z-10">
        Loading region data...
      </div>
    );
  }

  const { region: regionCode, totalRisk, riskBreakdown, articleRefs = [] } = detailedRegion;

  return (
    <div className="absolute top-0 left-0 bg-white dark:bg-gray-800 p-6 w-full md:w-1/3 h-full shadow-lg z-10 overflow-y-auto">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
      <h2 className="text-2xl font-bold mb-4">Risk Profile: {regionCode}</h2>
      
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2">Daily Risk Score: {totalRisk}</h3>
        {/* <TrendChart /> */}
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2">Risk Breakdown</h3>
        <CategoryChart data={riskBreakdown} />
      </div>

      <div>
        <h3 className="font-bold text-lg mb-2">Top Articles</h3>
        <ul className="space-y-3">
          {articleRefs.slice(0, 5).map(article => (
            <li key={article._id} className="text-sm">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {article.title}
              </a>
              <p className="text-xs text-gray-500">{article.sourceName} - Severity: {article.classification.severity}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RegionPanel; 