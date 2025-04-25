import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import * as math from 'mathjs';
import { 
  createCalculatorModel, 
  trainCalculatorModel, 
  extractFeaturesFromExpression,
  predictExpressionResult, 
  determineExpressionType,
  loadCalculatorModel,
  saveCalculatorModel,
  validateExpression,
  suggestExpressionFix
} from '../utils/neuralCalculator';

const NeuralCalculator = ({ darkMode }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [neuralResult, setNeuralResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [errorPosition, setErrorPosition] = useState(null);
  const [suggestionFix, setSuggestionFix] = useState(null);
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [latexExpression, setLatexExpression] = useState('');
  const [expressionType, setExpressionType] = useState('arithmetic');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // Ссылка на элемент ввода для подсветки ошибок
  const inputRef = useRef(null);
  
  // Ссылка для сохранения операций для дальнейшего обучения
  const operationsDataRef = useRef([]);
  
  // Настройка и инициализация модели при загрузке компонента
  useEffect(() => {
    const initModel = async () => {
      try {
        // Проверяем, доступен ли TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js готов');
        
        // Пытаемся загрузить сохраненную модель из localStorage
        let newModel = await loadCalculatorModel();
        
        // Если сохраненной модели нет, создаем новую
        if (!newModel) {
          console.log('Создаем новую модель...');
          newModel = createCalculatorModel();
          
          // Обучаем модель на начальных данных
          setIsTraining(true);
          
          await trainCalculatorModel(newModel, 50, (progress, logs) => {
            setTrainingProgress(progress);
            console.log(`Прогресс обучения: ${(progress * 100).toFixed(1)}%, loss: ${logs.loss.toFixed(4)}`);
          });
          
          // Сохраняем обученную модель
          await saveCalculatorModel(newModel);
        } else {
          console.log('Загружена сохраненная модель');
        }
        
        setModel(newModel);
        setIsModelLoaded(true);
        setIsTraining(false);
      } catch (error) {
        console.error('Ошибка при инициализации модели:', error);
        setError('Не удалось инициализировать нейронную сеть. Пожалуйста, обновите страницу.');
        setIsTraining(false);
      }
    };
    
    initModel();
    
    // Очистка при размонтировании компонента
    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, []);

  // Эффект для обработки подсветки ошибок в поле ввода
  useEffect(() => {
    if (errorPosition !== null && inputRef.current) {
      // Помещаем курсор в позицию ошибки
      inputRef.current.focus();
      inputRef.current.setSelectionRange(errorPosition, errorPosition + 1);
    }
  }, [errorPosition]);

  // Дообучение модели на новых данных
  const retrainModel = useCallback(async () => {
    if (!model || !isModelLoaded || operationsDataRef.current.length < 5) {
      return;
    }
    
    setIsTraining(true);
    setTrainingProgress(0);
    
    try {
      // Получаем данные для дообучения
      const trainingData = operationsDataRef.current;
      
      // Создаем тензоры
      const xs = tf.tensor2d(trainingData.map(d => d.features));
      const ys = tf.tensor2d(trainingData.map(d => [d.result]));
      
      // Дообучаем модель
      await model.fit(xs, ys, {
        epochs: 20,
        batchSize: Math.min(trainingData.length, 32),
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = (epoch + 1) / 20;
            setTrainingProgress(progress);
          }
        }
      });
      
      // Освобождаем ресурсы
      xs.dispose();
      ys.dispose();
      
      // Сохраняем обновленную модель
      await saveCalculatorModel(model);
      
      // Очищаем накопленные данные
      operationsDataRef.current = [];
      
      console.log('Модель успешно дообучена');
    } catch (error) {
      console.error('Ошибка при дообучении модели:', error);
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  }, [model, isModelLoaded]);

  // Обработка ввода выражения
  const handleExpressionChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setError(null);
    setErrorPosition(null);
    setSuggestionFix(null);
    setResult(null);
    setNeuralResult(null);
    setConfidence(null);
    
    // Обновление LaTeX выражения и типа выражения
    setLatexExpression(convertToLatex(value));
    setExpressionType(determineExpressionType(value));
  };

  // Конвертация выражения в LaTeX для красивого отображения
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

  // Обработка нажатия клавиши Enter для вычисления
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      calculate();
    }
  };

  // Применение предложенного исправления
  const handleApplySuggestion = () => {
    if (suggestionFix && typeof suggestionFix === 'string' && !suggestionFix.startsWith('Замените') && !suggestionFix.startsWith('Проверьте')) {
      setInput(suggestionFix);
      setSuggestionFix(null);
      setError(null);
      setErrorPosition(null);
    }
  };

  // Основная функция вычисления выражения
  const calculate = async () => {
    try {
      setError(null);
      setErrorPosition(null);
      setSuggestionFix(null);
      
      // Проверяем, что ввод не пустой
      if (!input.trim()) {
        setError('Введите выражение');
        return;
      }
      
      // Проверяем корректность выражения
      const validation = validateExpression(input);
      
      if (!validation.isValid) {
        setError(validation.errorMessage);
        setErrorPosition(validation.errorPosition);
        
        // Получаем предложение по исправлению
        const suggestion = suggestExpressionFix(input, validation);
        setSuggestionFix(suggestion);
        return;
      }
      
      // Используем результат валидации
      const calculatedResult = validation.result;
      setResult(calculatedResult);
      
      // Предсказание с помощью нейронной сети
      if (model && isModelLoaded) {
        try {
          const prediction = await predictExpressionResult(model, input);
          setNeuralResult(prediction.prediction);
          setConfidence(prediction.confidence);
          
          // Сохраняем операцию для будущего обучения
          const features = extractFeaturesFromExpression(input);
          operationsDataRef.current.push({
            features,
            result: calculatedResult
          });
          
          // Если накопилось достаточно данных, запускаем дообучение
          if (operationsDataRef.current.length >= 10) {
            retrainModel();
          }
        } catch (neuralError) {
          console.error('Ошибка нейросети:', neuralError);
          setNeuralResult(null);
          setConfidence(null);
        }
      }
      
      // Добавляем в историю
      const newEntry = {
        expression: input,
        result: calculatedResult,
        neuralResult: neuralResult,
        timestamp: new Date().toLocaleString()
      };
      
      setHistory(prev => {
        const newHistory = [newEntry, ...prev];
        // Ограничиваем историю 10 записями
        return newHistory.slice(0, 10);
      });
    } catch (error) {
      setError(`Ошибка: ${error.message}`);
      console.error('Ошибка вычисления:', error);
    }
  };

  // Очистка ввода и результатов
  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
    setErrorPosition(null);
    setSuggestionFix(null);
    setNeuralResult(null);
    setConfidence(null);
    setLatexExpression('');
  };

  // Переключение отображения истории
  const handleShowHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-8">
              Умный Калькулятор
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
              
              {isTraining && (
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${trainingProgress * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Обучение...
                  </span>
                </div>
              )}
            </div>

            {showHelp && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">Как использовать:</h2>
                <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-300">
                  <li>Введите математическое выражение (например, 2+2 или 5*3-1)</li>
                  <li>Поддерживаются операции: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), ln()</li>
                  <li>Используйте скобки для группировки выражений: (2+3)*4</li>
                  <li>Нажмите "Вычислить" или Enter для получения результата</li>
                  <li>Нейронная сеть также предложит свое предсказание результата</li>
                </ul>
              </div>
            )}

            <div className="mb-8">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleExpressionChange}
                onKeyPress={handleKeyPress}
                placeholder="Введите выражение"
                className={`w-full p-4 text-2xl border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                } ${error ? 'border-red-500' : ''}`}
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
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{error}</p>
                    {errorPosition !== null && (
                      <p className="text-sm mt-1">
                        Позиция: {errorPosition + 1}
                      </p>
                    )}
                  </div>
                  {suggestionFix && (
                    <div>
                      <p className="text-sm">Предложение: {suggestionFix}</p>
                      {typeof suggestionFix === 'string' && !suggestionFix.startsWith('Замените') && !suggestionFix.startsWith('Проверьте') && (
                        <button 
                          onClick={handleApplySuggestion}
                          className="mt-1 text-sm bg-red-200 dark:bg-red-700 py-1 px-2 rounded"
                        >
                          Применить исправление
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result !== null && (
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Результат вычисления:
                  </h2>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {typeof result === 'number' ? result : result.toString()}
                  </p>
                </div>

                {neuralResult !== null && (
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
                          style={{ width: `${confidence ? confidence * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {confidence ? `${(confidence * 100).toFixed(1)}%` : '0%'}
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
              <div className="grid grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Сложение (+)</li>
                  <li>Вычитание (-)</li>
                  <li>Умножение (*)</li>
                  <li>Деление (/)</li>
                  <li>Степень (^)</li>
                </ul>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Квадратный корень (sqrt())</li>
                  <li>Синус, косинус (sin(), cos())</li>
                  <li>Тангенс (tan())</li>
                  <li>Логарифмы (log(), ln())</li>
                  <li>Скобки ()</li>
                </ul>
              </div>
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
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 ${darkMode ? 'dark' : ''}`}>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                История вычислений
              </h2>
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div 
                    key={index} 
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                    onClick={() => setInput(item.expression)}
                  >
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.expression} = <span className="font-bold">{item.result}</span>
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.timestamp}
                      </span>
                    </div>
                    {item.neuralResult && (
                      <div className="mt-1 text-sm text-purple-600 dark:text-purple-400">
                        Предсказание ИИ: {typeof item.neuralResult === 'number' ? item.neuralResult.toFixed(4) : item.neuralResult}
                      </div>
                    )}
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

export default NeuralCalculator; 