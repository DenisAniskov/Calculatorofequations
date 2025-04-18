import { useState, useEffect } from 'react';

const useSolutions = () => {
  const [solutions, setSolutions] = useState(() => {
    const savedSolutions = localStorage.getItem('inequalitySolutions');
    return savedSolutions ? JSON.parse(savedSolutions) : [];
  });

  useEffect(() => {
    localStorage.setItem('inequalitySolutions', JSON.stringify(solutions));
  }, [solutions]);

  const addSolution = (solution) => {
    setSolutions(prevSolutions => {
      const newSolutions = [...prevSolutions, solution];
      // Ограничиваем количество сохраненных решений
      return newSolutions.slice(-10);
    });
  };

  const clearSolutions = () => {
    setSolutions([]);
  };

  return {
    solutions,
    addSolution,
    clearSolutions
  };
};

export default useSolutions; 