import React from 'react';
import { motion } from 'framer-motion';
import { generateRecommendations } from '../utils/equationUtils';

const RecommendationPanel = ({ type, parameters, darkMode, onSelectRecommendation }) => {
  const { a, b, c, d, p } = parameters;
  const recommendations = generateRecommendations(type, a, b, c, d, p);
  
  if (!recommendations || recommendations.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg overflow-hidden mb-6 border ${
        darkMode 
          ? 'bg-indigo-900 bg-opacity-20 border-indigo-800' 
          : 'bg-indigo-50 border-indigo-100'
      }`}
    >
      <div className="p-4">
        <h3 className={`font-medium mb-3 flex items-center ${
          darkMode ? 'text-indigo-300' : 'text-indigo-700'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Рекомендации
        </h3>
        
        <ul className="space-y-2">
          {recommendations.map((recommendation, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => onSelectRecommendation && onSelectRecommendation(recommendation)}
              className={`p-3 rounded-lg flex items-start cursor-pointer transform hover:scale-[1.01] transition-transform ${
                darkMode 
                  ? 'bg-indigo-800 bg-opacity-30 hover:bg-opacity-40 text-indigo-200' 
                  : 'bg-white hover:bg-indigo-50 text-indigo-900'
              }`}
            >
              <span className={`flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full mr-3 ${
                darkMode ? 'bg-indigo-700 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {index + 1}
              </span>
              <span>{recommendation}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default RecommendationPanel; 