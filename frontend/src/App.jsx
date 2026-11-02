import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import ThreatDetail from './pages/ThreatDetail';

function App() {
  const [filters, setFilters] = useState({
    threatLevel: 'all',
    type: 'all',
    sortBy: 'createdAt',
  });

  // Global search state shared between Header and map/dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCenter, setSearchCenter] = useState(null); // { lng, lat }
  const [searchFeature, setSearchFeature] = useState(null); // Mapbox feature (geometry/bbox)

  return (
    <Router>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header 
          filters={filters} 
          setFilters={setFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSearchCenter={setSearchCenter}
          setSearchFeature={setSearchFeature}
        />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  filters={filters} 
                  setFilters={setFilters}
                  searchQuery={searchQuery}
                  searchCenter={searchCenter}
                  searchFeature={searchFeature}
                />
              } 
            />
            <Route path="/threat/:id" element={<ThreatDetail />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App; 