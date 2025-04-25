import React, { useState, useEffect, useRef } from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import * as tf from '@tensorflow/tfjs';
import { motion, AnimatePresence } from 'framer-motion';
import { createModel, trainModel, predict, generateHints } from '../utils/neuralNetwork';
import { 
  formatEquationAsLatex,
  generateVisualizationData, 
  generateStepByStepSolution,
  findDomain,
  generateRecommendations
} from '../utils/equationUtils';
import EquationVisualizer from './EquationVisualizer';
import StepByStepSolution from './StepByStepSolution';
import RecommendationPanel from './RecommendationPanel';
import ExportSolution from './ExportSolution';

// Конфигурация MathJax
const mathJaxConfig = {
  loader: { load: ["[tex]/html", "[tex]/physics"] },
  tex: {
    packages: { "[+]": ["html", "physics"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"]
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"]
    ]
  }
};

// Расширенные типы уравнений
const EQUATION_TYPES = [
  { id: 'linear', name: 'Линейное', icon: '📏', color: 'blue' },
  { id: 'quadratic', name: 'Квадратное', icon: '📐', color: 'green' },
  { id: 'cubic', name: 'Кубическое', icon: '🧊', color: 'orange' },
  { id: 'rational', name: 'Рациональное', icon: '🔄', color: 'red' },
  { id: 'exponential', name: 'Показательное', icon: '📈', color: 'purple' },
  { id: 'logarithmic', name: 'Логарифмическое', icon: '📉', color: 'teal' },
  { id: 'trigonometric', name: 'Тригонометрическое', icon: '🔄', color: 'indigo' },
  { id: 'system', name: 'Система уравнений', icon: '🔗', color: 'amber' },
  { id: 'absolute', name: 'С модулем', icon: '|x|', color: 'pink' },
  { id: 'irrational', name: 'Иррациональное', icon: '√', color: 'cyan' }
];

// Режимы отображения
const VIEW_MODES = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  LEARNING: 'learning'
};

