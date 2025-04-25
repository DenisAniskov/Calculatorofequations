import fetchWithCorsProxy from './corsProxy';

// Ключ для Wolfram Alpha API из переменных окружения
const APP_ID = import.meta.env.VITE_WOLFRAM_APP_ID || 'AKXPY8-RW6XTQJQP6';

// Базовый URL для Wolfram Alpha API
const WOLFRAM_API_URL = 'https://api.wolframalpha.com/v2/query';

// Режим демо (загружать тестовые данные вместо реальных запросов)
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Решает параметрическое уравнение
 * @param {string} equation - Уравнение для решения
 * @param {string} parameter - Параметр в уравнении
 * @returns {Promise<Object>} - Результат решения
 */
const solveParametricEquation = async (equation, parameter) => {
  try {
    // Проверяем режим демо
    if (DEMO_MODE) {
      console.log('Демо-режим: использование локальных данных для уравнения', equation, 'с параметром', parameter);
      return await mockSolveParametricEquation(equation, parameter);
    }
    
    console.log('Отправка запроса к Wolfram Alpha для уравнения', equation, 'с параметром', parameter);
    
    // Конструируем запрос к Wolfram Alpha API
    const params = {
      input: `solve ${equation} for x`,
      appid: APP_ID,
      format: 'plaintext,image',
      output: 'json',
      includepodid: 'Solution',
      podstate: 'Result__Step-by-step+solution',
      scanner: 'Solve'
    };
    
    // Добавляем параметр, если он указан
    if (parameter) {
      params.input = `solve ${equation} for x, parameter ${parameter}`;
      params.assumeptions = `${parameter} is parameter`;
    }
    
    // Отправляем запрос через CORS прокси
    const result = await fetchWithCorsProxy(WOLFRAM_API_URL, params);
    
    console.log('Получен ответ от Wolfram Alpha:', result);
    
    // Проверяем результат
    if (!result || !result.queryresult || result.queryresult.success === false) {
      console.log('Использование мок-данных из-за ошибки API');
      
      // В случае ошибки используем мок-данные
      const mockResult = await mockSolveParametricEquation(equation, parameter);
      mockResult.isApiFailure = true;
      mockResult.apiResponse = result;
      
      return mockResult;
    }
    
    // Извлекаем решение из ответа Wolfram Alpha
    const solution = extractSolutionFromWolframResponse(result, equation, parameter);
    
    // Если решение не найдено, используем мок-данные
    if (!solution.success) {
      console.log('Использование мок-данных, так как API не вернул решение');
      
      const mockResult = await mockSolveParametricEquation(equation, parameter);
      mockResult.isApiFailure = true;
      mockResult.apiResponse = result;
      
      return mockResult;
    }
    
    return solution;
  } catch (error) {
    console.error('Ошибка при запросе к Wolfram Alpha:', error);
    
    // В случае ошибки используем мок-данные
    const mockResult = await mockSolveParametricEquation(equation, parameter);
    mockResult.isApiFailure = true;
    mockResult.apiError = error.message;
    
    return mockResult;
  }
};

/**
 * Генерирует базовые шаги решения для уравнения с параметром
 * @param {string} equation - Исходное уравнение
 * @param {string} parameter - Параметр в уравнении
 * @param {string} solution - Решение
 * @returns {Array<string>} - Шаги решения
 */
const generateBasicSteps = (equation, parameter, solution) => {
  return [
    `Рассматриваем уравнение: ${equation}`,
    `Параметр: ${parameter}`,
    `Применяем метод решения уравнений с параметром, исследуем различные случаи...`,
    `Получаем решение: ${solution}`
  ];
};

/**
 * Мок-функция для демонстрации решения параметрических уравнений
 * @param {string} equation - Уравнение для решения
 * @param {string} parameter - Параметр в уравнении
 * @returns {Promise<Object>} - Результат решения
 */
