import * as tf from '@tensorflow/tfjs';
import * as math from 'mathjs';

/**
 * Создает и возвращает модель нейронной сети для калькулятора
 * @returns {tf.Sequential} Созданная модель нейронной сети
 */
export const createCalculatorModel = () => {
  const model = tf.sequential();
  
  // Входной слой
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [5], // 5 признаков для описания выражения
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  // Скрытые слои
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
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
  
  // Компилируем модель с улучшенным оптимизатором и метриками
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mse', 'mae']
  });
  
  return model;
};

/**
 * Генерирует обучающие данные для калькулятора
 * @param {number} numSamples - Количество примеров для генерации
 * @returns {Array} Массив объектов с признаками и результатами
 */
export const generateCalculatorTrainingData = (numSamples = 1000) => {
  const data = [];
  const operators = ['+', '-', '*', '/', '^'];
  const operatorWeights = [0.3, 0.3, 0.25, 0.1, 0.05]; // Веса для разных операторов
  
  for (let i = 0; i < numSamples; i++) {
    // Выбираем оператор с учетом весов
    let opIndex = 0;
    const r = Math.random();
    let cumulativeWeight = 0;
    
    for (let j = 0; j < operatorWeights.length; j++) {
      cumulativeWeight += operatorWeights[j];
      if (r < cumulativeWeight) {
        opIndex = j;
        break;
      }
    }
    
    const op = operators[opIndex];
    
    // Генерируем случайные числа с разным диапазоном в зависимости от операции
    let num1, num2;
    
    if (op === '+' || op === '-') {
      num1 = Math.random() * 200 - 100; // от -100 до 100
      num2 = Math.random() * 200 - 100;
    } else if (op === '*') {
      num1 = Math.random() * 40 - 20; // от -20 до 20
      num2 = Math.random() * 40 - 20;
    } else if (op === '/') {
      num1 = Math.random() * 100 - 50; // от -50 до 50
      // Избегаем деления на очень маленькие числа или на ноль
      do {
        num2 = Math.random() * 20 - 10; // от -10 до 10
      } while (Math.abs(num2) < 0.1);
    } else if (op === '^') {
      num1 = Math.random() * 10 - 5; // от -5 до 5
      num2 = Math.random() * 3; // от 0 до 3
    }
    
    // Округляем до двух десятичных знаков для упрощения
    num1 = Math.round(num1 * 100) / 100;
    num2 = Math.round(num2 * 100) / 100;
    
    // Формируем выражение и вычисляем результат
    let expression, result;
    
    try {
      if (op === '^') {
        expression = `${num1}^${num2}`;
        result = Math.pow(num1, num2);
      } else {
        expression = `${num1}${op}${num2}`;
        result = math.evaluate(expression);
      }
      
      // Проверка на корректность результата
      if (!isNaN(result) && isFinite(result)) {
        // Кодируем операцию для модели
        let opCode;
        switch (op) {
          case '+': opCode = 0; break;
          case '-': opCode = 0.25; break;
          case '*': opCode = 0.5; break;
          case '/': opCode = 0.75; break;
          case '^': opCode = 1; break;
          default: opCode = 0;
        }
        
        // Формируем признаки
        // [число1, число2, код операции, сумма абсолютных значений, произведение]
        const features = [
          num1, 
          num2, 
          opCode, 
          Math.abs(num1) + Math.abs(num2),
          num1 * num2
        ];
        
        data.push({
          expression,
          features,
          result
        });
      }
    } catch (error) {
      // Пропускаем ошибочные выражения
      console.error(`Ошибка при генерации выражения ${expression}:`, error);
    }
  }
  
  return data;
};

/**
 * Обучает модель на сгенерированных данных
 * @param {tf.Sequential} model - Модель для обучения
 * @param {number} epochs - Количество эпох обучения
 * @param {Function} onProgress - Колбэк для отслеживания прогресса
 * @returns {Promise<boolean>} Промис, который разрешается в true при успешном обучении
 */
export const trainCalculatorModel = async (model, epochs = 50, onProgress = null) => {
  if (!model) {
    throw new Error('Модель не инициализирована');
  }
  
  try {
    // Генерируем увеличенный набор данных для лучшего обучения
    const trainingData = generateCalculatorTrainingData(2000);
    
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
    console.error('Ошибка при обучении модели:', error);
    throw new Error(`Не удалось обучить модель: ${error.message}`);
  }
};

