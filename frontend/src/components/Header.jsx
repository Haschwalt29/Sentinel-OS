import React from 'react';

const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Sentinel OS
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Global Instability Monitoring
        </p>
      </div>
    </header>
  );
};

export default Header; 