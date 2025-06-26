import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

// IMPORTANT: Replace with your own Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFzaGJyb3duMjkiLCJhIjoiY21jY2RwMHQyMDVyZzJ3cXdra2d4cmo0dCJ9.dAEPuHu86mpYBmsENGtZmw';

const Map = ({ regions, onRegionClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const getRiskColor = (totalRisk) => {
    if (totalRisk > 40) return '#b91c1c'; // red-700
    if (totalRisk > 25) return '#f97316'; // orange-500
    if (totalRisk > 10) return '#facc15'; // yellow-400
    if (totalRisk > 0) return '#4ade80';  // green-400
    return '#d1d5db'; // gray-300
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 30],
      zoom: 1.5
    });

    map.current.on('load', () => {
      map.current.addSource('countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });

      map.current.addLayer({
        'id': 'country-fills',
        'type': 'fill',
        'source': 'countries',
        'source-layer': 'country_boundaries',
        'paint': {
          'fill-color': '#d1d5db', // Start with default color
          'fill-opacity': 0.7
        }
      });

      map.current.on('click', 'country-fills', (e) => {
        const regionCode = e.features[0].properties.iso_3166_1;
        onRegionClick(regionCode);
      });

      map.current.on('mouseenter', 'country-fills', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'country-fills', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });
  }, []); // Empty dependency array ensures this runs only once

  // Update layer colors when regions data changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !regions.length) return;

    const matchExpression = ['match', ['get', 'iso_3166_1']];
    for (const region of regions) {
      const color = getRiskColor(region.totalRisk);
      matchExpression.push(region.region, color);
    }
    matchExpression.push('#d1d5db'); // Default color

    map.current.setPaintProperty('country-fills', 'fill-color', matchExpression);
  }, [regions]);

  return <div ref={mapContainer} className="h-full w-full" />;
};

export default Map; 