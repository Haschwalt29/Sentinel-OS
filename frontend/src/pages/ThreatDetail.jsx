import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ThreatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [threat, setThreat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchThreat = async () => {
      try {
        const res = await api.get(`/ai/feed`);
        const found = res.data.find(t => t._id === id);
        if (found) {
          setThreat(found);
        } else {
          setError('Threat not found');
        }
      } catch (err) {
        setError('Failed to fetch threat');
      } finally {
        setLoading(false);
      }
    };
    fetchThreat();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!threat) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow-lg mt-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">&larr; Back</button>
      <h1 className="text-2xl font-bold mb-2 text-cyan-600">{threat.title}</h1>
      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${threat.threatLevel === 'High Threat' ? 'bg-red-600 text-white' : threat.threatLevel === 'Medium Threat' ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>{threat.threatLevel}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${threat.type === 'global' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>{threat.type}</span>
        {threat.verified && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">✓ Verified</span>}
      </div>
      <div className="mb-4 text-xs text-gray-500">{new Date(threat.createdAt).toLocaleString()}</div>
      <div className="mb-4 text-gray-800 dark:text-gray-200 whitespace-pre-line">{threat.content}</div>
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
        <div><strong>Region:</strong> {threat.region || 'Unknown'}</div>
        <div><strong>Confidence:</strong> {(threat.confidence * 100).toFixed(1)}%</div>
        <div><strong>ID:</strong> {threat._id}</div>
      </div>
    </div>
  );
};

export default ThreatDetail; 