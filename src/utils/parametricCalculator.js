import * as tf from '@tensorflow/tfjs';
import * as math from 'mathjs';

/**
 * Создает и возвращает модель нейронной сети для калькулятора с параметрами
 * @returns {tf.Sequential} Созданная модель нейронной сети
 */
export const createParametricModel = () => {
  const model = tf.sequential();
  
  // Входной слой (увеличенный размер входных данных для параметрических выражений)
  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu',
    inputShape: [8], // 8 признаков для описания выражения с параметром
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  // Скрытые слои (более глубокая сеть для обработки сложных параметрических выражений)
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.1 }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  // Выходной слой
  model.add(tf.layers.dense({
    units: 1,
    activation: 'linear'
  }));
  
  // Компилируем модель с оптимизированными параметрами для точности
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: 'meanSquaredError',
    metrics: ['mse', 'mae']
  });
  
  return model;
};

/**
 * Создает данные для обучения модели с параметрическими выражениями
 * @param {number} numSamples - Количество примеров для генерации
 * @returns {Array} Массив объектов с признаками и результатами
 */
export const generateParametricTrainingData = (numSamples = 2000) => {
  const data = [];
  
  // Параметрические шаблоны выражений
  const templates = [
    { template: '{param}^2 + {a}*{param} + {b}', weight: 0.25 }, // Квадратичное выражение
    { template: '{a}*{param} + {b}', weight: 0.2 }, // Линейное выражение
    { template: '{a}*{param}^3 + {b}*{param}^2 + {c}*{param} + {d}', weight: 0.1 }, // Кубическое выражение
    { template: 'sin({a}*{param})', weight: 0.1 }, // Тригонометрическое выражение
    { template: 'cos({a}*{param} + {b})', weight: 0.1 }, // Тригонометрическое выражение
    { template: '{a}*{param}^2 + {b}', weight: 0.15 }, // Упрощенное квадратичное выражение
    { template: 'sqrt({a}*{param} + {b})', weight: 0.05 }, // Выражение с корнем
    { template: '{a}*{param}/{b}', weight: 0.05 } // Рациональное выражение
  ];
  
  // Возможные имена параметров
  const paramNames = ['a', 'x', 't', 'p', 'z'];
  
  // Генерация данных
  for (let i = 0; i < numSamples; i++) {
    // Выбираем шаблон с учетом весов
    let templateIndex = 0;
    const r = Math.random();
    let cumulativeWeight = 0;
    
    for (let j = 0; j < templates.length; j++) {
      cumulativeWeight += templates[j].weight;
      if (r < cumulativeWeight) {
        templateIndex = j;
        break;
      }
    }
    
    const templateInfo = templates[templateIndex];
    let expression = templateInfo.template;
    
    // Выбираем случайный параметр
    const paramName = paramNames[Math.floor(Math.random() * paramNames.length)];
    
    // Заменяем имя параметра в шаблоне
    expression = expression.replace(/{param}/g, paramName);
    
    // Словарь для хранения сгенерированных коэффициентов
    const coefficients = {};
    const coefficientNames = ['a', 'b', 'c', 'd'];
    
    // Заполняем коэффициенты случайными значениями
    for (let coef of coefficientNames) {
      if (expression.includes(`{${coef}}`)) {
        // Генерируем значения коэффициентов с разным диапазоном
        // Чтобы получать более стабильные результаты
        let value;
        if (coef === 'a') {
          value = Math.random() * 10 - 5; // от -5 до 5
        } else if (coef === 'b') {
          value = Math.random() * 20 - 10; // от -10 до 10
        } else {
          value = Math.random() * 6 - 3; // от -3 до 3
        }
        
        // Округляем до одного десятичного знака
        value = Math.round(value * 10) / 10;
        
        // Иногда используем целые числа для упрощения
        if (Math.random() < 0.5) {
          value = Math.round(value);
        }
        
        coefficients[coef] = value;
        expression = expression.replace(`{${coef}}`, value);
      }
    }
    
    // Генерируем значение для параметра (для вычисления результата)
    const paramValue = Math.round((Math.random() * 10 - 5) * 10) / 10; // от -5 до 5 с одним десятичным знаком
    
    try {
      // Вычисляем результат, подставив значение параметра
      const evalExpression = expression.replace(new RegExp(paramName, 'g'), `(${paramValue})`);
      const result = math.evaluate(evalExpression);
      
      // Проверка на корректность результата
      if (!isNaN(result) && isFinite(result)) {
        // Формируем признаки для модели
        // [степень параметра, количество вхождений параметра, значение параметра, коэффициенты a, b, c, d (или 0 если нет), наличие тригонометрических функций]
        
        // Определяем максимальную степень параметра в выражении
        let maxPower = 0;
        if (expression.includes(`${paramName}^3`)) maxPower = 3;
        else if (expression.includes(`${paramName}^2`)) maxPower = 2;
        else if (expression.includes(paramName)) maxPower = 1;
        
        // Считаем количество вхождений параметра
        const paramCount = (expression.match(new RegExp(paramName, 'g')) || []).length;
        
        // Проверяем наличие тригонометрических функций
        const hasTrig = expression.includes('sin') || expression.includes('cos') || expression.includes('tan') ? 1 : 0;
        
        // Формируем вектор признаков
        const features = [
          maxPower, // Максимальная степень параметра
          paramCount, // Количество вхождений параметра
          paramValue, // Значение параметра для вычисления
          coefficients['a'] || 0, // Коэффициент a или 0
          coefficients['b'] || 0, // Коэффициент b или 0
          coefficients['c'] || 0, // Коэффициент c или 0
          coefficients['d'] || 0, // Коэффициент d или 0
          hasTrig // Наличие тригонометрических функций
        ];
        
        data.push({
          expression, // Выражение с параметром
          parameter: paramName, // Имя параметра
          parameterValue: paramValue, // Значение параметра для вычисления
          features, // Вектор признаков для нейронной сети
          result // Вычисленный результат
        });
      }
    } catch (error) {
      // Пропускаем ошибочные выражения
      console.error(`Ошибка при генерации параметрического выражения ${expression}:`, error);
    }
  }
  
  return data;
};

