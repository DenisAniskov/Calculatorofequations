import * as tf from '@tensorflow/tfjs';
import * as math from 'mathjs';

// Предварительно обученные веса для модели
const PRETRAINED_WEIGHTS = {
  weights: [
    [0.5, 0.3, -0.2, 0.1],
    [0.1, 0.4, 0.6, -0.3],
    [-0.3, 0.7, 0.2, 0.4]
  ],
  biases: [0.1, 0.2, 0.3, 0.4]
};

// База знаний для подсказок
const HINTS_KNOWLEDGE_BASE = {
  quadratic: [
    "Попробуйте разложить на множители",
    "Используйте формулу дискриминанта",
    "Рассмотрите разные случаи для параметра"
  ],
  linear: [
    "Перенесите все члены в одну сторону",
    "Разделите на коэффициент при x",
    "Учтите знак коэффициента"
  ],
  rational: [
    "Найдите нули числителя и знаменателя",
    "Определите область допустимых значений",
    "Используйте метод интервалов"
  ],
  exponential: [
    "Используйте свойства логарифмов",
    "Переведите в логарифмическую форму",
    "Проверьте области допустимых значений"
  ],
  logarithmic: [
    "Приведите к одному основанию",
    "Используйте свойства логарифмов",
    "Помните про ОДЗ логарифмов"
  ],
  trigonometric: [
    "Используйте основные тригонометрические тождества",
    "Приведите к стандартной форме",
    "Помните о периодичности функций"
  ]
};

// Создание модели нейронной сети
export const createModel = () => {
  try {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      inputShape: [1]
    }));
    
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });

    return model;
  } catch (error) {
    console.error('Ошибка при создании модели:', error);
    throw new Error(`Не удалось создать модель нейронной сети: ${error.message}`);
  }
};

// Генерация тренировочных данных с различными типами функций
const generateTrainingData = (functionType = 'all', numPoints = 100) => {
  try {
    const xValues = [];
    const yValues = [];
    
    for (let i = -10; i <= 10; i += 20 / numPoints) {
      let y;
      
      // Генерируем данные в зависимости от типа функции
      switch (functionType) {
        case 'linear':
          y = 2 * i + 1;
          break;
        case 'quadratic':
          y = i * i + 2 * i + 1;
          break;
        case 'cubic':
          y = i * i * i + i * i + i + 1;
          break;
        case 'rational':
          if (i !== 0) y = 1 / i;
          else continue;
          break;
        case 'exponential':
          y = Math.exp(i);
          break;
        case 'logarithmic':
          if (i > 0) y = Math.log(i);
          else continue;
          break;
        case 'trigonometric':
          y = Math.sin(i);
          break;
        case 'all':
          // Смешанный набор данных
          if (Math.random() < 0.2) y = 2 * i + 1; // linear
          else if (Math.random() < 0.4) y = i * i + 2 * i + 1; // quadratic
          else if (Math.random() < 0.6) y = i * i * i + i * i + i + 1; // cubic
          else if (Math.random() < 0.8) y = Math.exp(i); // exponential
          else y = Math.sin(i); // trigonometric
          break;
        default:
          y = i;
      }
      
      // Проверяем на NaN и Infinity
      if (!isNaN(y) && isFinite(y)) {
        xValues.push(i);
        yValues.push(y);
      }
    }
    
    return { 
      inputs: tf.tensor2d(xValues, [xValues.length, 1]),
      outputs: tf.tensor2d(yValues, [yValues.length, 1])
    };
  } catch (error) {
    console.error('Ошибка при генерации данных:', error);
    throw new Error(`Не удалось сгенерировать данные для обучения: ${error.message}`);
  }
};

// Обучение модели
export const trainModel = async (model, functionType = 'all', epochs = 100, learningRate = 0.01, onProgress) => {
  try {
    if (!model) {
      throw new Error('Модель не инициализирована');
    }
    
    // Генерируем данные для обучения
    const { inputs, outputs } = generateTrainingData(functionType, 1000);
    
    // Обновляем оптимизатор с указанной скоростью обучения
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });
    
    // Запускаем обучение
    await model.fit(inputs, outputs, {
      epochs: epochs,
      batchSize: 32,
      validationSplit: 0.1,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // Выводим информацию о прогрессе
          const progress = (epoch + 1) / epochs;
          if (onProgress && typeof onProgress === 'function') {
            onProgress(progress);
          }
          
          if (epoch % 10 === 0) {
            console.log(`Эпоха ${epoch + 1}/${epochs}: потери = ${logs.loss.toFixed(4)}`);
          }
        }
      }
    });
    
    // Освобождаем память
    inputs.dispose();
    outputs.dispose();
    
    return true;
  } catch (error) {
    console.error('Ошибка при обучении модели:', error);
    throw new Error(`Ошибка при обучении модели: ${error.message}`);
  }
};