/**
 * Разбирает математическое выражение и извлекает признаки для модели
 * @param {string} expression - Математическое выражение
 * @returns {Array} Массив числовых признаков
 */
export const extractFeaturesFromExpression = (expression) => {
  try {
    // Для простых выражений с двумя числами и одной операцией
    const simpleExprPattern = /^\s*(-?\d+\.?\d*)\s*([\+\-\*\/\^])\s*(-?\d+\.?\d*)\s*$/;
    const match = expression.match(simpleExprPattern);
    
    if (match) {
      const num1 = parseFloat(match[1]);
      const op = match[2];
      const num2 = parseFloat(match[3]);
      
      // Кодируем операцию
      let opCode;
      switch (op) {
        case '+': opCode = 0; break;
        case '-': opCode = 0.25; break;
        case '*': opCode = 0.5; break;
        case '/': opCode = 0.75; break;
        case '^': opCode = 1; break;
        default: opCode = 0;
      }
      
      // Возвращаем признаки [число1, число2, код операции, сумма абсолютных значений, произведение]
      return [
        num1, 
        num2, 
        opCode, 
        Math.abs(num1) + Math.abs(num2),
        num1 * num2
      ];
    }
    
    // Для более сложных выражений анализируем структуру
    const complexityScore = calculateExpressionComplexity(expression);
    const numCount = countNumbersInExpression(expression);
    const opCount = countOperatorsInExpression(expression);
    
    // Возвращаем обобщенные признаки
    return [
      numCount,                // количество чисел
      opCount,                 // количество операторов
      complexityScore / 10,    // нормализованная сложность
      0,                       // нет конкретных чисел
      0                        // нет конкретных чисел
    ];
  } catch (error) {
    console.error('Ошибка при извлечении признаков из выражения:', error);
    // Возвращаем признаки по умолчанию
    return [0, 0, 0, 0, 0];
  }
};

/**
 * Рассчитывает сложность выражения
 * @param {string} expression - Математическое выражение
 * @returns {number} Оценка сложности
 */
export const calculateExpressionComplexity = (expression) => {
  // Подсчитываем различные элементы, влияющие на сложность
  const operators = expression.match(/[\+\-\*\/\^]/g) || [];
  const brackets = expression.match(/[\(\)]/g) || [];
  const functions = expression.match(/\b(sin|cos|tan|log|ln|sqrt)\b/g) || [];
  
  // Разные элементы имеют разный вес в сложности
  return operators.length + brackets.length * 1.5 + functions.length * 2;
};

/**
 * Подсчитывает количество чисел в выражении
 * @param {string} expression - Математическое выражение
 * @returns {number} Количество чисел
 */
const countNumbersInExpression = (expression) => {
  const numbers = expression.match(/\d+\.?\d*/g) || [];
  return numbers.length;
};

/**
 * Подсчитывает количество операторов в выражении
 * @param {string} expression - Математическое выражение
 * @returns {number} Количество операторов
 */
const countOperatorsInExpression = (expression) => {
  const operators = expression.match(/[\+\-\*\/\^]/g) || [];
  return operators.length;
};

/**
 * Выполняет предсказание результата выражения с помощью модели
 * @param {tf.Sequential} model - Обученная модель нейронной сети
 * @param {string} expression - Математическое выражение
 * @returns {Promise<Object>} Объект с предсказанием и уровнем уверенности
 */
export const predictExpressionResult = async (model, expression) => {
  if (!model) {
    throw new Error('Модель не инициализирована');
  }
  
  try {
    // Извлекаем признаки из выражения
    const features = extractFeaturesFromExpression(expression);
    
    // Создаем тензор
    const inputTensor = tf.tensor2d([features]);
    
    // Получаем предсказание
    const prediction = model.predict(inputTensor);
    const result = prediction.dataSync()[0];
    
    // Освобождаем ресурсы
    inputTensor.dispose();
    prediction.dispose();
    
    // Вычисляем уверенность на основе сложности выражения
    const complexity = calculateExpressionComplexity(expression);
    let confidence = Math.max(0.5, Math.min(0.95, 1.0 - complexity * 0.05));
    
    // Корректируем уверенность в зависимости от типа операции
    if (expression.includes('/') || expression.includes('^')) {
      confidence *= 0.9; // Снижаем уверенность для деления и возведения в степень
    }
    
    return {
      prediction: result,
      confidence: confidence,
      complexity: complexity
    };
  } catch (error) {
    console.error('Ошибка при выполнении предсказания:', error);
    throw new Error(`Не удалось выполнить предсказание: ${error.message}`);
  }
};