/**
 * Обучает модель на сгенерированных параметрических данных
 * @param {tf.Sequential} model - Модель для обучения
 * @param {number} epochs - Количество эпох обучения
 * @param {Function} onProgress - Колбэк для отслеживания прогресса
 * @returns {Promise<boolean>} Промис, который разрешается в true при успешном обучении
 */
export const trainParametricModel = async (model, epochs = 50, onProgress = null) => {
  if (!model) {
    throw new Error('Модель не инициализирована');
  }
  
  try {
    // Генерируем увеличенный набор данных для лучшего обучения
    const trainingData = generateParametricTrainingData(3000);
    
    // Разделяем данные на обучающую и валидационную выборки
    const splitIndex = Math.floor(trainingData.length * 0.8);
    const trainSet = trainingData.slice(0, splitIndex);
    const validationSet = trainingData.slice(splitIndex);
    
    // Создаем тензоры
    const xs = tf.tensor2d(trainSet.map(d => d.features));
    const ys = tf.tensor2d(trainSet.map(d => [d.result]));
    
    const valXs = tf.tensor2d(validationSet.map(d => d.features));
    const valYs = tf.tensor2d(validationSet.map(d => [d.result]));
    
    // Обучаем модель с валидацией и колбэками
    await model.fit(xs, ys, {
      epochs: epochs,
      batchSize: 32,
      shuffle: true,
      validationData: [valXs, valYs],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onProgress) {
            onProgress((epoch + 1) / epochs, logs);
          }
          
          if (epoch % 10 === 0) {
            console.log(`Эпоха ${epoch + 1}/${epochs}: потери = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
          }
        }
      }
    });
    
    // Освобождаем ресурсы
    xs.dispose();
    ys.dispose();
    valXs.dispose();
    valYs.dispose();
    
    return true;
  } catch (error) {
    console.error('Ошибка при обучении параметрической модели:', error);
    return false;
  }
};

/**
 * Извлекает признаки из параметрического выражения для предсказания
 * @param {string} expression - Выражение с параметром
 * @param {string} parameter - Имя параметра
 * @param {number} paramValue - Значение параметра
 * @returns {Array|null} Вектор признаков или null в случае ошибки
 */
export const extractFeaturesFromParametricExpression = (expression, parameter, paramValue) => {
  if (!expression || !parameter) {
    return null;
  }
  
  try {
    // Определяем максимальную степень параметра в выражении
    let maxPower = 0;
    if (expression.includes(`${parameter}^3`)) maxPower = 3;
    else if (expression.includes(`${parameter}^2`)) maxPower = 2;
    else if (expression.includes(parameter)) maxPower = 1;
    
    // Считаем количество вхождений параметра
    const paramCount = (expression.match(new RegExp(parameter, 'g')) || []).length;
    
    // Проверяем наличие тригонометрических функций
    const hasTrig = expression.includes('sin') || expression.includes('cos') || expression.includes('tan') ? 1 : 0;
    
    // Извлекаем коэффициенты из выражения
    // Это упрощенная версия, которая пытается найти паттерны типа "число*параметр^степень"
    let coefficientA = 0;
    let coefficientB = 0;
    let coefficientC = 0;
    let coefficientD = 0;
    
    // Пытаемся найти коэффициент при x^2 (a)
    const aMatch = expression.match(new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*\\*?\\s*${parameter}\\^2`));
    if (aMatch) {
      coefficientA = parseFloat(aMatch[1]);
    } else if (expression.includes(`${parameter}^2`)) {
      coefficientA = 1; // Если есть x^2 без явного коэффициента
    }
    
    // Пытаемся найти коэффициент при x (b)
    const bMatch = expression.match(new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*\\*?\\s*${parameter}(?!\\^)`));
    if (bMatch) {
      coefficientB = parseFloat(bMatch[1]);
    } else if (expression.includes(parameter) && !expression.includes(`${parameter}^`)) {
      coefficientB = 1; // Если есть x без явного коэффициента
    }
    
    // Пытаемся найти коэффициент при x^3 (c)
    const cMatch = expression.match(new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*\\*?\\s*${parameter}\\^3`));
    if (cMatch) {
      coefficientC = parseFloat(cMatch[1]);
    } else if (expression.includes(`${parameter}^3`)) {
      coefficientC = 1; // Если есть x^3 без явного коэффициента
    }
    
    // Пытаемся найти свободный член (d)
    // Это очень упрощенно и не будет работать для сложных выражений
    const dMatch = expression.match(/(?:^|[+\-])\s*(-?\d+(?:\.\d+)?)\s*(?:$|[+\-])/);
    if (dMatch) {
      coefficientD = parseFloat(dMatch[1]);
    }
    
    // Формируем вектор признаков
    return [
      maxPower, // Максимальная степень параметра
      paramCount, // Количество вхождений параметра
      paramValue, // Значение параметра
      coefficientA, // Коэффициент при x^2 или 0
      coefficientB, // Коэффициент при x или 0 
      coefficientC, // Коэффициент при x^3 или 0
      coefficientD, // Свободный член или 0
      hasTrig // Наличие тригонометрических функций
    ];
  } catch (error) {
    console.error('Ошибка при извлечении признаков из параметрического выражения:', error);
    return null;
  }
};

