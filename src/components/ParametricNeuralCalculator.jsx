import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import * as math from 'mathjs';
import { 
  createParametricModel, 
  trainParametricModel, 
  extractFeaturesFromParametricExpression,
  predictParametricExpressionResult, 
  validateParametricExpression,
  saveParametricModel,
  loadParametricModel
} from '../utils/parametricCalculator';
import ParametricSolver from './ParametricSolver';
import ParametricVisualization from './ParametricVisualization';

const ParametricNeuralCalculator = ({ darkMode }) => {
  const [expression, setExpression] = useState('');
  const [parameter, setParameter] = useState('a');
  const [parameterValue, setParameterValue] = useState('1');
  const [result, setResult] = useState(null);
  const [neuralResult, setNeuralResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [latexExpression, setLatexExpression] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // Ссылка для сохранения операций для дальнейшего обучения
  const operationsDataRef = useRef([]);
  
  // Настройка и инициализация модели при загрузке компонента
  useEffect(() => {
    const initModel = async () => {
      try {
        // Проверяем, доступен ли TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js готов для параметрического калькулятора');
        
        // Пытаемся загрузить сохраненную модель из localStorage
        let newModel = await loadParametricModel();
        
        // Если сохраненной модели нет, создаем новую
        if (!newModel) {
          console.log('Создаем новую параметрическую модель...');
          newModel = createParametricModel();
          
          // Обучаем модель на начальных данных
          setIsTraining(true);
          
          await trainParametricModel(newModel, 50, (progress, logs) => {
            setTrainingProgress(progress);
            console.log(`Прогресс обучения: ${(progress * 100).toFixed(1)}%, loss: ${logs.loss.toFixed(4)}`);
          });
          
          // Сохраняем обученную модель
          await saveParametricModel(newModel);
        } else {
          console.log('Загружена сохраненная параметрическая модель');
        }
        
        setModel(newModel);
        setIsModelLoaded(true);
        setIsTraining(false);
      } catch (error) {
        console.error('Ошибка при инициализации параметрической модели:', error);
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
      await saveParametricModel(model);
      
      // Очищаем накопленные данные
      operationsDataRef.current = [];
      
      console.log('Параметрическая модель успешно дообучена');
    } catch (error) {
      console.error('Ошибка при дообучении параметрической модели:', error);
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  }, [model, isModelLoaded]);

  // Обработка ввода выражения
  const handleExpressionChange = (e) => {
    const value = e.target.value;
    setExpression(value);
    setError(null);
    setResult(null);
    setNeuralResult(null);
    setConfidence(null);
    setLatexExpression(convertToLatex(value));
  };

  // Обработка изменения параметра
  const handleParameterChange = (e) => {
    const value = e.target.value;
    setParameter(value);
  };

  // Обработка изменения значения параметра
  const handleParameterValueChange = (e) => {
    const value = e.target.value;
    setParameterValue(value);
  };

  // Конвертация выражения в LaTeX для красивого отображения
  const convertToLatex = (expression) => {
    // Заменяем параметр на его LaTeX представление
    const latexParam = parameter ? parameter : 'a';
    return expression
      .replace(/\^/g, '^')
      .replace(/\*/g, '\\cdot ')
      .replace(/\//g, '\\div ')
      .replace(new RegExp(parameter, 'g'), `{${latexParam}}`)
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

  // Основная функция вычисления выражения с параметром
  const calculate = async () => {
    try {
      setError(null);
      
      // Проверяем корректность выражения
      const validation = validateParametricExpression(expression, parameter);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      // Проверяем корректность значения параметра
      const paramValue = parseFloat(parameterValue);
      if (isNaN(paramValue)) {
        setError('Неверное значение параметра');
        return;
      }

      // Подставляем значение параметра в выражение и вычисляем
      const replacedExpression = expression.replace(new RegExp(parameter, 'g'), `(${parameterValue})`);
      const mathResult = math.evaluate(replacedExpression);
      
      // Проверяем результат на корректность
      if (mathResult === undefined || isNaN(mathResult) || !isFinite(mathResult)) {
        setError('Невозможно вычислить выражение');
        return;
      }
      
      setResult(mathResult);
      
      // Нейросетевое предсказание, если модель загружена
      if (model && isModelLoaded) {
        const [predictedResult, pred_confidence] = await predictParametricExpressionResult(
          model, 
          expression, 
          parameter,
          paramValue
        );
        
        setNeuralResult(predictedResult);
        setConfidence(pred_confidence);
        
        // Добавляем данные для последующего дообучения
        const features = extractFeaturesFromParametricExpression(expression, parameter, paramValue);
        if (features) {
          operationsDataRef.current.push({
            expression,
            parameter,
            parameterValue: paramValue,
            features,
            result: mathResult
          });
          
          // Если накопилось достаточно данных, запускаем дообучение
          if (operationsDataRef.current.length >= 10) {
            retrainModel();
          }
        }
      }
      
      // Добавляем в историю
      const historyItem = {
        id: Date.now(),
        expression,
        parameter,
        parameterValue,
        result: mathResult,
        neuralResult: neuralResult,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setHistory(prev => [historyItem, ...prev].slice(0, 10));
      
    } catch (error) {
      console.error('Ошибка при вычислении:', error);
      setError(`Ошибка вычисления: ${error.message}`);
    }
  };

  // Очистка ввода
  const handleClear = () => {
    setExpression('');
    setResult(null);
    setNeuralResult(null);
    setConfidence(null);
    setError(null);
    setLatexExpression('');
  };

  // Переключение отображения истории
  const handleShowHistory = () => {
    setShowHistory(!showHistory);
  };

  // Загрузка выражения из истории
  const handleLoadFromHistory = (historyItem) => {
    setExpression(historyItem.expression);
    setParameter(historyItem.parameter);
    setParameterValue(historyItem.parameterValue);
    setLatexExpression(convertToLatex(historyItem.expression));
    setShowHistory(false);
  };

  // Переключение справки
  const handleToggleHelp = () => {
    setShowHelp(!showHelp);
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h2 className="text-2xl font-bold mb-6">Умный калькулятор с параметром</h2>
      
      {showHelp && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-2">Как пользоваться</h3>
          <p className="mb-2">
            1. Введите выражение с параметром (например, "2*a^2 + 3*a - 5")
          </p>
          <p className="mb-2">
            2. Укажите имя параметра (по умолчанию "a")
          </p>
          <p className="mb-2">
            3. Укажите значение параметра
          </p>
          <p className="mb-2">
            4. Нажмите "Вычислить" для получения результата
          </p>
          <p>
            Поддерживаются основные математические операции: +, -, *, /, ^, а также функции sqrt, sin, cos, tan, log
          </p>
          <button 
            onClick={handleToggleHelp}
            className={`mt-4 px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Закрыть
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4">
            <label className="block mb-2">Выражение с параметром:</label>
            <input
              type="text"
              value={expression}
              onChange={handleExpressionChange}
              onKeyPress={handleKeyPress}
              placeholder="Например: 2*a^2 + 3*a - 5"
              className={`w-full p-3 rounded-lg ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Параметр:</label>
              <input
                type="text"
                value={parameter}
                onChange={handleParameterChange}
                placeholder="a"
                className={`w-full p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              />
            </div>
            <div>
              <label className="block mb-2">Значение параметра:</label>
              <input
                type="text"
                value={parameterValue}
                onChange={handleParameterValueChange}
                onKeyPress={handleKeyPress}
                placeholder="1"
                className={`w-full p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              />
            </div>
          </div>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={calculate}
              disabled={isTraining}
              className={`flex-1 p-3 rounded-lg ${
                isTraining
                  ? 'bg-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isTraining ? 'Обучение...' : 'Вычислить'}
            </button>
            <button
              onClick={handleClear}
              className={`flex-1 p-3 rounded-lg ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Очистить
            </button>
          </div>
          
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}
          
          {isTraining && (
            <div className="mb-4">
              <div className="mb-2">Обучение модели: {Math.round(trainingProgress * 100)}%</div>
              <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${trainingProgress * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div>
          {latexExpression && (
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="mb-2">Выражение:</p>
              <MathJaxContext>
                <div className="text-xl">
                  <MathJax>{"\\(" + latexExpression + "\\)"}</MathJax>
                </div>
              </MathJaxContext>
            </div>
          )}
          
          {result !== null && (
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="mb-2">Результат:</p>
              <div className="text-xl font-semibold">{result}</div>
            </div>
          )}
          
          {neuralResult !== null && (
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="mb-2">Предсказание нейросети:</p>
              <div className="text-xl font-semibold">{neuralResult}</div>
              <div className="mt-1 text-sm">
                Уверенность: {(confidence * 100).toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mb-4">
        <button
          onClick={handleShowHistory}
          className={`px-4 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {showHistory ? 'Скрыть историю' : 'Показать историю'}
        </button>
        <button
          onClick={handleToggleHelp}
          className={`px-4 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {showHelp ? 'Скрыть справку' : 'Показать справку'}
        </button>
      </div>
      
      {showHistory && history.length > 0 && (
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-xl font-semibold mb-4">История вычислений</h3>
          <div className="max-h-64 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoadFromHistory(item)}
                className={`p-3 rounded-lg mb-2 cursor-pointer ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{item.expression} (при {item.parameter}={item.parameterValue})</div>
                <div className="text-sm mt-1">
                  Результат: {item.result} | {item.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Подключаем ParametricSolver для развернутого решения */}
      {expression && (
        <ParametricSolver 
          expression={expression} 
          parameter={parameter}
          parameterValue={parameterValue}
          darkMode={darkMode}
        />
      )}
      
      {/* Добавляем визуализацию решений */}
      {expression && (
        <ParametricVisualization
          expression={expression}
          parameter={parameter}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default ParametricNeuralCalculator; 