// Основной компонент
const EnhancedParameterEquation = ({ darkMode }) => {
  // Состояния для формы и ввода
  const [equationType, setEquationType] = useState('quadratic');
  const [parameters, setParameters] = useState({
    a: 1,
    b: 0,
    c: 0,
    d: 0,
    p: 1,
    q: 0,
    r: 0
  });
  const [viewMode, setViewMode] = useState(VIEW_MODES.BASIC);
  
  // Состояния для решения
  const [solution, setSolution] = useState('');
  const [latexEquation, setLatexEquation] = useState('');
  const [steps, setSteps] = useState([]);
  const [domain, setDomain] = useState('');
  const [roots, setRoots] = useState([]);
  const [error, setError] = useState(null);
  
  // Состояния для нейронной сети
  const [model, setModel] = useState(null);
  const [neuralPrediction, setNeuralPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  // Состояния для интерфейса
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState('solution');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Refs
  const solutionRef = useRef(null);
  
  // Инициализация модели при загрузке
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsModelLoading(true);
        const newModel = createModel();
        await trainModel(newModel);
        setModel(newModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Ошибка при инициализации модели:', error);
        setError('Не удалось инициализировать нейросеть');
        setIsModelLoading(false);
      }
    };
    
    initializeModel();
  }, []);
  
  // Функция для обновления параметров
  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };
  
  // Обработчик типа уравнения
  const handleEquationTypeChange = (type) => {
    setEquationType(type);
    
    // Сбрасываем некоторые параметры в зависимости от типа
    if (type === 'linear') {
      setParameters(prev => ({ ...prev, a: 1, b: 0, c: 0, d: 0 }));
    } else if (type === 'quadratic') {
      setParameters(prev => ({ ...prev, a: 1, b: 0, c: 0, d: 0 }));
    }
  };
  
  // Переключение режима просмотра
  const toggleViewMode = () => {
    if (viewMode === VIEW_MODES.BASIC) {
      setViewMode(VIEW_MODES.ADVANCED);
    } else if (viewMode === VIEW_MODES.ADVANCED) {
      setViewMode(VIEW_MODES.LEARNING);
    } else {
      setViewMode(VIEW_MODES.BASIC);
    }
  };
  
  // Функция для решения уравнения
  const handleSolve = async () => {
    setError(null);
    setIsAnimating(true);
    
    try {
      // Подготавливаем LaTeX представление уравнения
      const latex = formatEquationAsLatex(equationType, parameters.a, parameters.b, parameters.c, parameters.d, parameters.p, parameters.q, parameters.r);
      setLatexEquation(latex);
      
      // Генерируем шаги решения
      let solutionSteps = [];
      
      if (equationType === 'quadratic') {
        // Более понятные и правильные шаги решения для квадратного уравнения
        solutionSteps.push(`Рассмотрим квадратное уравнение: ${parameters.a}x^2 ${parameters.b >= 0 ? '+' : ''}${parameters.b}x ${parameters.c >= 0 ? '+' : ''}${parameters.c} = 0 при параметре p = ${parameters.p}`);
        
        const a = parameters.a;
        const b = parameters.b;
        const c = parameters.c;
        const D = b*b - 4*a*c;
        
        solutionSteps.push(`Шаг 1: Вычислим дискриминант: D = ${b}^2 - 4 \\cdot ${a} \\cdot ${c} = ${D}`);
        
        if (D > 0) {
          const x1 = (-b + Math.sqrt(D)) / (2 * a);
          const x2 = (-b - Math.sqrt(D)) / (2 * a);
          
          solutionSteps.push(`Шаг 2: Дискриминант положительный (${D} > 0), находим два корня:`);
          solutionSteps.push(`x_1 = \\frac{-${b} + \\sqrt{${D}}}{2 \\cdot ${a}} = ${x1.toFixed(4)}`);
          solutionSteps.push(`x_2 = \\frac{-${b} - \\sqrt{${D}}}{2 \\cdot ${a}} = ${x2.toFixed(4)}`);
          solutionSteps.push(`Ответ: x = ${x1.toFixed(4)} или x = ${x2.toFixed(4)}`);
          setRoots([x1, x2]);
        } else if (D === 0) {
          const x = -b / (2 * a);
          solutionSteps.push(`Шаг 2: Дискриминант равен нулю (${D} = 0), находим один корень:`);
          solutionSteps.push(`x = \\frac{-${b}}{2 \\cdot ${a}} = ${x.toFixed(4)}`);
          solutionSteps.push(`Ответ: x = ${x.toFixed(4)}`);
          setRoots([x]);
        } else {
          solutionSteps.push(`Шаг 2: Дискриминант отрицательный (${D} < 0), действительных корней нет`);
          solutionSteps.push(`Ответ: нет действительных корней`);
          setRoots([]);
        }
      } else {
        // Для других типов уравнений используем стандартную функцию
        solutionSteps = generateStepByStepSolution(equationType, parameters.a, parameters.b, parameters.c, parameters.d, parameters.p, parameters.q, parameters.r);
      }
      
      setSteps(solutionSteps);
      
      // Находим область определения
      const domainResult = findDomain(equationType, parameters.a, parameters.b, parameters.c, parameters.d);
      setDomain(domainResult);
      
      // Если корни не были установлены выше, получаем их из последнего шага
      if (roots.length === 0 && solutionSteps.length > 0) {
        const lastStep = solutionSteps[solutionSteps.length - 1];
        if (lastStep.includes('Ответ') && lastStep.includes('x =')) {
          const rootsMatch = lastStep.match(/x = ([-\d.]+)/g);
          if (rootsMatch) {
            const extractedRoots = rootsMatch.map(match => 
              parseFloat(match.replace('x = ', ''))
            );
            setRoots(extractedRoots);
          }
        }
      }
      
      // Получаем предсказание от нейросети
      if (model) {
        try {
          // Формируем входные данные для нейросети
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
          
          // Получаем предсказание
          const prediction = await predict(model, input);
          if (prediction && typeof prediction.prediction === 'number' && !isNaN(prediction.prediction)) {
            setNeuralPrediction(prediction.prediction);
            setConfidence(prediction.confidence);
            
            // Показываем рекомендации если уверенность ниже определенного порога
            if (prediction.confidence < 0.7) {
              setShowRecommendations(true);
            }
          }
        } catch (err) {
          console.error('Ошибка при предсказании:', err);
        }
      }
      
      // Добавляем в историю
      const timestamp = new Date().toLocaleString();
      const historyItem = {
        type: equationType,
        parameters: { ...parameters },
        equation: latex,
        steps: solutionSteps,
        domain: domainResult,
        roots: [...roots],
        timestamp
      };
      
      setHistory(prev => [historyItem, ...prev].slice(0, 10));
      
      // Прокручиваем к решению
      setTimeout(() => {
        if (solutionRef.current) {
          solutionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
    } catch (err) {
      console.error('Ошибка при решении:', err);
      setError(`Ошибка при решении: ${err.message}`);
    } finally {
      setIsAnimating(false);
    }
  };
  
  // Очистка формы
  const handleClear = () => {
    setParameters({
      a: 1,
      b: 0,
      c: 0,
      d: 0,
      p: 1,
      q: 0,
      r: 0
    });
    setSolution('');
    setLatexEquation('');
    setSteps([]);
    setDomain('');
    setRoots([]);
    setError(null);
    setNeuralPrediction(null);
    setConfidence(null);
    setShowRecommendations(false);
    setShowExport(false);
  };
  
  // Переключение истории
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };
  
  // Загрузка решения из истории
  const loadFromHistory = (item) => {
    setEquationType(item.type);
    setParameters(item.parameters);
    setLatexEquation(item.equation);
    setSteps(item.steps);
    setDomain(item.domain);
    setRoots(item.roots);
    setShowHistory(false);
    
    // Прокручиваем к решению
    setTimeout(() => {
      if (solutionRef.current) {
        solutionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Обработчик начала экспорта
  const handleExportStart = (type) => {
    console.log(`Начат экспорт в формате ${type}`);
  };
  
  // Обработчик завершения экспорта
  const handleExportComplete = (type) => {
    console.log(`Экспорт в формате ${type} завершен`);
  };
  
  // Обработчик ошибки экспорта
  const handleExportError = (type, errorMessage) => {
    setError(`Ошибка при экспорте в ${type}: ${errorMessage}`);
  };
  
  // Генерация классов для элементов интерфейса
  const getCardClasses = () => {
    return `bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'dark' : ''}`;
  };
  
  const getButtonClasses = (isAccent = false) => {
    return `flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
      isAccent 
        ? (darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white')
        : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')
    }`;
  };
  
  // Рендер компонента
  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Заголовок */}
            <div className={getCardClasses()}>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-4">
                  Решение уравнений с параметрами
                </h1>
                
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Мощный калькулятор для решения и визуализации уравнений с параметрами
                </p>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showHelp ? 'Скрыть помощь' : 'Показать помощь'}
                  </button>
                  
                  <button
                    onClick={toggleViewMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-indigo-700 hover:bg-indigo-600 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {viewMode === VIEW_MODES.BASIC ? 'Расширенный режим' : viewMode === VIEW_MODES.ADVANCED ? 'Режим обучения' : 'Простой режим'}
                  </button>
                </div>
              </motion.div>
              
              {/* Блок помощи */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6"
                  >
                    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-blue-50 text-blue-800'}`}>
                      <h2 className="text-xl font-semibold mb-4">Как использовать калькулятор:</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white bg-opacity-50'}`}>
                          <div className="flex items-center mb-2">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-2 bg-blue-500 text-white font-bold">1</span>
                            <h3 className="font-medium">Выберите тип уравнения</h3>
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Доступны различные типы: линейное, квадратное, кубическое и другие.
                          </p>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white bg-opacity-50'}`}>
                          <div className="flex items-center mb-2">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-2 bg-blue-500 text-white font-bold">2</span>
                            <h3 className="font-medium">Задайте параметры</h3>
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Введите коэффициенты уравнения и значение параметра p.
                          </p>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white bg-opacity-50'}`}>
                          <div className="flex items-center mb-2">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-2 bg-blue-500 text-white font-bold">3</span>
                            <h3 className="font-medium">Получите решение</h3>
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Нажмите "Решить" и просмотрите решение с визуализацией и шагами.
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Доступные режимы:</h3>
                        <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li><strong>Простой режим</strong>: базовое решение уравнения</li>
                          <li><strong>Расширенный режим</strong>: с визуализацией и пошаговым решением</li>
                          <li><strong>Режим обучения</strong>: с подробными пояснениями и рекомендациями</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Нейросеть загружается */}
            {isModelLoading && (
              <div className={`${getCardClasses()} flex items-center justify-center py-6`}>
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                    Инициализация нейронной сети...
                  </span>
                </div>
              </div>
            )}
            
            {/* Основная форма */}
            <div className={getCardClasses()}>
              <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Параметры уравнения
              </h2>
              
              {/* Улучшенное описание */}
              <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20">
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Выберите тип уравнения и введите коэффициенты. Для стандартного квадратного уравнения ax² + bx + c = 0, введите значения для a, b и c.
                  Параметр p используется для решения уравнений с параметром.
                </p>
              </div>
                
              {/* Выбор типа уравнения с анимированными иконками */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Тип уравнения
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {EQUATION_TYPES.map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => handleEquationTypeChange(type.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                        equationType === type.id
                          ? `bg-${type.color}-100 border-2 border-${type.color}-500 dark:bg-${type.color}-900 dark:border-${type.color}-700 text-${type.color}-800 dark:text-${type.color}-300`
                          : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{type.icon}</span>
                      <span className="text-sm font-medium">{type.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Ввод параметров */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                  Коэффициенты уравнения
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Параметр A */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Коэффициент A
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={parameters.a}
                        onChange={(e) => handleParameterChange('a', e.target.value)}
                        className={`w-full p-3 pr-12 rounded-lg border-2 transition-colors duration-200 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <MathJax inline>{'x^2'}</MathJax>
                      </div>
                    </div>
                  </div>
                  
                  {/* Параметр B */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Коэффициент B
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={parameters.b}
                        onChange={(e) => handleParameterChange('b', e.target.value)}
                        className={`w-full p-3 pr-12 rounded-lg border-2 transition-colors duration-200 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <MathJax inline>{'x'}</MathJax>
                      </div>
                    </div>
                  </div>
                  
                  {/* Параметр C */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Коэффициент C
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={parameters.c}
                        onChange={(e) => handleParameterChange('c', e.target.value)}
                        className={`w-full p-3 pr-12 rounded-lg border-2 transition-colors duration-200 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>1</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Параметр D (только для определенных типов) */}
                  {['rational', 'cubic', 'system'].includes(equationType) && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Коэффициент D
                      </label>
                      <input
                        type="number"
                        value={parameters.d}
                        onChange={(e) => handleParameterChange('d', e.target.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-colors duration-200 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Параметры расширенного режима */}
              {viewMode !== VIEW_MODES.BASIC && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Дополнительные параметры
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Параметр P */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Параметр P
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={parameters.p}
                          onChange={(e) => handleParameterChange('p', e.target.value)}
                          className={`w-full p-3 pl-12 rounded-lg border-2 transition-colors duration-200 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-300 focus:border-blue-500'
                          }`}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className={`font-medium ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>p = </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Параметры Q и R (только в продвинутом режиме) */}
                    {viewMode === VIEW_MODES.ADVANCED && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Параметр Q
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={parameters.q}
                              onChange={(e) => handleParameterChange('q', e.target.value)}
                              className={`w-full p-3 pl-12 rounded-lg border-2 transition-colors duration-200 ${
                                darkMode
                                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                  : 'bg-white border-gray-300 focus:border-blue-500'
                              }`}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-500'}`}>q = </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Параметр R
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={parameters.r}
                              onChange={(e) => handleParameterChange('r', e.target.value)}
                              className={`w-full p-3 pl-12 rounded-lg border-2 transition-colors duration-200 ${
                                darkMode
                                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                                  : 'bg-white border-gray-300 focus:border-blue-500'
                              }`}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className={`font-medium ${darkMode ? 'text-orange-400' : 'text-orange-500'}`}>r = </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
              
              {/* Сообщение об ошибке */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                >
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
              
              {/* Кнопки управления */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleSolve}
                  disabled={isAnimating}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-60'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white disabled:opacity-60'
                  }`}
                >
                  {isAnimating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Решаем...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Решить
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleClear}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Очистить
                  </span>
                </button>
                
                <button
                  onClick={toggleHistory}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showHistory ? 'Скрыть историю' : 'История'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* История решений */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className={getCardClasses()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                      История решений
                    </h2>
                    <button
                      onClick={toggleHistory}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">История решений пуста</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {history.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            darkMode
                              ? 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 bg-${
                                EQUATION_TYPES.find(t => t.id === item.type)?.color || 'blue'
                              }-500`}></div>
                              <h3 className="font-medium text-gray-800 dark:text-gray-200">
                                {EQUATION_TYPES.find(t => t.id === item.type)?.name || item.type}
                              </h3>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.timestamp}
                            </span>
                          </div>
                          
                          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-2">
                            <MathJax>{item.equation}</MathJax>
                          </div>
                          
                          {item.roots && item.roots.length > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Корни: </span>
                              {item.roots.map((root, i) => (
                                <span key={i} className="ml-1">
                                  {root.toFixed(2)}{i < item.roots.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Блок с решением */}
            {steps.length > 0 && (
              <motion.div
                ref={solutionRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={getCardClasses()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400">
                    Решение уравнения
                  </h2>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowExport(!showExport)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      title="Экспортировать решение"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setShowRecommendations(!showRecommendations)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      title="Показать рекомендации"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Уравнение */}
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-indigo-900 rounded-xl mb-6">
                  <h3 className="text-xl font-medium mb-3 text-gray-700 dark:text-gray-300">
                    Уравнение:
                  </h3>
                  <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                    <MathJax className="text-2xl text-center">{latexEquation}</MathJax>
                  </div>
                </div>
                
                {/* Область определения */}
                {domain && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg mb-6">
                    <h3 className="text-md font-medium mb-2 text-yellow-800 dark:text-yellow-300">
                      Область определения:
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded p-3">
                      <MathJax>{domain}</MathJax>
                    </div>
                  </div>
                )}
                
                {/* Панель с рекомендациями */}
                <AnimatePresence>
                  {showRecommendations && (
                    <RecommendationPanel
                      type={equationType}
                      parameters={parameters}
                      darkMode={darkMode}
                      onSelectRecommendation={() => {}}
                    />
                  )}
                </AnimatePresence>
                
                {/* Панель экспорта */}
                <AnimatePresence>
                  {showExport && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <ExportSolution
                        equation={latexEquation}
                        steps={steps}
                        domain={domain}
                        roots={roots}
                        darkMode={darkMode}
                        onExportStart={handleExportStart}
                        onExportComplete={handleExportComplete}
                        onExportError={handleExportError}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Табы с разделами решения */}
                <div className="mb-6">
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('solution')}
                      className={`py-3 px-4 transition-colors ${
                        activeTab === 'solution'
                          ? (darkMode ? 'border-b-2 border-blue-500 text-blue-500' : 'border-b-2 border-blue-600 text-blue-600')
                          : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                      }`}
                    >
                      Пошаговое решение
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('visualization')}
                      className={`py-3 px-4 transition-colors ${
                        activeTab === 'visualization'
                          ? (darkMode ? 'border-b-2 border-blue-500 text-blue-500' : 'border-b-2 border-blue-600 text-blue-600')
                          : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                      }`}
                    >
                      Визуализация
                    </button>
                    
                    {viewMode === VIEW_MODES.LEARNING && (
                      <button
                        onClick={() => setActiveTab('explanation')}
                        className={`py-3 px-4 transition-colors ${
                          activeTab === 'explanation'
                            ? (darkMode ? 'border-b-2 border-blue-500 text-blue-500' : 'border-b-2 border-blue-600 text-blue-600')
                            : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                        }`}
                      >
                        Объяснение
                      </button>
                    )}
                  </div>
                  
                  <div className="pt-6">
                    {/* Пошаговое решение */}
                    {activeTab === 'solution' && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="solution"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <StepByStepSolution
                            steps={steps}
                            darkMode={darkMode}
                            autoPlay={viewMode === VIEW_MODES.LEARNING}
                            interval={2500}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}
                    
                    {/* Визуализация */}
                    {activeTab === 'visualization' && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="visualization"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                            <EquationVisualizer
                              type={equationType}
                              parameters={parameters}
                              darkMode={darkMode}
                              roots={roots}
                              animate={true}
                              showRoots={true}
                            />
                          </div>
                          
                          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Красные точки на графике обозначают корни уравнения.</span>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                    
                    {/* Объяснение */}
                    {activeTab === 'explanation' && viewMode === VIEW_MODES.LEARNING && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="explanation"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="prose prose-blue dark:prose-invert max-w-none"
                        >
                          <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-6 rounded-lg">
                            <h3 className="text-xl font-medium text-blue-800 dark:text-blue-300 mb-4">
                              Теоретическая справка
                            </h3>
                            
                            {equationType === 'quadratic' && (
                              <div>
                                <p>
                                  Квадратное уравнение имеет вид: <MathJax inline>{"ax^2 + bx + c = 0"}</MathJax>, где <MathJax inline>{"a \\neq 0"}</MathJax>.
                                </p>
                                <p>
                                  Дискриминант вычисляется по формуле: <MathJax inline>{"D = b^2 - 4ac"}</MathJax>
                                </p>
                                <ul>
                                  <li>Если <MathJax inline>{"D > 0"}</MathJax>, уравнение имеет два различных корня: <MathJax inline>{"x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}"}</MathJax></li>
                                  <li>Если <MathJax inline>{"D = 0"}</MathJax>, уравнение имеет один корень: <MathJax inline>{"x = \\frac{-b}{2a}"}</MathJax></li>
                                  <li>Если <MathJax inline>{"D < 0"}</MathJax>, уравнение не имеет действительных корней</li>
                                </ul>
                                <p>
                                  При решении с параметром <MathJax inline>{"p"}</MathJax> необходимо рассматривать разные случаи в зависимости от знака параметра.
                                </p>
                              </div>
                            )}
                            
                            {equationType === 'linear' && (
                              <div>
                                <p>
                                  Линейное уравнение имеет вид: <MathJax inline>{"ax + b = 0"}</MathJax>, где <MathJax inline>{"a \\neq 0"}</MathJax>.
                                </p>
                                <p>
                                  Корень линейного уравнения: <MathJax inline>{"x = -\\frac{b}{a}"}</MathJax>
                                </p>
                                <p>
                                  При <MathJax inline>{"a = 0"}</MathJax> и <MathJax inline>{"b \\neq 0"}</MathJax> уравнение не имеет решений.
                                </p>
                                <p>
                                  При <MathJax inline>{"a = 0"}</MathJax> и <MathJax inline>{"b = 0"}</MathJax> уравнение имеет бесконечно много решений.
                                </p>
                              </div>
                            )}
                            
                            {/* Другие типы уравнений */}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </div>
                
                {/* Информация о результатах нейросети */}
                {neuralPrediction !== null && (
                  <div className={`p-4 rounded-lg ${
                    darkMode
                      ? 'bg-purple-900 bg-opacity-20 border border-purple-800'
                      : 'bg-purple-50 border border-purple-100'
                  }`}>
                    <h3 className={`text-md font-medium mb-2 ${
                      darkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      Предсказание ИИ:
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {neuralPrediction.toFixed(4)}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Уверенность: {(confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={darkMode ? '#4B5563' : '#E5E7EB'}
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={confidence > 0.8 ? '#10B981' : confidence > 0.5 ? '#FBBF24' : '#EF4444'}
                            strokeWidth="3"
                            strokeDasharray={`${confidence * 100}, 100`}
                            strokeLinecap="round"
                          />
                          <text
                            x="18"
                            y="20.5"
                            textAnchor="middle"
                            fontSize="8"
                            fill={darkMode ? 'white' : 'black'}
                          >
                            {(confidence * 100).toFixed(0)}%
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
};

export default EnhancedParameterEquation; 