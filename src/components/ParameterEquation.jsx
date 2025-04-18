import React, { useState, useEffect } from 'react';
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
import * as math from 'mathjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Функция для форматирования неравенства в виде строки
const getInequalityString = (type, a, b, c, d, p, q, r) => {
  switch (type) {
    case 'quadratic':
      return `${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} ${p >= 0 ? '>' : '<'} 0`;
    case 'linear':
      return `${a}x ${b >= 0 ? '+' : ''}${b} ${p >= 0 ? '>' : '<'} 0`;
    case 'rational':
      return `(${a}x ${b >= 0 ? '+' : ''}${b})/(${c}x ${d >= 0 ? '+' : ''}${d}) ${p >= 0 ? '>' : '<'} 0`;
    case 'exponential':
      return `${a}e^(${b}x) ${c >= 0 ? '+' : ''}${c} ${p >= 0 ? '>' : '<'} 0`;
    case 'logarithmic':
      return `${a}ln(${b}x ${c >= 0 ? '+' : ''}${c}) ${p >= 0 ? '>' : '<'} 0`;
    case 'trigonometric':
      return `${a}sin(${b}x ${c >= 0 ? '+' : ''}${c}) ${p >= 0 ? '>' : '<'} 0`;
    case 'cubic':
      return `${a}x³ ${b >= 0 ? '+' : ''}${b}x² ${c >= 0 ? '+' : ''}${c}x ${d >= 0 ? '+' : ''}${d} ${p >= 0 ? '>' : '<'} 0`;
    case 'power':
      return `${a}x^${p} ${b >= 0 ? '+' : ''}${b} ${c >= 0 ? '>' : '<'} 0`;
    case 'hyperbolic':
      return `${a}sinh(${b}x) ${c >= 0 ? '+' : ''}${c}cosh(${d}x) ${p >= 0 ? '>' : '<'} 0`;
    case 'absolute':
      return `|${a}x ${b >= 0 ? '+' : ''}${b}| ${p >= 0 ? '>' : '<'} 0`;
    case 'irrational':
      return `√(${a}x ${b >= 0 ? '+' : ''}${b}) ${p >= 0 ? '>' : '<'} 0`;
    case 'system':
      return `{ ${a}x ${b >= 0 ? '+' : ''}${b}y ${p >= 0 ? '>' : '<'} 0\n${c}x ${d >= 0 ? '+' : ''}${d}y ${q >= 0 ? '>' : '<'} 0 }`;
    case 'differential':
      return `dy/dx ${a >= 0 ? '>' : '<'} ${b}y ${c >= 0 ? '+' : ''}${c}x`;
    case 'parametric':
      return `x = ${a}t ${b >= 0 ? '+' : ''}${b}\ny = ${c}t ${d >= 0 ? '+' : ''}${d}`;
    default:
      return '';
  }
};

