import React from 'react';
import { AccessibleButton } from './AccessibleButton';

/**
 * Компонент навигации с поддержкой доступности и адаптивности
 */
const Navigation = ({ activeTab, onTabChange, tabs, darkMode }) => {
  return (
    <nav 
      className={`mb-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} 
      aria-label="Основная навигация"
      role="navigation"
    >
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`
              px-4 py-2 font-medium rounded-t-lg transition-colors duration-200 
              focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500
              ${activeTab === tab.id 
                ? (darkMode ? 'bg-gray-800 text-blue-400 border-blue-500' : 'bg-white text-blue-600 border-blue-600') 
                : (darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200')
              } 
              border-b-2 
              ${activeTab === tab.id ? 'border-blue-500' : 'border-transparent'}
            `}
          >
            <span className="flex items-center">
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation; 