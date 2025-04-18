import React from 'react';

const InequalityGraph = ({ inequality, solution }) => {
  return (
    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        График решения
      </h3>
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        График будет добавлен в следующем обновлении
      </div>
    </div>
  );
};

export default InequalityGraph; 