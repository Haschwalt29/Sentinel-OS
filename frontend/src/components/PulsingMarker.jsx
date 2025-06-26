import React from 'react';

const PulsingMarker = ({ color = '#F44336', onClick }) => (
  <div className="pulsing-marker" style={{ '--pulse-color': color, '--dot-color': color }} onClick={onClick} />
);

export default PulsingMarker; 