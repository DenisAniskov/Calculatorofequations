import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg mb-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                location.pathname === '/'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Калькулятор
            </Link>
            <Link
              to="/train"
              className={`ml-8 inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                location.pathname === '/train'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Обучение нейросети
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 