/**
 * Предсказывает результат параметрического выражения с помощью нейронной сети
 * @param {tf.Sequential} model - Обученная модель
 * @param {string} expression - Выражение с параметром
 * @param {string} parameter - Имя параметра
 * @param {number} paramValue - Значение параметра
 * @returns {Promise<Array>} Массив [предсказанный результат, уверенность]
 */
export const predictParametricExpressionResult = async (model, expression, parameter, paramValue) => {
  if (!model || !expression || !parameter) {
    return [null, 0];
  }
  
  try {
    // Извлекаем признаки из выражения
    const features = extractFeaturesFromParametricExpression(expression, parameter, paramValue);
    
    if (!features) {
      return [null, 0];
    }
    
    // Создаем тензор для предсказания
    const input = tf.tensor2d([features]);
    
    // Получаем предсказание модели
    const prediction = model.predict(input);
    
    // Получаем результат предсказания
    const predictedResult = prediction.dataSync()[0];
    
    // Вычисляем фактический результат для сравнения
    const replacedExpression = expression.replace(new RegExp(parameter, 'g'), `(${paramValue})`);
    const actualResult = math.evaluate(replacedExpression);
    
    // Вычисляем уверенность (на основе относительной ошибки)
    const relativeError = Math.abs((predictedResult - actualResult) / (Math.abs(actualResult) + 1e-10));
    let confidence = Math.max(0, 1 - relativeError);
    
    // Если ошибка очень большая, снижаем уверенность еще сильнее
    if (relativeError > 1) {
      confidence = Math.max(0, confidence / relativeError);
    }
    
    // Очищаем ресурсы
    input.dispose();
    prediction.dispose();
    
    // Округляем предсказание до 4 знаков после запятой
    const roundedPrediction = Math.round(predictedResult * 10000) / 10000;
    
    return [roundedPrediction, confidence];
  } catch (error) {
    console.error('Ошибка при предсказании результата параметрического выражения:', error);
    return [null, 0];
  }
};

