import React, { useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import * as math from 'mathjs';
import wolframClient from '../api/wolframClient';
import testWolframAlpha from '../api/testWolfram';

const ParametricEquationSolver = ({ darkMode }) => {
  const [equation, setEquation] = useState('');
  const [parameter, setParameter] = useState('a');
  const [paramRange, setParamRange] = useState({ min: -10, max: 10, step: 1 });
  const [solution, setSolution] = useState(null);
  const [savedEquations, setSavedEquations] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [equationType, setEquationType] = useState('');
  const [useMockAPI, setUseMockAPI] = useState(true);
  const [steps, setSteps] = useState([]);
  const [plots, setPlots] = useState([]);
  
  // Примеры уравнений для быстрого выбора
  const exampleEquations = [
    { equation: 'a*x + b = 0', parameter: 'a', description: 'Линейное уравнение' },
    { equation: 'a*x^2 + b*x + c = 0', parameter: 'a', description: 'Квадратное уравнение' },
    { equation: 'sin(x) = a', parameter: 'a', description: 'Тригонометрическое уравнение' },
    { equation: 'log(x) = a', parameter: 'a', description: 'Логарифмическое уравнение' },
    { equation: 'a^x = b', parameter: 'a', description: 'Показательное уравнение' }
  ];

  useEffect(() => {
    try {
      // Загрузка сохраненных уравнений из local storage
      const saved = localStorage.getItem('savedParametricEquations');
      if (saved) {
        setSavedEquations(JSON.parse(saved));
      }
      // Всегда включаем демо-режим для надежности
      setUseMockAPI(true);
    } catch (err) {
      console.error('Ошибка при загрузке сохраненных уравнений:', err);
      setError('Не удалось загрузить сохраненные уравнения');
    }
  }, []);

  const saveEquation = () => {
    if (!equation.trim()) return;
    
    try {
      const newSavedEquations = [
        ...savedEquations.filter(eq => eq.equation !== equation),
        { 
          equation, 
          parameter, 
          timestamp: new Date().toISOString() 
        }
      ];
      
      setSavedEquations(newSavedEquations);
      localStorage.setItem('savedParametricEquations', JSON.stringify(newSavedEquations));
    } catch (err) {
      console.error('Ошибка при сохранении уравнения:', err);
      setError('Не удалось сохранить уравнение');
    }
  };

  const loadEquation = (savedEq) => {
    setEquation(savedEq.equation);
    setParameter(savedEq.parameter);
    setShowSaved(false);
  };

  const deleteEquation = (index) => {
    const newSavedEquations = [...savedEquations];
    newSavedEquations.splice(index, 1);
    setSavedEquations(newSavedEquations);
    localStorage.setItem('savedParametricEquations', JSON.stringify(newSavedEquations));
  };

  const determineEquationType = (eq) => {
    const cleanEq = eq.replace(/\s+/g, '').toLowerCase();
    
    if (/\b[a-z]\*x\+[a-z]=0|\bx\+[a-z]=0|\b[a-z]\*x=0/.test(cleanEq)) {
      return 'linear';
    } else if (/\b[a-z]\*x\^2|\bx\^2/.test(cleanEq)) {
      return 'quadratic';
    } else if (/sin|cos|tan|cot|sec|csc/.test(cleanEq)) {
      return 'trigonometric';
    } else if (/log|ln/.test(cleanEq)) {
      return 'logarithmic';
    } else if (/\^x|e\^/.test(cleanEq)) {
      return 'exponential';
    } else if (/\//g.test(cleanEq) && !/\^\(-1\)/.test(cleanEq)) {
      return 'rational';
    }
    return 'unknown';
  };

  const generateHint = (type) => {
    const hints = {
      linear: 'Линейные уравнения с параметром можно решить, выразив переменную x через параметр. Обращайте внимание на особые случаи, когда коэффициент при x равен нулю.',
      quadratic: 'Для квадратных уравнений с параметром важно проанализировать дискриминант и его зависимость от значения параметра.',
      trigonometric: 'При решении тригонометрических уравнений с параметром учитывайте область значений тригонометрических функций и периодичность решений.',
      logarithmic: 'Для логарифмических уравнений с параметром важно учитывать область определения логарифма и различные случаи в зависимости от значения параметра.',
      exponential: 'В показательных уравнениях с параметром обращайте внимание на условия, при которых обе части уравнения положительны.',
      rational: 'При решении рациональных уравнений с параметром необходимо учитывать ОДЗ и исследовать различные значения параметра.',
      unknown: 'Для решения уравнения разбейте его на подслучаи в зависимости от значения параметра.'
    };
    
    return hints[type] || hints.unknown;
  };

  const solveEquation = async () => {
    if (!equation.trim()) {
      setError('Уравнение не может быть пустым');
      return;
    }

    setIsLoading(true);
    setError('');
    setSolution(null);
    
    try {
      const eqType = determineEquationType(equation);
      setEquationType(eqType);
      
      // Всегда используем демо-данные для надежной работы
      const solveFunction = wolframClient.mockSolveParametricEquation;
      
      const result = await solveFunction(equation, parameter);
      
      if (result.success) {
        setSolution(result);
        console.log('Получен результат:', result);
      } else {
        setError('Не удалось найти решение для данного уравнения');
      }
    } catch (err) {
      console.error('Ошибка при решении уравнения:', err);
      setError(`Ошибка: ${err.message || 'Не удалось решить уравнение'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApiCall = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Используем точный формат, который работает с API Wolfram Alpha
      const testEquation = "a*x + b = 0";
      const testParameter = "a";
      
      // Принудительно отключаем демо-режим для теста
      const forcedDemoMode = false;
      
      // Выполняем запрос
      console.log(`Тестовый запрос к API: ${testEquation}, параметр: ${testParameter}`);
      const result = await wolframClient.solveParametricEquation(testEquation, testParameter);
      
      if (result.isMockData) {
        setError("API не вернул результат. Тестовый запрос с эталонным уравнением не сработал.");
      } else {
        setSolution(result.solution);
        setSteps(result.steps);
        setPlots(result.plots);
        setError("Тест успешно выполнен! API Wolfram Alpha работает.");
      }
    } catch (err) {
      console.error("Ошибка при тестовом запросе:", err);
      setError(`Ошибка при тестовом запросе: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Выполняем прямой тест API Wolfram Alpha");
      const result = await testWolframAlpha();
      
      if (result) {
        console.log("Результат прямого теста:", result);
        setError("Тест API успешен! Решение отображено ниже");
        
        // Сохраняем графики для отображения отдельно
        if (result.originalResult && result.originalResult.plots) {
          setPlots(result.originalResult.plots);
        }
        
        // Создаем блок с полным ответом от API
        let solutionText = "# Решение из API Wolfram Alpha\n\n";
        
        // Для текстового ответа от некоторых прокси
        if (result.text) {
          solutionText += result.text.substring(0, 500) + "...";
          setSolution(solutionText);
          return;
        }
        
        // Добавляем исходные данные запроса
        if (result.originalResult) {
          solutionText += `## Входные данные\n`;
          solutionText += `Уравнение: ${result.originalResult.equation || 'a*x + b = 0'}\n`;
          solutionText += `Параметр: ${result.originalResult.parameter || 'a'}\n\n`;
          
          // Добавляем решение
          solutionText += `## Результат\n`;
          solutionText += `${result.originalResult.solution || 'Нет данных'}\n\n`;
          
          // Добавляем шаги решения
          if (result.originalResult.steps && result.originalResult.steps.length > 0) {
            solutionText += `## Шаги решения\n`;
            result.originalResult.steps.forEach((step, index) => {
              solutionText += `${index + 1}. ${step}\n`;
            });
            solutionText += '\n';
          }
          
          // Добавляем информацию о графиках
          if (result.originalResult.plots && result.originalResult.plots.length > 0) {
            solutionText += `## Графики\n`;
            solutionText += `Доступно ${result.originalResult.plots.length} графиков для визуализации решения\n\n`;
          }
        }
        
        // Если есть данные в результате через pods, тоже показываем их
        if (result.queryresult && result.queryresult.pods) {
          solutionText += `## Детали ответа Wolfram Alpha\n`;
          
          const pods = result.queryresult.pods;
          pods.forEach(pod => {
            if (pod.subpods && pod.subpods.length > 0) {
              solutionText += `### ${pod.title || "Результат"}\n`;
              pod.subpods.forEach(subpod => {
                solutionText += `${subpod.plaintext || 'Нет текстовых данных'}\n`;
              });
              solutionText += '\n';
            }
          });
        }
        
        // Обновляем решение на странице
        setSolution(solutionText);
        
        // Если есть шаги решения, обновляем их
        if (result.originalResult && result.originalResult.steps) {
          setSteps(result.originalResult.steps);
        }
        
      } else {
        setError("API не вернул результат при прямом тесте. Проверьте консоль для деталей (F12)");
        
        // Показываем стандартное решение для теста
        const standardSolution = "x = -b/a (при a ≠ 0)";
        setSolution("Решение из локальных данных (API не доступен):\n" + standardSolution);
      }
    } catch (err) {
      console.error("Ошибка при прямом тесте API:", err);
      setError(`Ошибка при прямом тесте API: ${err.message}`);
      
      // Показываем стандартное решение
      const standardSolution = "x = -b/a (при a ≠ 0)";
      setSolution("Решение из локальных данных (ошибка API):\n" + standardSolution);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow`}>
      <h2 className="text-2xl font-bold mb-4">Решение уравнений с параметром</h2>
      
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <label className="block mb-2 font-semibold">Введите уравнение с параметром:</label>
          <input 
            type="text" 
            className={`w-full px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
            placeholder="Например: a*x^2 + b*x + c = 0" 
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
          />
          
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <p>Подсказка: используйте стандартный математический формат (например, "x^2" для x², "*" для умножения).</p>
            <p>Поддерживаются функции: sin, cos, tan, log, exp и другие.</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Примеры уравнений:</p>
            <div className="flex flex-wrap gap-2">
              {exampleEquations.map((example, index) => (
                <button
                  key={index}
                  className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => {
                    setEquation(example.equation);
                    setParameter(example.parameter);
                  }}
                  title={example.description}
                >
                  {example.equation}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <label className="block mb-2 font-semibold">Параметр:</label>
          <input 
            type="text" 
            className={`w-full px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
            placeholder="a" 
            value={parameter}
            onChange={(e) => setParameter(e.target.value)}
          />
        </div>
      </div>

      {/* Добавляем информационное сообщение о демо-режиме */}
      <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <p className="text-sm">Работа в демо-режиме: используются локальные данные для стабильной работы.</p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium`}
          onClick={solveEquation}
          disabled={isLoading}
        >
          {isLoading ? 'Решение...' : 'Решить уравнение'}
        </button>
        
        <button 
          className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'} text-white font-medium`}
          onClick={saveEquation}
        >
          Сохранить уравнение
        </button>
        
        <button 
          className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'} text-white font-medium`}
          onClick={() => setShowSaved(!showSaved)}
        >
          {showSaved ? 'Скрыть сохраненные' : 'Показать сохраненные'}
        </button>
      </div>
      
      {equationType && (
        <div className={`mb-4 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold">Подсказка:</h3>
          <p>{generateHint(equationType)}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {showSaved && (
        <div className={`mb-4 p-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-2">Сохраненные уравнения:</h3>
          {savedEquations.length > 0 ? (
            <ul>
              {savedEquations.map((eq, index) => (
                <li key={index} className="flex justify-between items-center mb-2">
                  <div>
                    <span className="mr-2">{eq.equation}</span>
                    <span className="text-sm text-gray-500">(параметр: {eq.parameter})</span>
                  </div>
                  <div>
                    <button 
                      className="px-2 py-1 mr-2 text-sm rounded bg-blue-500 text-white" 
                      onClick={() => loadEquation(eq)}
                    >
                      Загрузить
                    </button>
                    <button 
                      className="px-2 py-1 text-sm rounded bg-red-500 text-white" 
                      onClick={() => deleteEquation(index)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Нет сохраненных уравнений</p>
          )}
        </div>
      )}
      
      {solution && (
        <div className={`mt-6 p-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-xl font-semibold mb-4">Решение:</h3>
          
          {/* Проверка на строковый формат ответа */}
          {typeof solution === 'string' ? (
            <div className="mb-4">
              <div className={`p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'} whitespace-pre-wrap`}>
                {solution}
              </div>
            </div>
          ) : (
            <>
              {solution.inputInterpretation && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Интерпретация запроса:</h4>
                  <div className={`p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                    <MathJax>{solution.inputInterpretation}</MathJax>
                  </div>
                </div>
              )}
              
              {solution.steps && solution.steps.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Шаги решения:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    {solution.steps.map((step, index) => (
                      <li key={index} className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                        <MathJax>{step}</MathJax>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Ответ:</h4>
                <div className={`p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <MathJax>{solution.solution}</MathJax>
                </div>
              </div>
              
              {solution.plots && solution.plots.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Графическое представление:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {solution.plots.map((plot, index) => (
                      <div key={index} className="border rounded overflow-hidden">
                        <img 
                          src={plot} 
                          alt={`График ${index + 1}`} 
                          className="w-full" 
                          onError={(e) => {e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно'}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {solution.isMockData && !useMockAPI && (
                <div className={`mt-4 p-3 ${solution.isApiFailure ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'} rounded`}>
                  <p className="text-sm">
                    {solution.isApiFailure 
                      ? 'Примечание: показаны демонстрационные данные, так как запрос к Wolfram Alpha API не вернул результат или вернул ошибку.' 
                      : 'Примечание: показаны примерные данные. Для точного решения рекомендуется использовать другие формулировки уравнения.'}
                  </p>
                  {solution.apiResponse && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Показать технические детали ответа API</summary>
                      <pre className={`mt-2 p-2 text-xs overflow-auto rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} style={{maxHeight: '150px'}}>
                        {JSON.stringify(solution.apiResponse, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Отображение графиков для строкового формата решения */}
          {typeof solution === 'string' && plots && plots.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Графическое представление:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plots.map((plot, index) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <img 
                      src={plot} 
                      alt={`График ${index + 1}`} 
                      className="w-full h-auto" 
                      onError={(e) => {
                        console.log(`Ошибка загрузки изображения: ${plot}`);
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 mb-2 flex gap-2">
        <button
          className={`px-4 py-2 text-white rounded ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={handleTestApiCall}
          disabled={isLoading}
        >
          Проверить API с тестовым уравнением
        </button>
        
        <button
          className={`px-4 py-2 text-white rounded ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
          onClick={handleDirectTest}
          disabled={isLoading}
        >
          Прямой тест API
        </button>
      </div>

      {error && (
        <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ParametricEquationSolver; 