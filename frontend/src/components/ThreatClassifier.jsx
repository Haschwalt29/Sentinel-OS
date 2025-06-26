import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const badgeColors = {
  'High Threat': 'bg-red-600 text-white',
  'Medium Threat': 'bg-yellow-400 text-black',
  'No Threat': 'bg-green-500 text-white',
};

export default function ThreatClassifier() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/ai/classify-news', {
        title,
        content,
        lat,
        lng
      });
      setResult(res.data);
      toast.success('Threat classified successfully!');
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Failed to classify news. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <ToastContainer position="top-center" theme="dark" />
      <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center tracking-wide">
          🛡️ Sentinel OS Threat Classifier
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1 font-medium">News Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Enter news headline..."
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 font-medium">News Content</label>
            <textarea
              className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              placeholder="Paste or type the news article content..."
            />
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-gray-300 mb-1 font-medium">Latitude</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={lat}
                onChange={e => setLat(e.target.value)}
                required
                placeholder="e.g., 34.0522"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1 font-medium">Longitude</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={lng}
                onChange={e => setLng(e.target.value)}
                required
                placeholder="e.g., -118.2437"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Classifying...' : 'Classify Threat'}
          </button>
        </form>
        {result && (
          <div className="mt-8 text-center">
            <span
              className={`inline-block px-4 py-2 rounded-full text-lg font-bold shadow-md ${badgeColors[result.prediction] || 'bg-gray-700 text-white'}`}
            >
              {result.prediction === 'High Threat' && '🔴'}
              {result.prediction === 'Medium Threat' && '🟡'}
              {result.prediction === 'No Threat' && '🟢'}
              <span className="ml-2">{result.prediction}</span>
            </span>
            {typeof result.confidence === 'number' && (
              <div className="mt-2 text-gray-400 text-sm">
                Confidence: <span className="font-mono">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 