/**
 * Определяет тип математического выражения
 * @param {string} expression - Математическое выражение
 * @returns {string} Тип выражения (arithmetic, algebraic, trigonometric и т.д.)
 */
export const determineExpressionType = (expression) => {
  if (expression.includes('x') || expression.includes('y') || expression.includes('=')) {
    return 'algebraic';
  } else if (expression.match(/\b(sin|cos|tan|log|ln)\b/)) {
    return 'trigonometric';
  } else if (expression.includes('^') || expression.includes('sqrt')) {
    return 'power';
  } else if (expression.match(/[\+\-\*\/]/)) {
    return 'arithmetic';
  } else {
    return 'unknown';
  }
};

/**
 * Сравнивает точность предсказания с реальным результатом
 * @param {number} predicted - Предсказанное значение
 * @param {number} actual - Фактическое значение
 * @returns {number} Процент точности (от 0 до 1)
 */
export const calculatePredictionAccuracy = (predicted, actual) => {
  if (!isFinite(actual) || !isFinite(predicted)) {
    return 0;
  }
  
  // Для значений, близких к нулю, используем абсолютную разницу
  if (Math.abs(actual) < 0.001) {
    const error = Math.abs(predicted - actual);
    return Math.max(0, 1 - error * 10);
  }
  
  // Для остальных случаев используем относительную ошибку
  const relativeError = Math.abs((predicted - actual) / actual);
  return Math.max(0, 1 - relativeError);
};

/**
 * Сохраняет модель калькулятора в локальное хранилище браузера
 * @param {tf.Sequential} model - Модель для сохранения
 * @returns {Promise<boolean>} Промис, который разрешается в true при успешном сохранении
 */
export const saveCalculatorModel = async (model) => {
  try {
    if (!model) {
      throw new Error('Модель не инициализирована');
    }
    
    await model.save('localstorage://calculator-neural-model');
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении модели:', error);
    return false;
  }
};

/**
 * Загружает модель калькулятора из локального хранилища браузера
 * @returns {Promise<tf.Sequential>} Промис, который разрешается в загруженную модель
 */
export const loadCalculatorModel = async () => {
  try {
    const model = await tf.loadLayersModel('localstorage://calculator-neural-model');
    return model;
  } catch (error) {
    console.error('Ошибка при загрузке модели:', error);
    return null;
  }
};

/**
 * Проверяет корректность математического выражения
 * @param {string} expression - Математическое выражение для проверки
 * @returns {Object} Объект с информацией о проверке {isValid, errorMessage, errorPosition}
 */