const mockSolveParametricEquation = async (equation, parameter) => {
  // Имитация задержки сетевого запроса
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Определяем тип уравнения для выбора шаблона
  const equationType = determineEquationType(equation);
  
  // Получаем решение по типу уравнения
  const solution = getParametricSolution(equation, parameter, equationType);
  
  // Генерация шагов решения
  const steps = generateSolutionSteps(equation, parameter, solution, equationType);

  // Пример графика
  const plots = [
    `https://via.placeholder.com/640x480.png?text=${encodeURIComponent(`График ${getTypeDescription(equationType)}`)}`,
    `https://via.placeholder.com/800x400.png?text=${encodeURIComponent(`Параметр ${parameter} в ${getTypeDescription(equationType)}`)}`
  ];

  return {
    solution: solution,
    steps,
    plots,
    inputInterpretation: `Уравнение ${equation} с параметром ${parameter}`,
    success: true,
    isMockData: true
  };
};

/**
 * Определяет тип уравнения
 * @param {string} equation - Исходное уравнение
 * @returns {string} - Тип уравнения
 */
const determineEquationType = (equation) => {
  const cleanEq = equation.replace(/\s+/g, '').toLowerCase();
  
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

/**
 * Возвращает решение уравнения с параметром
 * @param {string} equation - Уравнение для решения
 * @param {string} parameter - Параметр в уравнении
 * @param {string} type - Тип уравнения
 * @returns {string} - Решение уравнения
 */
const getParametricSolution = (equation, parameter, type) => {
  const solutions = {
    'linear': 'x = -b/a при a ≠ 0; нет решений при a = 0, b ≠ 0; любое x при a = b = 0',
    'quadratic': 'x = (-b ± √(b² - 4ac))/2a при a ≠ 0; x = -c/b при a = 0, b ≠ 0; нет решений при a = b = 0, c ≠ 0',
    'trigonometric': 'x = arcsin(a) + 2πn или x = π - arcsin(a) + 2πn, n ∈ Z при |a| ≤ 1; нет решений при |a| > 1',
    'logarithmic': 'x = a^b при a > 0, a ≠ 1',
    'exponential': 'x = log_a(b) при a > 0, a ≠ 1, b > 0',
    'rational': 'x = bc/(1 - ac) при a ≠ 0, ac ≠ 1',
    'unknown': `Для решения уравнения ${equation} необходим анализ по параметру ${parameter}`
  };
  
  return solutions[type] || solutions['unknown'];
};

/**
 * Генерирует шаги решения уравнения с параметром
 * @param {string} equation - Уравнение для решения
 * @param {string} parameter - Параметр в уравнении
 * @param {string} solution - Решение уравнения
 * @param {string} type - Тип уравнения
 * @returns {Array<string>} - Шаги решения
 */
const generateSolutionSteps = (equation, parameter, solution, type) => {
  const steps = [
    `Рассматриваем уравнение: ${equation}`,
    `Определяем тип уравнения: ${getTypeDescription(type)}`,
    `Параметр в уравнении: ${parameter}`
  ];
  
  // Добавляем специфические шаги в зависимости от типа уравнения
  switch (type) {
    case 'linear':
      steps.push(
        `Приводим к виду a*x + b = 0`,
        `Если a ≠ 0, тогда x = -b/a`,
        `Если a = 0 и b ≠ 0, тогда уравнение не имеет решений`,
        `Если a = 0 и b = 0, тогда уравнение имеет бесконечно много решений`
      );
      break;
    case 'quadratic':
      steps.push(
        `Приводим к виду a*x² + b*x + c = 0`,
        `Вычисляем дискриминант D = b² - 4ac`,
        `Если D > 0, тогда x₁,₂ = (-b ± √D)/2a`,
        `Если D = 0, тогда x = -b/2a`,
        `Если D < 0, тогда нет решений в действительных числах`
      );
      break;
    case 'trigonometric':
      steps.push(
        `Для уравнения вида sin(x) = a:`,
        `Если |a| ≤ 1, тогда x = arcsin(a) + 2πn или x = π - arcsin(a) + 2πn, где n ∈ Z`,
        `Если |a| > 1, тогда уравнение не имеет решений`
      );
      break;
    case 'logarithmic':
      steps.push(
        `Для уравнения вида log_a(x) = b:`,
        `Применяем свойство логарифма: x = a^b`,
        `Учитываем, что a > 0, a ≠ 1, и x > 0`
      );
      break;
    case 'exponential':
      steps.push(
        `Для уравнения вида a^x = b:`,
        `Применяем логарифмирование: x = log_a(b)`,
        `Учитываем, что a > 0, a ≠ 1, и b > 0`
      );
      break;
    case 'rational':
      steps.push(
        `Для рационального уравнения вида x/(a*x + b) = c:`,
        `Преобразуем к виду x = bc/(1 - ac)`,
        `Учитываем ограничения: a ≠ 0, ac ≠ 1`
      );
      break;
    default:
      steps.push(
        `Для решения данного уравнения необходимо проанализировать различные значения параметра ${parameter}`,
        `Исследуем критические значения параметра, при которых меняется вид решения`
      );
  }
  
  steps.push(`Итоговое решение: ${solution}`);
  
  return steps;
};

/**
 * Возвращает описание типа уравнения
 * @param {string} type - Тип уравнения
 * @returns {string} - Описание типа уравнения
 */
const getTypeDescription = (type) => {
  const descriptions = {
    'linear': 'линейное уравнение',
    'quadratic': 'квадратное уравнение',
    'trigonometric': 'тригонометрическое уравнение',
    'logarithmic': 'логарифмическое уравнение',
    'exponential': 'показательное уравнение',
    'rational': 'рациональное уравнение',
    'unknown': 'уравнение общего вида'
  };
  
  return descriptions[type] || descriptions['unknown'];
};

/**
 * Извлекает решение из ответа Wolfram Alpha
 * @param {Object} result - Ответ от Wolfram Alpha API
 * @param {string} equation - Исходное уравнение
 * @param {string} parameter - Параметр в уравнении
 * @returns {Object} - Структурированное решение
 */
const extractSolutionFromWolframResponse = (result, equation, parameter) => {
  try {
    const pods = result.queryresult.pods || [];
    let solution = null;
    let steps = [];
    let plots = [];
    
    // Ищем решение
    const solutionPod = pods.find(pod => 
      pod.id === 'Solution' || 
      pod.title === 'Solution' || 
      pod.title.includes('solution')
    );
    
    if (solutionPod && solutionPod.subpods && solutionPod.subpods.length > 0) {
      solution = solutionPod.subpods[0].plaintext;
    }
    
    // Ищем шаги решения
    const stepsPod = pods.find(pod => 
      pod.id === 'Result' || 
      pod.title.includes('step') || 
      pod.title.includes('Step')
    );
    
    if (stepsPod && stepsPod.subpods) {
      steps = stepsPod.subpods.map(subpod => subpod.plaintext).filter(text => text);
    }
    
    // Если не нашли шаги, генерируем на основе типа уравнения
    if (steps.length === 0) {
      const equationType = determineEquationType(equation);
      steps = generateSolutionSteps(equation, parameter, solution || 'Решение не найдено', equationType);
    }
    
    // Ищем графики
    pods.forEach(pod => {
      if (pod.subpods) {
        pod.subpods.forEach(subpod => {
          if (subpod.img && subpod.img.src) {
            plots.push(subpod.img.src);
          }
        });
      }
    });
    
    // Если нет решения, считаем что запрос неудачный
    if (!solution) {
      console.log('Решение не найдено в ответе Wolfram Alpha');
      return { success: false };
    }
    
    return {
      solution: solution,
      steps: steps,
      plots: plots,
      inputInterpretation: result.queryresult.pods.find(pod => pod.id === 'Input')?.subpods[0]?.plaintext || 
                          `Уравнение ${equation} с параметром ${parameter}`,
      success: true,
      isMockData: false,
      apiResponse: result
    };
  } catch (error) {
    console.error('Ошибка при извлечении решения из ответа Wolfram Alpha:', error);
    return { success: false };
  }
};

export default {
  solveParametricEquation,
  mockSolveParametricEquation
}; 