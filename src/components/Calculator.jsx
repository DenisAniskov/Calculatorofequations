import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { createModel, trainModel, predict } from '../utils/neuralNetwork';
import { MathJax } from 'better-react-mathjax';
import * as math from 'mathjs';

const Calculator = ({ expression, result, error, onCalculate, darkMode }) => {
  const [input, setInput] = useState(expression || '');
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [neuralResult, setNeuralResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [latexExpression, setLatexExpression] = useState('');
  
  // Дополнительные состояния
  const [savedExpressions, setSavedExpressions] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Синхронизируем внутреннее состояние с переданным извне
  useEffect(() => {
    if (expression !== undefined) {
      setInput(expression);
    }
  }, [expression]);

  useEffect(() => {
    const initModel = async () => {
      try {
        setIsTraining(true);
        const newModel = await createModel();
        await trainModel(newModel, 'linear', 100, 0.01, (progress) => {
          setTrainingProgress(progress);
        });
        setModel(newModel);
        setIsTraining(false);
      } catch (error) {
        console.error('Ошибка при инициализации модели:', error);
        setIsTraining(false);
      }
    };
    
    // Загружаем историю из localStorage
    const savedHistory = localStorage.getItem('calculator_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Ошибка при загрузке истории:', e);
      }
    }
    
    // Загружаем сохраненные выражения
    const savedExprs = localStorage.getItem('saved_expressions');
    if (savedExprs) {
      try {
        setSavedExpressions(JSON.parse(savedExprs));
      } catch (e) {
        console.error('Ошибка при загрузке сохраненных выражений:', e);
      }
    }
    
    initModel();
  }, []);
  
  // Сохраняем историю в localStorage при изменении
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('calculator_history', JSON.stringify(history));
    }
  }, [history]);

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      await calculate();
    }
  };

  const calculate = async () => {
    try {
      setLocalError(null);
      
      // Передаем выражение родительскому компоненту для вычисления
      onCalculate(input);

      // Для нейросети мы будем использовать локальное вычисление
      const calculatedResult = math.evaluate(input);

      // Используем нейросеть только для числовых результатов
      if (model && typeof calculatedResult === 'number') {
        try {
          const prediction = await predict(model, calculatedResult);
          setNeuralResult(prediction.prediction);
          
          // Исправляем вычисление уверенности
          const diff = Math.abs(calculatedResult - prediction.prediction);
          const confidenceValue = Math.max(0, 100 - (diff * 100 / Math.abs(calculatedResult || 1)));
          setConfidence(confidenceValue);
        } catch (neuralError) {
          console.error('Ошибка нейросети:', neuralError);
          setNeuralResult(null);
          setConfidence(null);
        }
      } else {
        setNeuralResult(null);
        setConfidence(null);
      }

      // Преобразуем в строку для отображения и добавления в историю
      const resultString = typeof calculatedResult === 'object' 
        ? math.format(calculatedResult, { precision: 14 }) 
        : calculatedResult.toString();

      // Добавляем в историю
      const historyItem = {
        expression: input,
        result: resultString,
        neuralResult: neuralResult,
        timestamp: new Date().toLocaleString()
      };
      
      setHistory(prev => [historyItem, ...prev].slice(0, 10));
      
    } catch (error) {
      setLocalError('Ошибка в выражении: ' + error.message);
      setNeuralResult(null);
      setConfidence(null);
    }
  };

  const handleExpressionChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setLocalError(null);
    try {
      setLatexExpression(convertToLatex(value));
    } catch (e) {
      console.error('Ошибка при конвертации в LaTeX:', e);
    }
  };

  const convertToLatex = (expression) => {
    if (!expression) return '';
    
    return expression
      .replace(/\^/g, '^')
      .replace(/\*/g, '\\cdot ')
      .replace(/\//g, '\\div ')
      .replace(/sqrt\(/g, '\\sqrt{')
      .replace(/sin\(/g, '\\sin(')
      .replace(/cos\(/g, '\\cos(')
      .replace(/tan\(/g, '\\tan(')
      .replace(/log\(/g, '\\log(')
      .replace(/ln\(/g, '\\ln(')
      .replace(/pi/g, '\\pi ')
      .replace(/e/g, 'e');
  };

  const handleClear = () => {
    setInput('');
    setLocalError(null);
    setNeuralResult(null);
    setConfidence(null);
    setLatexExpression('');
    onCalculate(''); // Сбрасываем результат родительского компонента
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
    if (showSaved) setShowSaved(false);
  };
  
  const handleShowSaved = () => {
    setShowSaved(!showSaved);
    if (showHistory) setShowHistory(false);
  };
  
  const handleSaveExpression = () => {
    if (input && !savedExpressions.includes(input)) {
      const newSavedExpressions = [...savedExpressions, input];
      setSavedExpressions(newSavedExpressions);
      localStorage.setItem('saved_expressions', JSON.stringify(newSavedExpressions));
    }
  };
  
  const handleUseExpression = (expr) => {
    setInput(expr);
    setLatexExpression(convertToLatex(expr));
  };
  
  const handleDeleteHistory = () => {
    setHistory([]);
    localStorage.removeItem('calculator_history');
  };
  
  const handleAddOperator = (operator) => {
    setInput(prev => prev + operator);
    setLatexExpression(convertToLatex(input + operator));
  };

  // Операторы для кнопок
  const operators = [
    { symbol: '+', label: '+' },
    { symbol: '-', label: '−' },
    { symbol: '*', label: '×' },
    { symbol: '/', label: '÷' },
    { symbol: '^', label: '^' },
    { symbol: '(', label: '(' },
    { symbol: ')', label: ')' },
    { symbol: 'sqrt(', label: '√' },
    { symbol: 'sin(', label: 'sin' },
    { symbol: 'cos(', label: 'cos' },
    { symbol: 'tan(', label: 'tan' },
    { symbol: 'log(', label: 'log' },
    { symbol: 'ln(', label: 'ln' },
    { symbol: 'pi', label: 'π' },
    { symbol: 'e', label: 'e' }
  ];

  // Отображаем ошибку - приоритет для локальной ошибки, затем для ошибки переданной извне
  const displayError = localError || (error ? error.message : null);

  return (
    <div className={`p-6 rounded-lg shadow-lg transition-colors duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h2 className="text-2xl font-bold mb-4">Умный калькулятор</h2>
      
      <div className="mb-6">
        <label htmlFor="expression" className="block mb-2 text-sm font-medium">
          Введите выражение:
        </label>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            id="expression"
            value={input}
            onChange={handleExpressionChange}
            onKeyPress={handleKeyPress}
            placeholder="Например: 2+2*sin(45)"
            className={`flex-grow p-3 rounded-lg text-lg ${
              darkMode 
                ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-blue-600'
            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          <div className="flex gap-2">
            <button
              onClick={calculate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Вычислить
            </button>
            <button
              onClick={handleClear}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Очистить
            </button>
          </div>
        </div>
        
        {/* Отображение выражения в LaTeX */}
        {latexExpression && (
          <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-lg overflow-x-auto">
              <MathJax>
                {`\\(${latexExpression}\\)`}
              </MathJax>
            </div>
          </div>
        )}
      </div>
      
      {/* Кнопки операторов */}
      <div className="mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {operators.map((op, index) => (
            <button
              key={index}
              onClick={() => handleAddOperator(op.symbol)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Отображение ошибки */}
      {displayError && (
        <div className={`p-4 mb-6 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{displayError}</p>
        </div>
      )}
      
      {/* Результат */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-2">Результат:</h3>
          <div className="text-2xl font-bold">
            {typeof result === 'object' ? JSON.stringify(result) : result.toString()}
          </div>
          
          {/* Кнопка сохранения выражения */}
          <div className="mt-3">
            <button
              onClick={handleSaveExpression}
              className={`px-3 py-1 text-sm rounded-lg ${
                darkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Сохранить выражение
            </button>
          </div>
        </div>
      )}
      
      {/* Нейросетевое предсказание */}
      {neuralResult !== null && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <h3 className="text-lg font-semibold mb-2">Предсказание нейросети:</h3>
          <div className="text-lg">
            <span className="font-medium">Тип выражения:</span> {neuralResult}
          </div>
          
          {confidence !== null && (
            <div className="mt-2">
              <span className="font-medium">Уверенность:</span> {confidence.toFixed(2)}%
              <div className="w-full h-2 bg-gray-300 rounded-full mt-1">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}
          
          {isTraining && (
            <div className="mt-2">
              <span className="font-medium">Обучение модели:</span> {(trainingProgress * 100).toFixed(0)}%
              <div className="w-full h-2 bg-gray-300 rounded-full mt-1">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${trainingProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Кнопки управления историей */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleShowHistory}
          className={`px-3 py-1 text-sm rounded-lg ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          {showHistory ? 'Скрыть историю' : 'Показать историю'}
        </button>
        
        <button
          onClick={handleShowSaved}
          className={`px-3 py-1 text-sm rounded-lg ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          {showSaved ? 'Скрыть сохраненные' : 'Показать сохраненные'}
        </button>
        
        {history.length > 0 && (
          <button
            onClick={handleDeleteHistory}
            className={`px-3 py-1 text-sm rounded-lg ${
              darkMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Очистить историю
          </button>
        )}
      </div>
      
      {/* История вычислений */}
      {showHistory && history.length > 0 && (
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-2">История вычислений:</h3>
          <div className="max-h-60 overflow-y-auto">
            {history.map((item, index) => (
              <div 
                key={index} 
                className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-opacity-80 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200'
                }`}
                onClick={() => handleUseExpression(item.expression)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{item.expression}</span>
                  <span className="text-sm opacity-70">{item.timestamp}</span>
                </div>
                <div className="text-lg font-semibold">= {item.result}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Сохраненные выражения */}
      {showSaved && savedExpressions.length > 0 && (
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-2">Сохраненные выражения:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {savedExpressions.map((expr, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-lg cursor-pointer hover:bg-opacity-80 text-center ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200'
                }`}
                onClick={() => handleUseExpression(expr)}
              >
                {expr}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Раздел помощи */}
      <div className="mt-6">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`px-3 py-1 text-sm rounded-lg ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          {showHelp ? 'Скрыть помощь' : 'Показать помощь'}
        </button>
        
        {showHelp && (
          <div className={`mt-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className="text-lg font-semibold mb-2">Поддерживаемые операции:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-1">Арифметические операции</h4>
                <ul className="list-disc list-inside text-sm">
                  <li>Сложение (+)</li>
                  <li>Вычитание (-)</li>
                  <li>Умножение (*)</li>
                  <li>Деление (/)</li>
                  <li>Возведение в степень (^)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Функции</h4>
                <ul className="list-disc list-inside text-sm">
                  <li>Корень (sqrt)</li>
                  <li>Синус (sin)</li>
                  <li>Косинус (cos)</li>
                  <li>Тангенс (tan)</li>
                  <li>Логарифм (log, ln)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Константы</h4>
                <ul className="list-disc list-inside text-sm">
                  <li>Число π (pi)</li>
                  <li>Число e</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Нейронная сеть определяет тип выражения и предоставляет дополнительные подсказки.
              Например, для тригонометрических выражений она может рекомендовать упрощения или преобразования.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator; 