export const validateExpression = (expression) => {
  if (!expression || expression.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Выражение пустое',
      errorPosition: 0
    };
  }

  // Проверяем балансировку скобок
  const openBrackets = [];
  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === '(') {
      openBrackets.push(i);
    } else if (expression[i] === ')') {
      if (openBrackets.length === 0) {
        return {
          isValid: false,
          errorMessage: 'Несбалансированные скобки: лишняя закрывающая скобка',
          errorPosition: i
        };
      }
      openBrackets.pop();
    }
  }

  if (openBrackets.length > 0) {
    return {
      isValid: false,
      errorMessage: 'Несбалансированные скобки: не хватает закрывающей скобки',
      errorPosition: openBrackets[0]
    };
  }

  // Проверяем на наличие недопустимых последовательностей операторов
  const invalidSequences = [
    { pattern: /[\+\-\*\/\^]{2,}/, message: 'Последовательность операторов недопустима' },
    { pattern: /[\+\-\*\/\^]\)/, message: 'Оператор перед закрывающей скобкой' },
    { pattern: /\([\+\*\/\^]/, message: 'Оператор после открывающей скобки (кроме минуса)' }
  ];

  for (const { pattern, message } of invalidSequences) {
    const match = expression.match(pattern);
    if (match) {
      return {
        isValid: false,
        errorMessage: message,
        errorPosition: match.index
      };
    }
  }

  // Проверяем деление на ноль
  const zeroDivisionPattern = /\/\s*0(?![.\d])/;
  const zeroDivisionMatch = expression.match(zeroDivisionPattern);
  if (zeroDivisionMatch) {
    return {
      isValid: false,
      errorMessage: 'Деление на ноль',
      errorPosition: zeroDivisionMatch.index
    };
  }

  // Проверяем на недопустимые символы
  const validCharsPattern = /^[\d\s\+\-\*\/\^\(\)\.sincotaglqrxpde]+$/;
  if (!validCharsPattern.test(expression)) {
    for (let i = 0; i < expression.length; i++) {
      if (!/[\d\s\+\-\*\/\^\(\)\.sincotaglqrxpde]/.test(expression[i])) {
        return {
          isValid: false,
          errorMessage: `Недопустимый символ: "${expression[i]}"`,
          errorPosition: i
        };
      }
    }
  }

  try {
    // Пробуем вычислить выражение
    const result = math.evaluate(expression);
    
    // Проверяем корректность результата
    if (result === undefined || result === null || isNaN(result)) {
      return {
        isValid: false,
        errorMessage: 'Невозможно вычислить выражение',
        errorPosition: 0
      };
    }
    
    return {
      isValid: true,
      result: result
    };
  } catch (error) {
    // Анализируем ошибку из math.js
    let errorMessage = 'Ошибка в выражении';
    let errorPosition = 0;
    
    // Пытаемся извлечь информацию из сообщения об ошибке
    if (error.message) {
      if (error.message.includes('Unexpected end of expression')) {
        errorMessage = 'Неожиданный конец выражения';
        errorPosition = expression.length;
      } else if (error.message.includes('Value expected')) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
          errorPosition = parseInt(match[1]);
          errorMessage = 'Ожидается значение';
        }
      } else if (error.message.includes('Unexpected character')) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
          errorPosition = parseInt(match[1]);
          errorMessage = `Неожиданный символ в позиции ${errorPosition + 1}`;
        }
      }
    }
    
    return {
      isValid: false,
      errorMessage: errorMessage,
      errorPosition: errorPosition,
      originalError: error.message
    };
  }
};

/**
 * Предлагает исправление для некорректного выражения
 * @param {string} expression - Некорректное выражение
 * @param {Object} validationResult - Результат проверки из validateExpression
 * @returns {string} Предложение по исправлению
 */
export const suggestExpressionFix = (expression, validationResult) => {
  if (validationResult.isValid) {
    return expression;
  }
  
  let suggestion = '';
  
  // В зависимости от типа ошибки предлагаем разные исправления
  if (validationResult.errorMessage.includes('Несбалансированные скобки')) {
    if (validationResult.errorMessage.includes('не хватает закрывающей')) {
      // Добавляем закрывающую скобку
      suggestion = expression + ')'.repeat(expression.split('(').length - expression.split(')').length);
    } else if (validationResult.errorMessage.includes('лишняя закрывающая')) {
      // Убираем лишнюю закрывающую скобку
      suggestion = expression.substring(0, validationResult.errorPosition) + 
                   expression.substring(validationResult.errorPosition + 1);
    }
  } else if (validationResult.errorMessage.includes('Последовательность операторов')) {
    // Исправляем последовательность операторов, оставляя последний
    const pos = validationResult.errorPosition;
    const operatorMatch = expression.substring(pos).match(/[\+\-\*\/\^]+/)[0];
    suggestion = expression.substring(0, pos) + 
                 operatorMatch.charAt(operatorMatch.length - 1) + 
                 expression.substring(pos + operatorMatch.length);
  } else if (validationResult.errorMessage.includes('Деление на ноль')) {
    // Предлагаем заменить делитель
    suggestion = "Замените делитель на ненулевое значение";
  } else if (validationResult.errorMessage.includes('Недопустимый символ')) {
    // Удаляем недопустимый символ
    suggestion = expression.substring(0, validationResult.errorPosition) + 
                 expression.substring(validationResult.errorPosition + 1);
  } else {
    // Общее предложение для других ошибок
    suggestion = "Проверьте синтаксис выражения";
  }
  
  return suggestion;
}; 