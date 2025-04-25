import React, { useState, useEffect } from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import * as math from 'mathjs';
import { 
  solveLinearParametricEquation,
  solveQuadraticParametricEquation,
  findParameterValuesForSolutionCount,
  findSignConstancyRegions,
  solveParametricEquationBySubstitution
} from '../utils/parameterSolver';

const ParametricSolver = ({ expression, parameter, parameterValue, darkMode }) => {
  const [equationType, setEquationType] = useState('');
  const [solution, setSolution] = useState(null);
  const [steps, setSteps] = useState([]);
  const [latexExpression, setLatexExpression] = useState('');
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [solutionMode, setSolutionMode] = useState('general'); // 'general', 'solutionCount', 'signConstancy'
  const [targetSolutionCount, setTargetSolutionCount] = useState(1);
  
  useEffect(() => {
    if (expression) {
      const newLatex = convertToLatex(expression);
      setLatexExpression(newLatex);
      determineEquationType(expression);
    }
  }, [expression, parameter]);
  
  // Преобразование выражения в LaTeX
  const convertToLatex = (expr) => {
    // Заменяем символы для красивого отображения через LaTeX
    return expr
      .replace(/\^/g, '^')
      .replace(/\*/g, '\\cdot ')
      .replace(/\//g, '\\div ')
      .replace(new RegExp(parameter, 'g'), `{${parameter}}`)
      .replace(/sqrt/g, '\\sqrt')
      .replace(/sin/g, '\\sin')
      .replace(/cos/g, '\\cos')
      .replace(/tan/g, '\\tan')
      .replace(/x\^2/g, 'x^2')
      .replace(/x\^3/g, 'x^3');
  };
  
  // Определяем тип уравнения
  const determineEquationType = (expr) => {
    if (expr.includes('x^2') || expr.includes('x²')) {
      setEquationType('quadratic');
    } else if (expr.includes('x^3') || expr.includes('x³')) {
      setEquationType('cubic');
    } else if (expr.includes('x^4') || expr.includes('x⁴')) {
      setEquationType('quartic');
    } else if (expr.includes('x')) {
      setEquationType('linear');
    } else {
      setEquationType('unknown');
    }
  };
  
  // Парсинг уравнения для получения коэффициентов
  const parseEquation = (expr) => {
    try {
      // Упрощаем выражение до вида ax^2 + bx + c = 0 или ax + b = 0
      // Это очень упрощенная реализация, которая работает только для простых случаев
      
      // Проверяем наличие равенства
      let leftSide = expr;
      let rightSide = '0';
      
      if (expr.includes('=')) {
        const parts = expr.split('=');
        leftSide = parts[0].trim();
        rightSide = parts[1].trim();
        
        // Переносим все в левую часть
        if (rightSide !== '0') {
          leftSide = `(${leftSide}) - (${rightSide})`;
        }
      }
      
      // Для линейного уравнения ax + b = 0
      if (equationType === 'linear') {
        // Попробуем идентифицировать коэффициенты
        // Это очень упрощенно и не будет работать для многих выражений
        const xRegex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*\\s*\\*?\\s*x)`, 'g');
        const constantRegex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*)(?!\\s*\\*?\\s*x)`, 'g');
        
        const xTerms = leftSide.match(xRegex) || [];
        const constantTerms = leftSide.match(constantRegex) || [];
        
        let a = 0;
        let b = 0;
        
        // Суммируем коэффициенты при x
        xTerms.forEach(term => {
          let coef = term.replace(/\s*\*?\s*x$/, '').trim();
          if (coef === '+' || coef === '') coef = '1';
          if (coef === '-') coef = '-1';
          a += parseFloat(coef);
        });
        
        // Суммируем свободные члены
        constantTerms.forEach(term => {
          let coef = term.trim();
          if (coef && !isNaN(parseFloat(coef))) {
            b += parseFloat(coef);
          }
        });
        
        return { a, b };
      }
      
      // Для квадратного уравнения ax^2 + bx + c = 0
      if (equationType === 'quadratic') {
        // Аналогично линейному, но с дополнительными термами для x^2
        const x2Regex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*\\s*\\*?\\s*x\\^2|[+-]?\\s*\\d*\\.?\\d*\\s*\\*?\\s*x²)`, 'g');
        const xRegex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*\\s*\\*?\\s*x)(?!\\^|²)`, 'g');
        const constantRegex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*)(?!\\s*\\*?\\s*x)`, 'g');
        
        const x2Terms = leftSide.match(x2Regex) || [];
        const xTerms = leftSide.match(xRegex) || [];
        const constantTerms = leftSide.match(constantRegex) || [];
        
        let a = 0;
        let b = 0;
        let c = 0;
        
        // Суммируем коэффициенты при x^2
        x2Terms.forEach(term => {
          let coef = term.replace(/\s*\*?\s*x\^2$|\s*\*?\s*x²$/, '').trim();
          if (coef === '+' || coef === '') coef = '1';
          if (coef === '-') coef = '-1';
          a += parseFloat(coef);
        });
        
        // Суммируем коэффициенты при x
        xTerms.forEach(term => {
          let coef = term.replace(/\s*\*?\s*x$/, '').trim();
          if (coef === '+' || coef === '') coef = '1';
          if (coef === '-') coef = '-1';
          b += parseFloat(coef);
        });
        
        // Суммируем свободные члены
        constantTerms.forEach(term => {
          let coef = term.trim();
          if (coef && !isNaN(parseFloat(coef))) {
            c += parseFloat(coef);
          }
        });
        
        return { a, b, c };
      }
      
      // Для более сложных уравнений
      return { expression: leftSide };
      
    } catch (error) {
      console.error('Ошибка при парсинге уравнения:', error);
      setError(`Не удалось разобрать уравнение: ${error.message}`);
      return null;
    }
  };
  
  // Решение уравнения
  const solveEquation = () => {
    setError(null);
    const coefficients = parseEquation(expression);
    
    if (!coefficients) {
      return;
    }
    
    try {
      let result = null;
      let solutionSteps = [];
      
      if (solutionMode === 'general') {
        // Общее решение уравнения
        if (equationType === 'linear') {
          if (coefficients.a && coefficients.b !== undefined) {
            result = solveLinearParametricEquation(coefficients.a, coefficients.b, parameter);
            solutionSteps = result.steps || [];
          }
        } else if (equationType === 'quadratic') {
          if (coefficients.a !== undefined && coefficients.b !== undefined && coefficients.c !== undefined) {
            result = solveQuadraticParametricEquation(coefficients.a, coefficients.b, coefficients.c, parameter);
            solutionSteps = result.steps || [];
          }
        } else {
          // Для других типов используем метод замены
          result = solveParametricEquationBySubstitution(expression, parameter);
          solutionSteps = result.steps || [];
        }
      } else if (solutionMode === 'solutionCount') {
        // Найти значения параметра для заданного количества решений
        result = findParameterValuesForSolutionCount(expression, parameter, targetSolutionCount);
        solutionSteps = result.explanation || [];
      } else if (solutionMode === 'signConstancy') {
        // Найти области знакопостоянства
        result = findSignConstancyRegions(expression, parameter);
        solutionSteps = result.explanation || [];
      }
      
      setSolution(result);
      setSteps(solutionSteps);
      
    } catch (error) {
      console.error('Ошибка при решении уравнения:', error);
      setError(`Не удалось решить уравнение: ${error.message}`);
    }
  };
  
  // Обработчик изменения режима решения
  const handleSolutionModeChange = (mode) => {
    setSolutionMode(mode);
  };
  
  // Обработчик изменения целевого количества решений
  const handleSolutionCountChange = (event) => {
    const value = event.target.value;
    if (value === 'infinity') {
      setTargetSolutionCount(Infinity);
    } else {
      setTargetSolutionCount(parseInt(value, 10));
    }
  };
  
  // Переключатель подробностей
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  // Форматирование коэффициентов для отображения
  const formatCoefficient = (coef) => {
    if (typeof coef === 'number') {
      return coef;
    } else if (typeof coef === 'string') {
      // Если коэффициент содержит параметр, возвращаем как есть
      return coef;
    }
    return 'Неизвестно';
  };
  
  return (
    <div className={`mt-6 p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h3 className="text-xl font-bold mb-4">Решение уравнения с параметром</h3>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => handleSolutionModeChange('general')}
          className={`px-4 py-2 rounded-lg ${
            solutionMode === 'general'
              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Общее решение
        </button>
        <button
          onClick={() => handleSolutionModeChange('solutionCount')}
          className={`px-4 py-2 rounded-lg ${
            solutionMode === 'solutionCount'
              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          По количеству решений
        </button>
        <button
          onClick={() => handleSolutionModeChange('signConstancy')}
          className={`px-4 py-2 rounded-lg ${
            solutionMode === 'signConstancy'
              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Знакопостоянство
        </button>
      </div>
      
      {solutionMode === 'solutionCount' && (
        <div className="mb-4">
          <label className="block mb-2">Количество решений:</label>
          <select
            value={targetSolutionCount === Infinity ? 'infinity' : targetSolutionCount}
            onChange={handleSolutionCountChange}
            className={`p-2 rounded-lg ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            <option value="0">0 (нет решений)</option>
            <option value="1">1 (единственное решение)</option>
            <option value="2">2 (два решения)</option>
            <option value="infinity">∞ (бесконечно много)</option>
          </select>
        </div>
      )}
      
      {expression && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="mb-2">Исследуемое уравнение:</p>
          <MathJaxContext>
            <div className="text-xl">
              <MathJax>{"\\(" + latexExpression + " = 0\\)"}</MathJax>
            </div>
          </MathJaxContext>
        </div>
      )}
      
      <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <p className="mb-2">Тип уравнения: {equationType === 'linear' ? 'Линейное' : equationType === 'quadratic' ? 'Квадратное' : equationType === 'cubic' ? 'Кубическое' : equationType}</p>
        
        {equationType === 'linear' && (
          <p>Форма: a·x + b = 0, где a и b могут зависеть от параметра {parameter}</p>
        )}
        
        {equationType === 'quadratic' && (
          <p>Форма: a·x² + b·x + c = 0, где a, b и c могут зависеть от параметра {parameter}</p>
        )}
        
        <button
          onClick={solveEquation}
          className={`mt-4 px-4 py-2 rounded-lg ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          Решить
        </button>
      </div>
      
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      {solution && !error && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className="text-lg font-semibold mb-2">Решение</h4>
          
          <button
            onClick={toggleDetails}
            className={`mb-4 px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {showDetails ? 'Скрыть шаги' : 'Показать шаги'}
          </button>
          
          {showDetails && steps.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold mb-2">Шаги решения:</h5>
              <ol className="list-decimal pl-6 space-y-2">
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          
          {solutionMode === 'general' && solution.cases && (
            <div>
              <h5 className="font-semibold mb-2">Различные случаи:</h5>
              {solution.cases.map((caseItem, caseIndex) => (
                <div key={caseIndex} className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <p className="font-medium">Случай {caseIndex + 1}: {caseItem.condition}</p>
                  
                  {caseItem.subcases ? (
                    <div className="ml-4 mt-2">
                      {caseItem.subcases.map((subcase, subcaseIndex) => (
                        <div key={subcaseIndex} className="mb-2">
                          <p>• При {subcase.condition}:</p>
                          {subcase.solution && typeof subcase.solution === 'function' && (
                            <div className="ml-6">
                              <p>{subcase.solution().description}</p>
                              {subcase.solution().solutions && (
                                <ul className="list-disc ml-4">
                                  {subcase.solution().solutions.map((sol, solIndex) => (
                                    <li key={solIndex}>{sol}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : caseItem.solution && typeof caseItem.solution === 'function' ? (
                    <div className="ml-4 mt-2">
                      <p>{caseItem.solution().description}</p>
                      {caseItem.solution().solutions && (
                        <ul className="list-disc ml-4">
                          {caseItem.solution().solutions.map((sol, solIndex) => (
                            <li key={solIndex}>{sol}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          
          {solutionMode === 'solutionCount' && solution.parameterValues && (
            <div>
              <h5 className="font-semibold mb-2">Значения параметра {parameter}, при которых уравнение имеет {targetSolutionCount === Infinity ? "бесконечно много" : targetSolutionCount} решений:</h5>
              {solution.parameterValues.length > 0 ? (
                <ul className="list-disc pl-6">
                  {solution.parameterValues.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              ) : (
                <p>Не найдено значений параметра, удовлетворяющих условию.</p>
              )}
            </div>
          )}
          
          {solutionMode === 'signConstancy' && (
            <div>
              <h5 className="font-semibold mb-2">Области знакопостоянства выражения:</h5>
              
              <div className="mb-4">
                <h6 className="font-medium">Выражение положительно при:</h6>
                {solution.positive && solution.positive.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {solution.positive.map((region, index) => (
                      <li key={index}>{region}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Не определено</p>
                )}
              </div>
              
              <div>
                <h6 className="font-medium">Выражение отрицательно при:</h6>
                {solution.negative && solution.negative.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {solution.negative.map((region, index) => (
                      <li key={index}>{region}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Не определено</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParametricSolver; 