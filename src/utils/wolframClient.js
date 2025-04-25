/**
 * Клиент для взаимодействия с прокси-сервером Wolfram Alpha
 */

const API_URL = 'http://localhost:3001/api/wolfram';
const WOLFRAM_APP_ID = "DEMO-APPID"; // Замените на ваш APP ID при регистрации

/**
 * Выполняет запрос к Wolfram Alpha через прокси-сервер
 * 
 * @param {string} query - Запрос для Wolfram Alpha
 * @param {Object} options - Дополнительные опции для запроса
 * @returns {Promise<Object>} Результат запроса
 */
export const queryWolfram = async (query, options = {}) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, options }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();
    return formatResponse(data);
  } catch (error) {
    console.error('Ошибка запроса к Wolfram Alpha:', error);
    return {
      success: false,
      error: error.message || 'Ошибка запроса к Wolfram Alpha',
      pods: []
    };
  }
};

/**
 * Форматирует ответ от Wolfram Alpha в удобный формат
 * 
 * @param {Object} response - Ответ от API
 * @returns {Object} Форматированные данные
 */
const formatResponse = (response) => {
  try {
    if (!response || !response.queryresult || response.queryresult.success === false) {
      return {
        success: false,
        error: response?.queryresult?.error || 'Не удалось получить результат',
        pods: []
      };
    }

    const pods = Array.isArray(response.queryresult.pods) 
      ? response.queryresult.pods 
      : [];

    const formattedPods = pods.map(pod => {
      const subpods = Array.isArray(pod.subpods) ? pod.subpods : [];
      
      return {
        title: pod.title,
        primary: pod.primary === true,
        subpods: subpods.map(subpod => ({
          title: subpod.title || '',
          text: subpod.plaintext || '',
          image: subpod.img ? subpod.img.src : null
        }))
      };
    });

    // Находим результаты в подах
    const inputPod = formattedPods.find(pod => pod.title === 'Input' || pod.title === 'Input interpretation');
    const resultPod = formattedPods.find(pod => pod.title === 'Result' || pod.primary);
    const solutionPod = formattedPods.find(pod => pod.title === 'Solution' || pod.title.includes('solution'));

    return {
      success: true,
      inputInterpretation: inputPod?.subpods[0]?.text || '',
      result: resultPod?.subpods[0]?.text || '',
      solution: solutionPod?.subpods[0]?.text || '',
      pods: formattedPods
    };
  } catch (error) {
    console.error('Ошибка форматирования ответа Wolfram Alpha:', error);
    return {
      success: false,
      error: 'Ошибка обработки ответа',
      pods: []
    };
  }
};

/**
 * Решает уравнение с параметром с помощью Wolfram Alpha
 * 
 * @param {string} equation - Уравнение для решения
 * @param {string} parameter - Параметр уравнения (если есть)
 * @returns {Promise<Object>} Результат решения
 */
export const solveEquation = async (equation, parameter = null) => {
  try {
    let query = `solve ${equation}`;
    if (parameter) {
      query += ` for x, parameter ${parameter}`;
    }
    
    return await queryWolfram(query, { 
      podstate: 'Step-by-step solution'
    });
  } catch (error) {
    console.error('Ошибка при решении уравнения:', error);
    return {
      success: false,
      error: error.message || 'Ошибка при решении уравнения',
      pods: []
    };
  }
};

/**
 * Получает шаги решения для уравнения
 * 
 * @param {string} equation - Уравнение для получения шагов решения
 * @returns {Promise<Object>} Шаги решения
 */
export const getSolutionSteps = async (equation) => {
  try {
    const result = await queryWolfram(equation, { 
      podstate: 'Step-by-step solution'
    });
    
    const stepsPod = result.pods.find(pod => 
      pod.title === 'Step-by-step solution' || 
      pod.title.includes('solution') || 
      pod.title.includes('steps')
    );
    
    if (stepsPod && stepsPod.subpods) {
      return {
        success: true,
        steps: stepsPod.subpods.map(subpod => subpod.text),
        pods: result.pods
      };
    }
    
    return {
      success: false,
      error: 'Шаги решения не найдены',
      pods: result.pods
    };
  } catch (error) {
    console.error('Ошибка при получении шагов решения:', error);
    return {
      success: false,
      error: error.message || 'Ошибка при получении шагов решения',
      pods: []
    };
  }
};