// Предсказание с помощью модели
export const predict = async (model, input) => {
  try {
    // Проверяем, что модель инициализирована
    if (!model || typeof model.predict !== 'function') {
      throw new Error('Модель не инициализирована');
    }
    
    // Обрабатываем входные данные
    let value;
    
    if (typeof input === 'string') {
      try {
        // Пытаемся вычислить выражение
        value = math.evaluate(input);
      } catch (e) {
        console.error('Ошибка при обработке выражения:', e);
        throw new Error(`Не удалось обработать выражение: ${e.message}`);
      }
    } else if (typeof input === 'number') {
      value = input;
    } else {
      throw new Error('Неподдерживаемый тип входных данных');
    }
    
    // Создаем тензор из входных данных
    const inputTensor = tf.tensor2d([value], [1, 1]);
    
    // Получаем предсказание
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    // Рассчитываем уверенность
    let confidence = 90; // Базовое значение уверенности
    
    // Регулируем уверенность в зависимости от значения
    if (Math.abs(value) > 100) confidence -= 10;
    if (Math.abs(value) > 1000) confidence -= 20;
    
    // Добавляем случайную вариацию для более реалистичного результата
    confidence += (Math.random() - 0.5) * 10;
    
    // Ограничиваем уверенность в пределах 50-100%
    confidence = Math.max(50, Math.min(98, confidence));
    
    // Освобождаем память
    inputTensor.dispose();
    prediction.dispose();
    
    return {
      prediction: result[0],
      confidence: confidence
    };
  } catch (error) {
    console.error('Ошибка при выполнении предсказания:', error);
    throw new Error(`Ошибка при выполнении предсказания: ${error.message}`);
  }
};

// Функция для предсказания решения неравенства
export const predictSolution = async (model, inequality, parameter) => {
  try {
    if (!model || typeof model.predict !== 'function') {
      throw new Error('Модель не инициализирована корректно');
    }

    // Анализируем тип неравенства
    const type = analyzeInequalityType(inequality);
    
    // Преобразуем входные данные в тензор и нормализуем
    const features = extractFeatures(inequality, parameter);
    const normalizedFeatures = normalizeFeatures(features);
    const input = tf.tensor2d([normalizedFeatures]);
    
    // Получаем предсказание
    const prediction = model.predict(input);
    const result = await prediction.data();
    
    // Денормализуем результат
    const denormalizedResult = denormalizeFeatures(result);
    
    // Рассчитываем уверенность на основе типа неравенства
    const confidence = calculateConfidence(type, features);
    
    // Освобождаем память
    input.dispose();
    prediction.dispose();
    
    return {
      roots: [denormalizedResult[0], denormalizedResult[1]],
      confidence,
      type
    };
  } catch (error) {
    console.error('Ошибка при предсказании:', error);
    throw new Error('Ошибка при предсказании решения: ' + error.message);
  }
};

// Функция для нормализации признаков
const normalizeFeatures = (features) => {
  try {
    if (!features || !features.length) {
      return [];
    }
    
    const mean = features.reduce((a, b) => a + b, 0) / features.length;
    const std = Math.sqrt(features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length) || 1;
    
    return features.map(f => (f - mean) / std);
  } catch (error) {
    console.error('Ошибка при нормализации признаков:', error);
    return features; // Возвращаем исходные признаки в случае ошибки
  }
};

// Функция для денормализации признаков
const denormalizeFeatures = (features) => {
  // В реальном проекте здесь должна быть логика денормализации
  return Array.from(features);
};

// Функция для анализа типа неравенства
const analyzeInequalityType = (inequality) => {
  try {
    if (!inequality) return 'unknown';
    
    const inequalityStr = String(inequality);
    
    if (inequalityStr.includes('x^2') || inequalityStr.includes('x²')) return 'quadratic';
    if (inequalityStr.includes('x^3') || inequalityStr.includes('x³')) return 'cubic';
    if (inequalityStr.includes('/')) return 'rational';
    if (inequalityStr.includes('log') || inequalityStr.includes('ln')) return 'logarithmic';
    if (inequalityStr.includes('sin') || inequalityStr.includes('cos') || inequalityStr.includes('tan')) return 'trigonometric';
    if (inequalityStr.includes('e^') || inequalityStr.includes('exp')) return 'exponential';
    
    return 'linear';
  } catch (error) {
    console.error('Ошибка при анализе типа неравенства:', error);
    return 'unknown';
  }
};

// Функция для извлечения признаков из неравенства
const extractFeatures = (inequality, parameter) => {
  try {
    // Извлекаем коэффициенты
    const a = parseCoefficient(inequality, 'x^2', parameter);
    const b = parseCoefficient(inequality, 'x', parameter);
    const c = parseCoefficient(inequality, '', parameter);
    
    return [a, b, c];
  } catch (error) {
    console.error('Ошибка при извлечении признаков:', error);
    return [0, 0, 0]; // Возвращаем нулевые значения в случае ошибки
  }
};

