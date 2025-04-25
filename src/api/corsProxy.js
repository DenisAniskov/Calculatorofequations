/**
 * Прокси-функция для обхода CORS ограничений при запросах к Wolfram Alpha API
 * Использует другие CORS прокси
 * @param {string} url - URL для запроса
 * @param {Object} params - Параметры запроса
 * @returns {Promise<Object>} - Результат запроса
 */
const fetchWithCorsProxy = async (url, params) => {
  try {
    // Преобразуем параметры в строку запроса
    const queryParams = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryParams}`;
    
    // Используем CORS прокси из переменной окружения или запасной вариант
    const proxyBaseUrl = import.meta.env.VITE_CORS_PROXY_URL || 'https://cors-proxy.htmldriven.com/?url=';
    const proxyUrl = `${proxyBaseUrl}${encodeURIComponent(fullUrl)}`;
    
    // Отладка
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('Отправка запроса через CORS прокси:', proxyUrl);
    }
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ошибка ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // htmldriven возвращает данные в свойстве body
    if (responseData.body) {
      try {
        return JSON.parse(responseData.body);
      } catch (e) {
        console.error('Ошибка при парсинге JSON из body:', e);
        return { 
          text: responseData.body,
          queryresult: { 
            success: false, 
            error: { msg: "Ошибка формата ответа" } 
          } 
        };
      }
    }
    
    // Если формат ответа другой
    try {
      return JSON.parse(responseData);
    } catch (e) {
      console.error('Ошибка при парсинге JSON:', e);
      // Текстовый ответ, если не JSON
      return { 
        text: responseData,
        queryresult: { 
          success: false, 
          error: { msg: "Ошибка формата ответа" } 
        } 
      };
    }
  } catch (error) {
    console.error('Ошибка при запросе через CORS прокси:', error);
    return null;
  }
};

export default fetchWithCorsProxy; 