// Функция для решения неравенств с параметром в разных диапазонах
const solveForParameterRange = (type, a, b, c, d, p, q, r) => {
  let solution = '';
  
  switch (type) {
    case 'quadratic':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, 0, 0, 0, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, 0, 0, 0, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, 0, 0, 0, 0)}`;
      break;
    case 'linear':
      solution = `Для p > 0:\n${solveInequality(type, a, b, 0, 0, p, 0, 0)}\n\nДля p < 0:\n${solveInequality(type, a, b, 0, 0, -p, 0, 0)}\n\nДля p = 0:\n${solveInequality(type, a, b, 0, 0, 0, 0, 0)}`;
      break;
    case 'rational':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, d, p, 0, 0)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, d, -p, 0, 0)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, d, 0, 0, 0)}`;
      break;
    case 'exponential':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, 0)}`;
      break;
    case 'logarithmic':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, 0)}`;
      break;
    case 'trigonometric':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, 0)}`;
      break;
    case 'cubic':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, d, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, d, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, d, 0)}`;
      break;
    case 'power':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, 0)}`;
      break;
    case 'hyperbolic':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, d, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, d, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, d, 0)}`;
      break;
    case 'absolute':
      solution = `Для p > 0:\n${solveInequality(type, a, b, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, 0)}`;
      break;
    case 'irrational':
      solution = `Для p > 0:\n${solveInequality(type, a, b, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, 0)}`;
      break;
    case 'system':
      solution = `Для p > 0, q > 0:\n${solveInequality(type, a, b, c, d, p, q)}\n\nДля p < 0, q < 0:\n${solveInequality(type, a, b, c, d, -p, -q)}\n\nДля p = 0, q = 0:\n${solveInequality(type, a, b, c, d, 0, 0)}`;
      break;
    case 'differential':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, 0)}`;
      break;
    case 'parametric':
      solution = `Для p > 0:\n${solveInequality(type, a, b, c, d, p)}\n\nДля p < 0:\n${solveInequality(type, a, b, c, d, -p)}\n\nДля p = 0:\n${solveInequality(type, a, b, c, d, 0)}`;
      break;
    default:
      solution = 'Неподдерживаемый тип неравенства';
  }
  
  return solution;
};

// Вспомогательная функция для решения неравенства с конкретным значением параметра
const solveInequality = (type, a, b, c, d, p, q, r) => {
  try {
    // Проверка на некорректные параметры
    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      return 'Ошибка: введите числовые значения для всех параметров';
    }

    switch (type) {
      case 'quadratic':
        if (a === 0) {
          return 'Ошибка: коэффициент a не может быть равен 0 для квадратного неравенства';
        }
        const discriminant = b * b - 4 * a * c;
        if (discriminant > 0) {
          const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          if (p > 0) {
            return a > 0 
              ? `x ∈ (-∞; ${x2.toFixed(4)}) ∪ (${x1.toFixed(4)}; +∞)`
              : `x ∈ (${x2.toFixed(4)}; ${x1.toFixed(4)})`;
          } else if (p < 0) {
            return a > 0 
              ? `x ∈ (${x2.toFixed(4)}; ${x1.toFixed(4)})`
              : `x ∈ (-∞; ${x2.toFixed(4)}) ∪ (${x1.toFixed(4)}; +∞)`;
          } else {
            return `x = ${x1.toFixed(4)} или x = ${x2.toFixed(4)}`;
          }
        } else if (discriminant === 0) {
          const x = -b / (2 * a);
          if (p > 0) {
            return a > 0 
              ? `x ∈ (-∞; ${x.toFixed(4)}) ∪ (${x.toFixed(4)}; +∞)`
              : `x ∈ ∅`;
          } else if (p < 0) {
            return a > 0 
              ? `x ∈ ∅`
              : `x ∈ (-∞; ${x.toFixed(4)}) ∪ (${x.toFixed(4)}; +∞)`;
          } else {
            return `x = ${x.toFixed(4)}`;
          }
        } else {
          if (p > 0) {
            return a > 0 ? 'x ∈ ℝ' : 'x ∈ ∅';
          } else if (p < 0) {
            return a > 0 ? 'x ∈ ∅' : 'x ∈ ℝ';
          } else {
            return 'x ∈ ∅';
          }
        }

      case 'linear':
        if (a === 0) {
          if (p > 0) {
            return b > 0 ? 'x ∈ ℝ' : 'x ∈ ∅';
          } else if (p < 0) {
            return b > 0 ? 'x ∈ ∅' : 'x ∈ ℝ';
          } else {
            return b === 0 ? 'x ∈ ℝ' : 'x ∈ ∅';
          }
        }
        const x = -b / a;
        if (p > 0) {
          return a > 0 
            ? `x ∈ (${x.toFixed(4)}; +∞)`
            : `x ∈ (-∞; ${x.toFixed(4)})`;
        } else if (p < 0) {
          return a > 0 
            ? `x ∈ (-∞; ${x.toFixed(4)})`
            : `x ∈ (${x.toFixed(4)}; +∞)`;
        } else {
          return `x = ${x.toFixed(4)}`;
        }

      case 'rational':
        if (c === 0) {
          return 'Ошибка: знаменатель не может быть равен 0';
        }
        const criticalPoint = (p * c - b) / (a - p * d);
        if (isNaN(criticalPoint) || !isFinite(criticalPoint)) {
          return 'Решение не существует';
        }
        if (p > 0) {
          return (a - p * d) > 0 
            ? `x ∈ (${criticalPoint.toFixed(4)}; +∞)`
            : `x ∈ (-∞; ${criticalPoint.toFixed(4)})`;
        } else if (p < 0) {
          return (a - p * d) > 0 
            ? `x ∈ (-∞; ${criticalPoint.toFixed(4)})`
            : `x ∈ (${criticalPoint.toFixed(4)}; +∞)`;
        } else {
          return `x = ${criticalPoint.toFixed(4)}`;
        }

      case 'exponential':
        if (a <= 0 || a === 1 || b === 0) {
          return 'Ошибка: некорректные параметры для показательного неравенства';
        }
        const expX = Math.log(Math.abs((p - c) / a)) / Math.log(Math.E);
        if (isNaN(expX)) {
          return 'Решение не существует';
        }
        return b > 0 
          ? `x ∈ (${expX.toFixed(4)}; +∞)`
          : `x ∈ (-∞; ${expX.toFixed(4)})`;

      case 'logarithmic':
        if (a === 0 || b <= 0) {
          return 'Ошибка: некорректные параметры для логарифмического неравенства';
        }
        const logX = (Math.exp(p / a) - c) / b;
        if (logX <= 0) {
          return 'Решение не существует в области определения логарифма';
        }
        return a > 0 
          ? `x ∈ (${logX.toFixed(4)}; +∞)`
          : `x ∈ (0; ${logX.toFixed(4)})`;

      case 'trigonometric':
        if (a !== 0) {
          const x = (Math.asin(p / a) - c) / b;
          if (a > 0) {
            return `x > ${x.toFixed(4)}`;
          } else {
            return `x < ${x.toFixed(4)}`;
          }
        } else {
          return 'Некорректные параметры';
        }

      case 'cubic':
        const roots = findRoots(a, b, c, d);
        if (roots.length > 0) {
          if (a > 0) {
            return `x < ${roots[0].toFixed(4)} или x > ${roots[roots.length - 1].toFixed(4)}`;
          } else {
            return `${roots[0].toFixed(4)} < x < ${roots[roots.length - 1].toFixed(4)}`;
          }
        } else {
          return a > 0 ? 'x ∈ ℝ' : 'x ∈ ∅';
        }

      case 'power':
        if (a !== 0 && p !== 0) {
          const x = Math.pow((c - b) / a, 1 / p);
          if (a * p > 0) {
            return `x > ${x.toFixed(4)}`;
          } else {
            return `x < ${x.toFixed(4)}`;
          }
        } else {
          return 'Некорректные параметры';
        }

      case 'hyperbolic':
        if (a !== 0 && b !== 0) {
          const x = Math.asinh(p / a) / b;
          if (a * b > 0) {
            return `x > ${x.toFixed(4)}`;
          } else {
            return `x < ${x.toFixed(4)}`;
          }
        } else {
          return 'Некорректные параметры';
        }

      case 'absolute':
        if (a !== 0) {
          const x1 = (p - b) / a;
          const x2 = (-p - b) / a;
          if (a > 0) {
            return `${x2.toFixed(4)} < x < ${x1.toFixed(4)}`;
          } else {
            return `x < ${x2.toFixed(4)} или x > ${x1.toFixed(4)}`;
          }
        } else {
          return 'Некорректные параметры';
        }

      case 'irrational':
        if (a > 0) {
          const x = (p * p - b) / a;
          if (a > 0) {
            return `x > ${x.toFixed(4)}`;
          } else {
            return `x < ${x.toFixed(4)}`;
          }
        } else {
          return 'Некорректные параметры';
        }

      case 'system':
        const det = a * d - b * c;
        if (det !== 0) {
          const x = (p * d - b * q) / det;
          const y = (a * q - p * c) / det;
          return `x > ${x.toFixed(4)} и y > ${y.toFixed(4)}`;
        } else {
          return 'Система не имеет единственного решения';
        }

      case 'differential':
        if (a !== 0) {
          const x = Math.log((p - c) / a) / b;
          if (a * b > 0) {
            return `x > ${x.toFixed(4)}`;
          } else {
            return `x < ${x.toFixed(4)}`;
          }
        } else {
          return 'Некорректные параметры';
        }

      case 'parametric':
        if (a !== 0 && c !== 0) {
          const t = p / a;
          const x = a * t + b;
          const y = c * t + d;
          return `t > ${t.toFixed(4)}, x > ${x.toFixed(4)}, y > ${y.toFixed(4)}`;
        } else {
          return 'Некорректные параметры';
        }

      default:
        return 'Неподдерживаемый тип неравенства';
    }
  } catch (error) {
    return `Ошибка при решении: ${error.message}`;
  }
};

const findRoots = (a, b, c, d) => {
  // Упрощенный метод нахождения корней кубического уравнения
  const roots = [];
  const step = 0.1;
  const range = 10;
  
  for (let x = -range; x <= range; x += step) {
    const y = a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;
    if (Math.abs(y) < 0.1) {
      roots.push(x);
    }
  }
  
  return roots;
};

const ParameterEquation = ({ darkMode }) => {
  const [equationType, setEquationType] = useState('quadratic');
  const [parameters, setParameters] = useState({
    a: 1,
    b: 0,
    c: 0,
    d: 0,
    p: 1
  });
  const [solution, setSolution] = useState('');
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [neuralResult, setNeuralResult] = useState(null);
  const [confidence, setConfidence] = useState(null);

  useEffect(() => {
    const initializeModel = async () => {
      try {
        const newModel = createModel();
        await trainModel(newModel);
        setModel(newModel);
      } catch (error) {
        console.error('Ошибка инициализации модели:', error);
        setError('Не удалось инициализировать нейросеть');
      }
    };
    initializeModel();
  }, []);

  const handleSolve = async () => {
    setError('');
    try {
      // Получаем строку неравенства
      const inequalityString = getInequalityString(equationType, parameters.a, parameters.b, parameters.c, parameters.d, parameters.p, parameters.q, parameters.r);
      
      // Решаем неравенство
      const result = solveForParameterRange(equationType, parameters.a, parameters.b, parameters.c, parameters.d, parameters.p, parameters.q, parameters.r);
      
      // Формируем полное решение с шагами
      const fullSolution = `Неравенство: ${inequalityString}\n\nРешение:\n${result}`;
      setSolution(fullSolution);
      
      // Получаем предсказание от нейросети
      if (model) {
        try {
          let input;
          switch (equationType) {
            case 'quadratic':
              input = `${parameters.a}x^2 + ${parameters.b}x + ${parameters.c}`;
              break;
            case 'linear':
              input = `${parameters.a}x + ${parameters.b}`;
              break;
            case 'rational':
              input = `(${parameters.a}x + ${parameters.b})/(${parameters.c}x + ${parameters.d})`;
              break;
            default:
              input = `${parameters.a}x + ${parameters.b}`;
          }
          
          const prediction = await predict(model, input);
          if (prediction && typeof prediction.prediction === 'number' && !isNaN(prediction.prediction)) {
            // Добавляем в историю
            const historyItem = {
              type: equationType,
              a: parameters.a,
              b: parameters.b,
              c: parameters.c,
              d: parameters.d,
              p: parameters.p,
              q: parameters.q,
              r: parameters.r,
              solution: fullSolution,
              neuralResult: prediction.prediction,
              confidence: prediction.confidence,
              timestamp: new Date().toLocaleString()
            };
            setHistory(prev => [...prev, historyItem].slice(-5));
            setNeuralResult(prediction.prediction);
            setConfidence(prediction.confidence);
          } else {
            setError('Некорректный результат от нейросети');
          }
        } catch (err) {
          console.error('Ошибка при получении предсказания:', err);
          setError('Не удалось получить предсказание от нейросети');
        }
      }
    } catch (err) {
      setError(err.message);
      setSolution('');
    }
  };

  const handleClear = () => {
    setParameters({
      a: 1,
      b: 0,
      c: 0,
      d: 0,
      p: 1
    });
    setSolution('');
    setError('');
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-8">
              Решение уравнений с параметрами
            </h1>

            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {showHelp && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">Как использовать:</h2>
                <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-300">
                  <li>Выберите тип уравнения</li>
                  <li>Введите параметры уравнения</li>
                  <li>Нажмите "Решить" для получения решения</li>
                  <li>Используйте историю для просмотра предыдущих решений</li>
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тип уравнения
                </label>
                <select
                  value={equationType}
                  onChange={(e) => setEquationType(e.target.value)}
                  className={`w-full p-3 rounded-lg border-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="quadratic">Квадратное</option>
                  <option value="linear">Линейное</option>
                  <option value="rational">Рациональное</option>
                  <option value="exponential">Показательное</option>
                  <option value="logarithmic">Логарифмическое</option>
                  <option value="trigonometric">Тригонометрическое</option>
                </select>
              </div>

              <div className="space-y-4">
                {Object.entries(parameters).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Параметр {key.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setParameters({ ...parameters, [key]: parseFloat(e.target.value) })}
                      className={`w-full p-3 rounded-lg border-2 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleSolve}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Решить
              </button>
              <button
                onClick={handleClear}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Очистить
              </button>
              <button
                onClick={handleShowHistory}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {showHistory ? 'Скрыть историю' : 'Показать историю'}
              </button>
            </div>

            {solution && (
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Решение:
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <MathJaxContext>
                    <MathJax>{solution}</MathJax>
                  </MathJaxContext>
                </div>
              </div>
            )}

            {showHistory && history.length > 0 && (
              <div className="mt-8">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  История решений:
                </h3>
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.timestamp}
                      </p>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Тип: {item.type}
                      </p>
                      <div className="prose dark:prose-invert max-w-none">
                        <MathJaxContext>
                          <MathJax>{item.solution}</MathJax>
                        </MathJaxContext>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterEquation; 