/**
 * Получает график функции с помощью Wolfram Alpha
 * 
 * @param {string} expression - Выражение для построения графика
 * @param {string} parameter - Параметр (если есть)
 * @param {number} paramValue - Значение параметра
 * @returns {Promise<Object>} Результат с URL изображения графика
 */
export const getPlot = async (expression, parameter = null, paramValue = 0) => {
  try {
    let query = `plot ${expression}`;
    if (parameter) {
      query += ` with ${parameter} = ${paramValue}`;
    }
    
    const result = await queryWolfram(query);
    
    // Ищем в подах изображение графика
    const plotPod = result.pods.find(pod => 
      pod.title === 'Plot' || 
      pod.title.includes('plot') || 
      pod.title.includes('График')
    );
    
    if (plotPod && plotPod.subpods && plotPod.subpods[0].image) {
      return {
        success: true,
        imageUrl: plotPod.subpods[0].image,
        pods: result.pods
      };
    }
    
    return {
      success: false,
      error: 'График не найден в ответе',
      pods: result.pods
    };
  } catch (error) {
    console.error('Ошибка при получении графика:', error);
    return {
      success: false,
      error: error.message || 'Ошибка при получении графика',
      pods: []
    };
  }
};

/**
 * Получает подробную информацию о математическом выражении
 * 
 * @param {string} expression - Математическое выражение
 * @returns {Promise<Object>} Результат анализа
 */
export const analyzeExpression = async (expression) => {
  try {
    return await queryWolfram(expression);
  } catch (error) {
    console.error('Ошибка при анализе выражения:', error);
    return {
      success: false,
      error: error.message || 'Ошибка при анализе выражения',
      pods: []
    };
  }
};

/**
 * Получить решение параметрического уравнения
 * @param {string} equation - Уравнение с параметром
 * @param {string} parameter - Параметр
 * @returns {Promise<Object>} - Объект с решением и изображением графика
 */
export const solveParametricEquation = async (equation, parameter) => {
  try {
    // Формируем запрос для Wolfram Alpha
    const query = encodeURIComponent(`solve ${equation} for x, parameter ${parameter}`);
    const url = `https://api.wolframalpha.com/v2/query?input=${query}&format=plaintext,image&output=JSON&appid=${WOLFRAM_APP_ID}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Обработка ответа
    if (data.queryresult.success === false) {
      throw new Error("Не удалось получить решение");
    }
    
    let solution = "";
    let plotUrl = "";
    
    // Извлекаем решение и график
    for (const pod of data.queryresult.pods) {
      if (pod.title === "Solution") {
        solution = pod.subpods[0].plaintext;
      } else if (pod.title === "Plot") {
        plotUrl = pod.subpods[0].img.src;
      }
    }
    
    return { solution, plotUrl };
  } catch (error) {
    console.error("Ошибка при обращении к Wolfram Alpha:", error);
    throw error;
  }
};

/**
 * Имитация ответа Wolfram Alpha для тестирования без API
 * @param {string} equation - Уравнение с параметром
 * @param {string} parameter - Параметр
 * @returns {Promise<Object>} - Объект с решением и изображением графика
 */
export const mockSolveParametricEquation = async (equation, parameter) => {
  // Имитируем задержку запроса
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Проверяем тип уравнения
  if (equation.includes("x^2") && equation.includes(parameter)) {
    return {
      solution: `x = -sqrt(${parameter}) или x = sqrt(${parameter}) при ${parameter} ≥ 0`,
      plotUrl: "https://www4b.wolframalpha.com/Calculate/MSP/MSP9391ib7hi5d08610f300000625gcib0f7hea4d3?MSPStoreType=image/gif&s=12"
    };
  } else if (equation.includes("sin") || equation.includes("cos")) {
    return {
      solution: `x = arcsin(${parameter}) + 2πn или x = π - arcsin(${parameter}) + 2πn при -1 ≤ ${parameter} ≤ 1`,
      plotUrl: "https://www4b.wolframalpha.com/Calculate/MSP/MSP9401ib7hi5d086i6e70000030i37h6g4idh9i5?MSPStoreType=image/gif&s=12"
    };
  } else {
    return {
      solution: `x = ${parameter} / 2`,
      plotUrl: "https://www4b.wolframalpha.com/Calculate/MSP/MSP9411ib7hi5d086i6ig00004c2a4fch7f49h94g?MSPStoreType=image/gif&s=12"
    };
  }
};

export default {
  queryWolfram,
  solveEquation,
  getSolutionSteps,
  getPlot,
  analyzeExpression,
  solveParametricEquation,
  mockSolveParametricEquation
}; 