/**
 * Проверяет корректность параметрического выражения
 * @param {string} expression - Выражение для проверки
 * @param {string} parameter - Имя параметра
 * @returns {Object} Объект с результатом проверки {valid: boolean, message: string}
 */
export const validateParametricExpression = (expression, parameter) => {
  if (!expression || expression.trim() === '') {
    return { valid: false, message: 'Выражение не может быть пустым' };
  }
  
  if (!parameter || parameter.trim() === '') {
    return { valid: false, message: 'Параметр не может быть пустым' };
  }
  
  // Проверяем, что параметр состоит только из одного символа
  if (parameter.length !== 1 || !/^[a-zA-Z]$/.test(parameter)) {
    return { valid: false, message: 'Параметр должен быть одной буквой' };
  }
  
  // Проверяем, что параметр присутствует в выражении
  if (!expression.includes(parameter)) {
    return { valid: false, message: `Параметр "${parameter}" отсутствует в выражении` };
  }
  
  // Проверяем корректность скобок
  let brackets = 0;
  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === '(') brackets++;
    else if (expression[i] === ')') brackets--;
    
    if (brackets < 0) {
      return { valid: false, message: 'Неправильная расстановка скобок' };
    }
  }
  
  if (brackets !== 0) {
    return { valid: false, message: 'Неправильная расстановка скобок' };
  }
  
  // Проверяем наличие недопустимых последовательностей операторов
  if (/[+\-*/^]{2,}/.test(expression)) {
    return { valid: false, message: 'Недопустимая последовательность операторов' };
  }
  
  // Проверяем, что выражение не начинается с оператора (кроме + и -)
  if (/^[*/^]/.test(expression)) {
    return { valid: false, message: 'Выражение не может начинаться с оператора * / ^' };
  }
  
  // Проверяем, что выражение не заканчивается оператором
  if (/[+\-*/^]$/.test(expression)) {
    return { valid: false, message: 'Выражение не может заканчиваться оператором' };
  }
  
  try {
    // Пробуем вычислить выражение с произвольным значением параметра
    const replaced = expression.replace(new RegExp(parameter, 'g'), '1');
    math.evaluate(replaced);
    return { valid: true, message: '' };
  } catch (error) {
    return { valid: false, message: `Ошибка в выражении: ${error.message}` };
  }
};

/**
 * Сохраняет модель в localStorage
 * @param {tf.Sequential} model - Модель для сохранения
 * @returns {Promise<boolean>} Промис, который разрешается в true при успешном сохранении
 */
export const saveParametricModel = async (model) => {
  try {
    const saveResults = await model.save('localstorage://parametric-calculator-model');
    console.log('Параметрическая модель сохранена:', saveResults);
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении параметрической модели:', error);
    return false;
  }
};

/**
 * Загружает модель из localStorage
 * @returns {Promise<tf.Sequential|null>} Промис, который разрешается в загруженную модель или null
 */
export const loadParametricModel = async () => {
  try {
    const model = await tf.loadLayersModel('localstorage://parametric-calculator-model');
    return model;
  } catch (error) {
    console.log('Модель не найдена в localStorage:', error);
    return null;
  }
}; 