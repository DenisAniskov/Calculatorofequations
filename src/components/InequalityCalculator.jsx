import React, { useState, useEffect } from 'react';
import { validateInequality, solveQuadraticInequality, solveLinearInequality, solveRationalInequality, parseInequality } from '../utils/mathUtils';
import ThemeToggle from './ThemeToggle';
import InequalityGraph from './InequalityGraph';
import Button from './Button';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import * as tf from '@tensorflow/tfjs';
import { createModel, trainModel, predict } from '../utils/neuralNetwork';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const InequalityCalculator = ({ darkMode }) => {
  const [inequality, setInequality] = useState('');
  const [solution, setSolution] = useState([]);
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(true);
  const [selectedParameter, setSelectedParameter] = useState('a');
  const [type, setType] = useState('quadratic');
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(0);
  const [rationalInequality, setRationalInequality] = useState('');
  const [operator, setOperator] = useState('>');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [neuralResult, setNeuralResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [latexExpression, setLatexExpression] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [inequalityType, setInequalityType] = useState('quadratic');
  const [p, setP] = useState(1);
  const [q, setQ] = useState(1);
  const [r, setR] = useState(1);

  const handleInequalityChange = (e) => {
    const value = e.target.value;
    setInequality(value);
    setError('');
    setSolution([]);
    // Convert to LaTeX for display
    setLatexExpression(convertToLatex(value));
  };

  const convertToLatex = (expression) => {
    // Basic conversion to LaTeX
    return expression
      .replace(/\^/g, '^')
      .replace(/\*/g, '\\cdot')
      .replace(/\//g, '\\div')
      .replace(/sqrt/g, '\\sqrt')
      .replace(/sin/g, '\\sin')
      .replace(/cos/g, '\\cos')
      .replace(/tan/g, '\\tan')
      .replace(/log/g, '\\log')
      .replace(/ln/g, '\\ln');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSolution([]);

    try {
      // Валидация входных данных
      validateInequality(inequality);

      // Парсим неравенство для определения его типа и параметров
      const params = parseInequality(inequality);
      
      let result;
      switch (params.type) {
        case 'quadratic':
          result = solveQuadraticInequality(params);
          break;
        case 'linear':
          result = solveLinearInequality(params);
          break;
        case 'rational':
          result = solveRationalInequality(inequality);
          break;
        default:
          throw new Error('Неподдерживаемый тип неравенства');
      }

      setSolution(result);
    } catch (error) {
      setError(error.message);
    }
  };

  const copyToClipboard = () => {
    if (solution) {
      // Если solution - это массив, объединяем его в строку
      const text = Array.isArray(solution) ? solution.join('\n') : solution;
      
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error('Ошибка при копировании:', err);
          setError('Не удалось скопировать решение');
        });
    }
  };

  const generateGraphData = () => {
    if (!solution) return;

    const range = 10;
    const points = 100;
    const step = (range * 2) / points;
    const xValues = [];
    const yValues = [];

    for (let i = -range; i <= range; i += step) {
      xValues.push(i);
      let y;
      if (type === 'quadratic') {
        y = Number(a) * i * i + Number(b) * i + Number(c);
      } else if (type === 'linear') {
        y = Number(a) * i + Number(b);
      } else if (type === 'rational') {
        y = (Number(a) * i + Number(b)) / (Number(c) * i + Number(d));
      }
      yValues.push(y);
    }

    const data = {
      labels: xValues,
      datasets: [
        {
          label: type === 'quadratic' ? 'y = ax² + bx + c' : 
                 type === 'linear' ? 'y = ax + b' : 
                 'y = (ax + b)/(cx + d)',
          data: yValues,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
        {
          label: 'y = 0',
          data: xValues.map(() => 0),
          borderColor: 'rgb(255, 99, 132)',
          borderDash: [5, 5],
          tension: 0,
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Графическое решение неравенства'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'x'
          }
        },
        y: {
          title: {
            display: true,
            text: 'y'
          }
        }
      }
    };

    setGraphData({ data, options });
    setShowGraph(true);
  };

  const handleSolve = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      switch (type) {
        case 'quadratic':
          if (!a || !b || !c) {
            throw new Error('Пожалуйста, введите все коэффициенты');
          }
          if (isNaN(a) || isNaN(b) || isNaN(c)) {
            throw new Error('Коэффициенты должны быть числами');
          }
          result = solveQuadraticInequality(Number(a), Number(b), Number(c));
          break;
        case 'linear':
          if (!a || !b) {
            throw new Error('Пожалуйста, введите все коэффициенты');
          }
          if (isNaN(a) || isNaN(b)) {
            throw new Error('Коэффициенты должны быть числами');
          }
          result = solveLinearInequality(Number(a), Number(b));
          break;
        case 'rational':
          if (!a || !b || !c || !d) {
            throw new Error('Пожалуйста, введите все коэффициенты');
          }
          if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
            throw new Error('Коэффициенты должны быть числами');
          }
          if (Number(c) === 0 && Number(d) === 0) {
            throw new Error('Знаменатель не может быть равен нулю');
          }
          result = solveRationalInequality(Number(a), Number(b), Number(c), Number(d));
          break;
        default:
          throw new Error('Неподдерживаемый тип неравенства');
      }

      setSolution(result);
      generateGraphData();

      // Получаем предсказание от нейросети
      if (model && !modelError) {
        try {
          const input = type === 'quadratic' ? 
            `${a}x^2 + ${b}x + ${c}` :
            type === 'linear' ? 
            `${a}x + ${b}` :
            `(${a}x + ${b})/(${c}x + ${d})`;
            
          const neuralPrediction = await predict(model, input);
          setNeuralResult(neuralPrediction);
          
          // Рассчитываем уверенность на основе сравнения с аналитическим решением
          const analyticalResult = result.solution;
          const diff = Math.abs(analyticalResult - neuralPrediction);
          const maxDiff = Math.max(Math.abs(analyticalResult), Math.abs(neuralPrediction));
          const conf = Math.max(0, 100 * (1 - diff / (maxDiff || 1)));
          setConfidence(conf);
        } catch (error) {
          console.error('Ошибка при получении предсказания:', error);
          setNeuralResult(null);
          setConfidence(null);
        }
      }

      // Добавляем в историю с временной меткой
      const historyItem = {
        type,
        a, b, c, d,
        solution: result,
        neuralResult,
        timestamp: new Date().toLocaleString(),
        expression: type === 'quadratic' ? 
          `${a}x^2 + ${b}x + ${c} ${operator} 0` :
          type === 'linear' ? 
          `${a}x + ${b} ${operator} 0` :
          `(${a}x + ${b})/(${c}x + ${d}) ${operator} 0`
      };

      setHistory(prev => {
        const newHistory = [...prev, historyItem];
        // Сохраняем только последние 5 решений
        return newHistory.slice(-5);
      });

    } catch (err) {
      setError(err.message || 'Произошла ошибка при решении неравенства');
      setSolution(null);
      setNeuralResult(null);
      setConfidence(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setA(1);
    setB(0);
    setC(0);
    setD(0);
    setRationalInequality('');
    setOperator('>');
    setSolution(null);
    setError(null);
    setCopySuccess(false);
    setShowGraph(false);
    setGraphData(null);
    setNeuralResult(null);
    setConfidence(null);
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
  };

  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsModelLoading(true);
        setModelError(null);
        
        // Инициализируем TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js initialized');
        
        // Создаем модель
        const newModel = await createModel();
        if (!newModel) {
          throw new Error('Не удалось создать модель');
        }
        
        // Обучаем модель
        const trainingResult = await trainModel(newModel, 'quadratic', 100, 0.01, (progress) => {
          setTrainingProgress(progress);
        });
        if (!trainingResult) {
          throw new Error('Не удалось обучить модель');
        }
        
        setModel(newModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Ошибка при инициализации модели:', error);
        setModelError(error.message);
        setIsModelLoading(false);
      }
    };

    initializeModel();
    
    // Очистка при размонтировании
    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, []);

  // Добавляем индикатор загрузки модели
  if (isModelLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Загрузка нейронной сети... {trainingProgress}%
          </p>
        </div>
      </div>
    );
  }

  // Показываем ошибку, если не удалось загрузить модель
  if (modelError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{modelError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    );
  }

  const formatSolution = (solution) => {
    if (!solution) return '';
    
    // Если решение - это объект с полем solution
    if (typeof solution === 'object' && solution.solution) {
      solution = solution.solution;
    }
    
    // Если решение - это массив
    if (Array.isArray(solution)) {
      return solution.map((step, index) => `${index + 1}. ${step}`).join('\n');
    }
    
    // Если решение - это строка
    if (typeof solution === 'string') {
      const steps = solution.split(';').map(step => step.trim());
      return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
    }
    
    // Если решение - это число
    if (typeof solution === 'number') {
      return `1. x = ${solution}`;
    }
    
    return 'Решение не может быть отформатировано';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Калькулятор неравенств
              </h1>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {showHelp && (
              <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 transform transition-all duration-300">
                <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-200">Как использовать:</h2>
                <ul className="list-disc list-inside space-y-3 text-blue-700 dark:text-blue-300">
                  <li>Введите неравенство в формате: ax² + bx + c &gt; 0</li>
                  <li>Поддерживаются операции: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), ln()</li>
                  <li>Используйте скобки для группировки выражений</li>
                  <li>Нажмите "Решить" для получения решения</li>
                  <li>Используйте "Показать шаги" для пошагового решения</li>
                </ul>
              </div>
            )}

            <div className="mb-8">
              <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                Введите неравенство:
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inequality}
                  onChange={handleInequalityChange}
                  placeholder="Например: x^2 + 2x + 1 > 0"
                  className={`flex-1 p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className={`p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="=">=</option>
                </select>
              </div>
              {latexExpression && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <MathJaxContext>
                    <MathJax>{`$$${latexExpression}$$`}</MathJax>
                  </MathJaxContext>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                Тип неравенства:
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  handleClear();
                }}
                className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="quadratic">Квадратное (ax² + bx + c)</option>
                <option value="linear">Линейное (ax + b)</option>
                <option value="rational">Рациональное ((ax + b)/(cx + d))</option>
              </select>
            </div>

            {type === 'quadratic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент a (при x²):
                    </label>
                    <input
                      type="text"
                      value={a}
                      onChange={(e) => setA(e.target.value)}
                      placeholder="Например: 1"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент b (при x):
                    </label>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => setB(e.target.value)}
                      placeholder="Например: 2"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент c (свободный член):
                    </label>
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => setC(e.target.value)}
                      placeholder="Например: 1"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'linear' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент a (при x):
                    </label>
                    <input
                      type="text"
                      value={a}
                      onChange={(e) => setA(e.target.value)}
                      placeholder="Например: 2"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент b (свободный член):
                    </label>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => setB(e.target.value)}
                      placeholder="Например: 1"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'rational' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент a (числитель):
                    </label>
                    <input
                      type="number"
                      value={a}
                      onChange={(e) => setA(e.target.value)}
                      placeholder="Например: 1"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент b (числитель):
                    </label>
                    <input
                      type="number"
                      value={b}
                      onChange={(e) => setB(e.target.value)}
                      placeholder="Например: 2"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент c (знаменатель):
                    </label>
                    <input
                      type="number"
                      value={c}
                      onChange={(e) => setC(e.target.value)}
                      placeholder="Например: 1"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                      Коэффициент d (знаменатель):
                    </label>
                    <input
                      type="number"
                      value={d}
                      onChange={(e) => setD(e.target.value)}
                      placeholder="Например: 3"
                      className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex space-x-4">
              <button
                onClick={handleSolve}
                disabled={isLoading}
                className={`flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transform hover:scale-105 transition-all duration-200 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                {isLoading ? 'Решение...' : 'Решить'}
              </button>
              <button
                onClick={handleClear}
                className={`flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transform hover:scale-105 transition-all duration-200 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Очистить
              </button>
              <button
                onClick={handleShowHistory}
                className={`flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transform hover:scale-105 transition-all duration-200 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                {showHistory ? 'Скрыть историю' : 'Показать историю'}
              </button>
            </div>

            {solution && (
              <div className="mt-8 space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 transform hover:scale-[1.01] transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Решение:</h2>
                    <div className="flex space-x-3">
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                      >
                        {copySuccess ? 'Скопировано!' : 'Копировать'}
                      </button>
                      <button
                        onClick={() => setShowSteps(!showSteps)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                      >
                        {showSteps ? 'Скрыть шаги' : 'Показать шаги'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-700 dark:text-gray-200">
                    {showSteps && (
                      <pre className="whitespace-pre-wrap font-mono text-lg bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        {formatSolution(solution)}
                      </pre>
                    )}
                  </div>
                </div>
                
                {showGraph && graphData && (
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform hover:scale-[1.01] transition-all duration-300">
                    <Line data={graphData.data} options={graphData.options} />
                  </div>
                )}

                {neuralResult !== null && (
                  <div className="mt-6">
                    <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Результат нейросети:
                    </h3>
                    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                      <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Предсказание: {neuralResult.toFixed(4)}
                      </p>
                      {confidence !== null && (
                        <p className={`text-base mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Уверенность: {confidence.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showHistory && history.length > 0 && (
              <div className="mt-8">
                <h3 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  История решений:
                </h3>
                <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {history.map((item, index) => (
                    <div key={index} className={`p-6 rounded-xl border-b transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
                      <p className="text-lg font-medium">Тип: {item.type}</p>
                      <p className="mt-2">Параметры: a={item.a}, b={item.b}, c={item.c}, d={item.d}</p>
                      <p className="mt-2">Алгоритмический результат: {item.solution.solution}</p>
                      <p className="mt-2">Результат нейросети: {item.neuralResult?.toFixed(4)}</p>
                      <p className="mt-2 text-sm text-gray-500">{item.timestamp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-gray-600 dark:text-gray-300">
            <p className="text-lg">Создатель: Денис Аниськов</p>
            <a
              href="https://github.com/DenisAniskov/Calculatorofenequalswithparametersbasedonai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white inline-block mt-4 transform hover:scale-110 transition-all duration-200"
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InequalityCalculator; 