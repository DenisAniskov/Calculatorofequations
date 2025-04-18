import { useState, useEffect } from 'react';

const API_URL = '/.netlify/functions/solutions'; // Adjust this to your actual Netlify function endpoint
const MAX_SOLUTIONS = 100;

export const useSolutions = () => {
  const [solutions, setSolutions] = useState([]);

  // Load solutions on initialization
  useEffect(() => {
    const fetchSolutions = async () => {
      const response = await fetch(API_URL);
      if (response.ok) {
        const storedSolutions = await response.json();
        setSolutions(storedSolutions);
      }
    };
    fetchSolutions();
  }, []);

  const saveSolution = async (solution) => {
    const newSolution = {
      ...solution,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      isFavorite: false
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSolution),
    });

    if (response.ok) {
      const updatedSolutions = [newSolution, ...solutions].slice(0, MAX_SOLUTIONS);
      setSolutions(updatedSolutions);
    }
    return newSolution.id;
  };

  const deleteSolution = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      const updatedSolutions = solutions.filter(s => s.id !== id);
      setSolutions(updatedSolutions);
    }
  };

  // Toggle favorite
  const toggleFavorite = (id) => {
    setSolutions(prevSolutions => {
      const updatedSolutions = prevSolutions.map(s => 
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      );
      return updatedSolutions;
    });
  };

  // Clear history
  const clearHistory = async () => {
    await fetch(API_URL, { method: 'DELETE' }); // Assuming this clears all solutions
    setSolutions([]);
  };

  // Get favorite solutions
  const getFavoriteSolutions = () => {
    return solutions.filter(s => s.isFavorite);
  };

  // Search solutions
  const searchSolutions = (query) => {
    const searchTerm = query.toLowerCase();
    return solutions.filter(s => 
      s.inequality.toLowerCase().includes(searchTerm) ||
      s.parameter.toLowerCase().includes(searchTerm)
    );
  };

  return {
    solutions,
    saveSolution,
    deleteSolution,
    toggleFavorite,
    clearHistory,
    getFavoriteSolutions,
    searchSolutions,
  };
};