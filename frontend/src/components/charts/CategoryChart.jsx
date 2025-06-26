import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-2 border-2 border-cyan-500/50">
        <p className="label text-cyan-300">{`${label} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ data }) => {
  if (!data) return null;
  const chartData = Object.keys(data)
    .filter(key => data[key] > 0)
    .map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: data[key],
    }));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
          <XAxis type="number" stroke="#a0a0a0" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
          <YAxis type="category" dataKey="name" stroke="#a0a0a0" width={80} tick={{ fill: '#e0e0e0', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff10'}}/>
          <Bar dataKey="value" fill="#00ffff" barSize={15} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart; 