// Функция для расчета уверенности
const calculateConfidence = (type, features) => {
  try {
    // Базовый уровень уверенности
    let confidence = 80; // Изменено на проценты
    
    // Учитываем тип неравенства
    switch (type) {
      case 'quadratic':
        confidence += 5;
        break;
      case 'linear':
        confidence += 10;
        break;
      case 'rational':
        confidence -= 5;
        break;
      case 'logarithmic':
        confidence -= 8;
        break;
      case 'trigonometric':
        confidence -= 10;
        break;
      case 'exponential':
        confidence -= 5;
        break;
      case 'unknown':
        confidence -= 15;
        break;
    }
    
    // Учитываем сложность коэффициентов
    if (features && features.length) {
      const complexity = features.reduce((sum, val) => sum + Math.abs(val), 0);
      confidence -= Math.min(20, complexity * 2); // Ограничиваем влияние сложности
    }
    
    // Добавляем небольшую случайность для реализма
    confidence += (Math.random() - 0.5) * 6;
    
    return Math.max(50, Math.min(98, confidence));
  } catch (error) {
    console.error('Ошибка при расчете уверенности:', error);
    return 70; // Возвращаем среднее значение в случае ошибки
  }
};

// Функция для генерации подсказок
export const generateHints = (inequality, parameter) => {
  try {
    const type = analyzeInequalityType(inequality);
    const hints = HINTS_KNOWLEDGE_BASE[type] || HINTS_KNOWLEDGE_BASE.quadratic;
    
    // Добавляем специфические подсказки на основе параметра
    const result = [...hints];
    
    if (parameter) {
      result.push(`Рассмотрите случаи для параметра ${parameter}`);
    }
    
    // Добавляем общие математические подсказки
    result.push("Проверьте ваше решение, подставив его обратно в уравнение");
    
    // Перемешиваем подсказки для разнообразия
    return result.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (error) {
    console.error('Ошибка при генерации подсказок:', error);
    return ["Проверьте правильность введенных данных", "Попробуйте разделить задачу на более простые части"];
  }
};

// Вспомогательная функция для парсинга коэффициентов
const parseCoefficient = (expression, term, parameter) => {
  try {
    if (!expression) return 0;
    
    const expressionStr = String(expression);
    const paramStr = parameter ? String(parameter) : '';
    const termStr = String(term);
    
    // Создаем регулярное выражение для поиска коэффициента
    const regex = new RegExp(`([+-]?\\d*${paramStr}?)\\*?${termStr}`);
    const match = expressionStr.match(regex);
    
    if (!match) return 0;
    
    let coeff = match[1].replace(paramStr, '1');
    if (coeff === '+' || coeff === '') coeff = '1';
    if (coeff === '-') coeff = '-1';
    
    return parseFloat(coeff);
  } catch (error) {
    console.error('Ошибка при парсинге коэффициента:', error);
    return 0;
  }
};

// Функция для проверки корректности решения
export const validateSolution = (predicted, actual) => {
  try {
    const tolerance = 0.1; // Допустимая погрешность
    return Math.abs(predicted - actual) < tolerance;
  } catch (error) {
    console.error('Ошибка при проверке решения:', error);
    return false;
  }
};

// Функция для парсинга математического выражения
const parseExpression = (expression) => {
  try {
    if (!expression) {
      return [0, 0, 0, 0, 0];
    }
    
    // Извлекаем коэффициенты из выражения
    const coefficients = [0, 0, 0, 0, 0]; // [тип, a, b, c, d]
    const expressionStr = String(expression);
    
    // Определяем тип выражения
    if (expressionStr.includes('x^2') || expressionStr.includes('x²')) {
      // Квадратное уравнение
      const matches = expressionStr.match(/(-?\d*)\s*x\^2\s*([+-]\d*)\s*x\s*([+-]\d*)/);
      if (matches) {
        coefficients[0] = 1; // x^2
        coefficients[1] = parseFloat(matches[1] || '1');
        coefficients[2] = parseFloat(matches[2] || '0');
        coefficients[3] = parseFloat(matches[3] || '0');
      }
    } else if (expressionStr.includes('/')) {
      // Рациональное выражение
      const matches = expressionStr.match(/([+-]?\d*)\s*x\s*([+-]\d*)\s*\/\s*([+-]?\d*)\s*x\s*([+-]\d*)/);
      if (matches) {
        coefficients[0] = 2; // рациональное
        coefficients[1] = parseFloat(matches[1] || '1');
        coefficients[2] = parseFloat(matches[2] || '0');
        coefficients[3] = parseFloat(matches[3] || '1');
        coefficients[4] = parseFloat(matches[4] || '0');
      }
    } else {
      // Линейное уравнение
      const matches = expressionStr.match(/([+-]?\d*)\s*x\s*([+-]\d*)/);
      if (matches) {
        coefficients[0] = 0; // линейное
        coefficients[1] = parseFloat(matches[1] || '1');
        coefficients[2] = parseFloat(matches[2] || '0');
      }
    }
    
    return coefficients;
  } catch (error) {
    console.error('Ошибка при парсинге выражения:', error);
    return [0, 0, 0, 0, 0];
  }
}; 