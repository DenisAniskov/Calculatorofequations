import fetch from 'node-fetch';
import { parseString } from 'xml2js';

const WOLFRAM_APP_ID = 'AKXPY8-5LH3UQ4JJ4';
const BASE_URL = 'https://api.wolframalpha.com/v2/query';

/**
 * Разбирает XML ответ от Wolfram Alpha API в удобный для использования формат
 * 
 * @param {string} xmlData - XML данные от API Wolfram Alpha
 * @returns {Promise<Object>} Разобранные данные
 */
const parseWolframResponse = (xmlData) => {
  return new Promise((resolve, reject) => {
    parseString(xmlData, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Форматирует результаты из ответа Wolfram Alpha в читаемый вид
 * 
 * @param {Object} wolframResponse - Разобранный ответ от Wolfram Alpha
 * @returns {Object} Форматированные данные
 */
const formatWolframResults = (wolframResponse) => {
  try {
    if (!wolframResponse || !wolframResponse.queryresult || wolframResponse.queryresult.$.success === 'false') {
      return {
        success: false,
        error: wolframResponse?.queryresult?.$.error || 'Не удалось получить результат',
        pods: []
      };
    }

    const pods = Array.isArray(wolframResponse.queryresult.pod) 
      ? wolframResponse.queryresult.pod 
      : [wolframResponse.queryresult.pod];

    const formattedPods = pods.map(pod => {
      const subpods = Array.isArray(pod.subpod) ? pod.subpod : [pod.subpod];
      
      return {
        title: pod.$.title,
        primary: pod.$.primary === 'true',
        subpods: subpods.map(subpod => ({
          title: subpod.$.title || '',
          text: subpod.plaintext || '',
          image: subpod.img ? subpod.img.$.src : null
        }))
      };
    });

    return {
      success: true,
      inputInterpretation: formattedPods.find(pod => pod.title === 'Input interpretation')?.subpods[0]?.text || '',
      result: formattedPods.find(pod => pod.title === 'Result' || pod.primary)?.subpods[0]?.text || '',
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
 * Выполняет запрос к Wolfram Alpha API
 * 
 * @param {string} query - Запрос для Wolfram Alpha
 * @param {Object} options - Дополнительные опции для запроса
 * @returns {Promise<Object>} Результат запроса
 */
export const queryWolframAlpha = async (query, options = {}) => {
  try {
    const params = new URLSearchParams({
      input: query,
      appid: WOLFRAM_APP_ID,
      format: 'plaintext,image',
      output: 'xml',
      ...options
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    
    const xmlData = await response.text();
    const parsedData = await parseWolframResponse(xmlData);
    return formatWolframResults(parsedData);
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
 * Решает уравнение с параметром с помощью Wolfram Alpha
 * 
 * @param {string} equation - Уравнение для решения
 * @param {string} parameter - Параметр уравнения
 * @returns {Promise<Object>} Результат решения
 */
export const solveParametricEquation = async (equation, parameter) => {
  try {
    const query = `solve ${equation} for x, parameter ${parameter}`;
    return await queryWolframAlpha(query, { podstate: 'Step-by-step solution' });
  } catch (error) {
    console.error('Ошибка при решении уравнения:', error);
    return {
      success: false,
      error: error.message || 'Ошибка при решении уравнения',
      steps: []
    };
  }
};

/**
 * Получает график функции с помощью Wolfram Alpha
 * 
 * @param {string} expression - Выражение для построения графика
 * @param {string} parameter - Параметр (если есть)
 * @returns {Promise<Object>} Результат с URL изображения графика
 */
export const getPlot = async (expression, parameter = null) => {
  try {
    let query = `plot ${expression}`;
    if (parameter) {
      query += ` with ${parameter} = 1`;
    }
    
    const result = await queryWolframAlpha(query);
    
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
 * Получает шаги решения для уравнения
 * 
 * @param {string} equation - Уравнение для получения шагов решения
 * @returns {Promise<Object>} Шаги решения
 */
export const getSolutionSteps = async (equation) => {
  try {
    const result = await queryWolframAlpha(equation, { podstate: 'Step-by-step solution' });
    
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

export default {
  queryWolframAlpha,
  solveParametricEquation,
  getPlot,
  getSolutionSteps
}; 