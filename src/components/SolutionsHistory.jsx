import React, { useState } from 'react';
import AccessibleButton from './AccessibleButton';
import ShareButtons from './ShareButtons';
import useSolutions from '../hooks/useSolutions';
import { exportSolutionToPDF, exportMultipleSolutionsToPDF } from '../utils/exportToPDF';

const SolutionsHistory = () => {
  const {
    solutions,
    deleteSolution,
    toggleFavorite,
    clearHistory,
    searchSolutions
  } = useSolutions();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedSolution, setExpandedSolution] = useState(null);

  const filteredSolutions = searchQuery
    ? searchSolutions(searchQuery)
    : showFavoritesOnly
    ? solutions.filter(s => s.isFavorite)
    : solutions;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSolutionExpansion = (id) => {
    setExpandedSolution(expandedSolution === id ? null : id);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">История решений</h2>
        <div className="flex space-x-3">
          <AccessibleButton
            variant="outline"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            tooltipText={showFavoritesOnly ? "Показать все" : "Показать избранное"}
            icon={showFavoritesOnly ? "★" : "☆"}
          >
            {showFavoritesOnly ? "Все" : "Избранное"}
          </AccessibleButton>
          <AccessibleButton
            variant="success"
            onClick={() => exportMultipleSolutionsToPDF(filteredSolutions)}
            tooltipText="Экспортировать все в PDF"
            disabled={filteredSolutions.length === 0}
            icon="📄"
          >
            Экспорт PDF
          </AccessibleButton>
          <AccessibleButton
            variant="danger"
            onClick={clearHistory}
            tooltipText="Очистить историю"
            icon="🗑️"
          >
            Очистить
          </AccessibleButton>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск по решениям..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredSolutions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            {searchQuery
              ? "Решения не найдены"
              : showFavoritesOnly
              ? "Нет избранных решений"
              : "История пуста"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSolutions.map((solution) => (
            <div
              key={solution.id}
              className="solution-item p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{solution.inequality}</h3>
                  <p className="text-sm text-gray-600">
                    Параметр: {solution.parameter}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(solution.timestamp)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <ShareButtons solution={solution} />
                  <AccessibleButton
                    variant="success"
                    onClick={() => exportSolutionToPDF(solution)}
                    tooltipText="Экспортировать в PDF"
                    icon="📄"
                  >
                    PDF
                  </AccessibleButton>
                  <AccessibleButton
                    variant="outline"
                    onClick={() => toggleFavorite(solution.id)}
                    tooltipText={solution.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                    icon={solution.isFavorite ? "★" : "☆"}
                  />
                  <AccessibleButton
                    variant="danger"
                    onClick={() => deleteSolution(solution.id)}
                    tooltipText="Удалить"
                    icon="✕"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <AccessibleButton
                  variant="outline"
                  onClick={() => toggleSolutionExpansion(solution.id)}
                  className="w-full text-left"
                  icon={expandedSolution === solution.id ? "▼" : "▶"}
                >
                  {expandedSolution === solution.id ? "Скрыть решение" : "Показать решение"}
                </AccessibleButton>
                
                {expandedSolution === solution.id && solution.steps && (
                  <div className="mt-4 pl-4 border-l-2 border-indigo-500">
                    <h4 className="font-medium text-gray-700 mb-2">Шаги решения:</h4>
                    <ul className="space-y-2">
                      {solution.steps.map((step, index) => (
                        <li key={index} className="text-gray-600">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolutionsHistory; 