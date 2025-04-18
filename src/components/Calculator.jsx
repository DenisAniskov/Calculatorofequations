import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { createModel, trainModel, predict } from '../utils/neuralNetwork';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import * as math from 'mathjs';

const Calculator = ({ darkMode }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [neuralResult, setNeuralResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [latexExpression, setLatexExpression] = useState('');

  useEffect(() => {
    const initModel = async () => {
      try {
        const newModel = await createModel();
        setModel(newModel);
        await trainModel(newModel, 'linear', 100, 0.01, (progress) => {
          setTrainingProgress(progress);
        });
      } catch (error) {
        console.error('Ошибка при инициализации модели:', error);
      }
    };
    initModel();
  }, []);

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      await calculate();
    }
  };

  const calculate = async () => {
    try {
      setError(null);
      const expression = input.replace(/[^0-9+\-*/().]/g, '');
      const calculatedResult = eval(expression);
      setResult(calculatedResult);

      if (model) {
        try {
          const neuralPrediction = await predict(model, calculatedResult);
          setNeuralResult(neuralPrediction);
          const diff = Math.abs(calculatedResult - neuralPrediction);
          setConfidence(Math.max(0, Math.min(100, 100 - (diff * 10))));
        } catch (neuralError) {
          console.error('Ошибка нейросети:', neuralError);
          setNeuralResult(null);
          setConfidence(null);
        }
      }

      // Добавляем в историю
      setHistory(prev => [...prev, {
        expression,
        result: calculatedResult,
        neuralResult,
        timestamp: new Date().toLocaleString()
      }].slice(-5));
    } catch (error) {
      setError('Ошибка в выражении');
      setResult(null);
      setNeuralResult(null);
      setConfidence(null);
    }
  };

  const handleExpressionChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setError(null);
    setResult(null);
    setLatexExpression(convertToLatex(value));
  };

  const convertToLatex = (expression) => {
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

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
    setNeuralResult(null);
    setConfidence(null);
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-8">
              Калькулятор
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
                  <li>Введите математическое выражение</li>
                  <li>Поддерживаются операции: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), ln()</li>
                  <li>Используйте скобки для группировки выражений</li>
                  <li>Нажмите "Вычислить" или Enter для получения результата</li>
                </ul>
              </div>
            )}

            <div className="mb-8">
              <input
                type="text"
                value={input}
                onChange={handleExpressionChange}
                onKeyPress={handleKeyPress}
                placeholder="Введите выражение"
                className={`w-full p-4 text-2xl border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
              {latexExpression && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <MathJaxContext>
                    <MathJax>{`$$${latexExpression}$$`}</MathJax>
                  </MathJaxContext>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-xl">
                {error}
              </div>
            )}

            {result !== null && (
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Результат вычисления:
                  </h2>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {result}
                  </p>
                </div>

                {neuralResult !== null && neuralResult !== undefined && (
                  <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                      Предсказание нейросети:
                    </h2>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {typeof neuralResult === 'number' ? neuralResult.toFixed(4) : 'Ошибка предсказания'}
                    </p>
                    <div className="mt-2 flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${confidence !== null && confidence !== undefined ? confidence * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {confidence !== null && confidence !== undefined ? `${(confidence * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Поддерживаемые операции:
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Сложение (+)</li>
                <li>Вычитание (-)</li>
                <li>Умножение (*)</li>
                <li>Деление (/)</li>
                <li>Скобки ()</li>
                <li>Десятичные числа</li>
              </ul>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={calculate}
                className={`flex-1 py-2 px-4 rounded ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Вычислить
              </button>
              <button
                onClick={handleClear}
                className={`flex-1 py-2 px-4 rounded ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Очистить
              </button>
              <button
                onClick={handleShowHistory}
                className={`flex-1 py-2 px-4 rounded ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {showHistory ? 'Скрыть историю' : 'Показать историю'}
              </button>
            </div>
          </div>

          {showHistory && history.length > 0 && (
            <div className="mt-4">
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                История вычислений:
              </h3>
              <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {history.map((item, index) => (
                  <div key={index} className={`p-4 rounded border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p>Выражение: {item.expression}</p>
                    <p>Результат: {item.result}</p>
                    <p>Результат нейросети: {item.neuralResult !== null && item.neuralResult !== undefined ? item.neuralResult.toFixed(4) : 'Нет данных'}</p>
                    <p className="text-sm text-gray-500">{item.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator; 