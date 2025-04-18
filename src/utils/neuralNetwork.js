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
  ]
};

// Создание модели нейронной сети
export const createModel = () => {
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
};

// Генерация тренировочных данных
const generateTrainingData = (functionType, numPoints = 100) => {
  const data = [];
  const xValues = [];
  
  for (let i = -10; i <= 10; i += 20 / numPoints) {
    let y;
    switch (functionType) {
      case 'linear':
        y = 2 * i + 1;
        break;
      case 'quadratic':
        y = i * i + 2 * i + 1;
        break;
      case 'rational':
        y = i !== 0 ? 1 / i : 0;
        break;
      default:
        y = i;
    }
    
    xValues.push(i);
    data.push(y);
  }
  
  return { xValues, data };
};

// Обучение модели
export const trainModel = async (model, epochs = 100) => {
  try {
    // Генерируем тренировочные данные
    const numSamples = 1000;
    const xs = tf.randomUniform([numSamples, 1], -10, 10);
    const ys = xs.mul(xs); // Для квадратичной функции

    // Обучаем модель
    await model.fit(xs, ys, {
      epochs: epochs,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
          }
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Error training model:', error);
    throw new Error(`Ошибка при обучении модели: ${error.message}`);
  }
};

// Предсказание с помощью модели
export const predict = async (model, expression) => {
  try {
    // Преобразуем строку выражения в число для предсказания
    let value;
    try {
      if (typeof expression === 'string') {
        // Извлекаем коэффициенты из выражения
        const coefficients = parseExpression(expression);
        // Нормализуем коэффициенты
        const normalizedCoefficients = normalizeFeatures(coefficients);
        // Создаем тензор из нормализованных коэффициентов
        const inputTensor = tf.tensor2d([normalizedCoefficients]);
        // Получаем предсказание
        const prediction = await model.predict(inputTensor);
        // Преобразуем результат в число
        value = prediction.dataSync()[0];
        // Освобождаем память
        inputTensor.dispose();
        prediction.dispose();
      } else {
        value = expression;
      }
    } catch (e) {
      console.error('Ошибка при обработке выражения:', e);
      value = 0;
    }

    // Рассчитываем уверенность на основе типа выражения
    const confidence = calculateConfidence(expression, value);

    return {
      prediction: value,
      confidence: confidence
    };
  } catch (error) {
    console.error('Error making prediction:', error);
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
  const mean = features.reduce((a, b) => a + b, 0) / features.length;
  const std = Math.sqrt(features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length);
  return features.map(f => (f - mean) / (std || 1));
};

// Функция для денормализации признаков
const denormalizeFeatures = (features) => {
  // Здесь должна быть логика денормализации, соответствующая нормализации
  return features;
};

// Функция для анализа типа неравенства
const analyzeInequalityType = (inequality) => {
  if (inequality.includes('x^2')) return 'quadratic';
  if (inequality.includes('/')) return 'rational';
  return 'linear';
};

// Функция для извлечения признаков из неравенства
const extractFeatures = (inequality, parameter) => {
  // Извлекаем коэффициенты
  const a = parseCoefficient(inequality, 'x^2', parameter);
  const b = parseCoefficient(inequality, 'x', parameter);
  const c = parseCoefficient(inequality, '', parameter);
  
  return [a, b, c];
};

// Функция для расчета уверенности
const calculateConfidence = (type, features) => {
  // Базовый уровень уверенности
  let confidence = 0.8;
  
  // Учитываем тип неравенства
  if (type === 'quadratic') confidence += 0.1;
  if (type === 'linear') confidence += 0.15;
  
  // Учитываем сложность коэффициентов
  const complexity = features.reduce((sum, val) => sum + Math.abs(val), 0);
  confidence -= complexity * 0.05;
  
  return Math.max(0.5, Math.min(0.95, confidence));
};

// Функция для генерации подсказок
export const generateHints = (inequality, parameter) => {
  const type = analyzeInequalityType(inequality);
  const hints = HINTS_KNOWLEDGE_BASE[type] || HINTS_KNOWLEDGE_BASE.quadratic;
  
  // Добавляем специфические подсказки на основе параметра
  if (parameter) {
    hints.push(`Рассмотрите случаи для параметра ${parameter}`);
  }
  
  return hints;
};

// Вспомогательная функция для парсинга коэффициентов
const parseCoefficient = (expression, term, parameter) => {
  const regex = new RegExp(`([+-]?\\d*${parameter}?)\\*?${term}`);
  const match = expression.match(regex);
  if (!match) return 0;
  
  let coeff = match[1].replace(parameter, '1');
  if (coeff === '+' || coeff === '') coeff = '1';
  if (coeff === '-') coeff = '-1';
  
  return parseFloat(coeff);
};

// Функция для проверки корректности решения
export const validateSolution = (predicted, actual) => {
  const tolerance = 0.1;
  return Math.abs(predicted - actual) < tolerance;
};

// Функция для парсинга математического выражения
const parseExpression = (expression) => {
  // Извлекаем коэффициенты из выражения
  const coefficients = [0, 0, 0, 0, 0]; // [x, a, b, c, d]
  
  // Определяем тип выражения
  if (expression.includes('x^2')) {
    // Квадратное уравнение
    const matches = expression.match(/(-?\d*)\s*x\^2\s*([+-]\d*)\s*x\s*([+-]\d*)/);
    if (matches) {
      coefficients[0] = 1; // x^2
      coefficients[1] = parseFloat(matches[1] || '1');
      coefficients[2] = parseFloat(matches[2] || '0');
      coefficients[3] = parseFloat(matches[3] || '0');
    }
  } else if (expression.includes('/')) {
    // Рациональное выражение
    const matches = expression.match(/([+-]?\d*)\s*x\s*([+-]\d*)\s*\/\s*([+-]?\d*)\s*x\s*([+-]\d*)/);
    if (matches) {
      coefficients[0] = 2; // рациональное
      coefficients[1] = parseFloat(matches[1] || '1');
      coefficients[2] = parseFloat(matches[2] || '0');
      coefficients[3] = parseFloat(matches[3] || '1');
      coefficients[4] = parseFloat(matches[4] || '0');
    }
  } else {
    // Линейное уравнение
    const matches = expression.match(/([+-]?\d*)\s*x\s*([+-]\d*)/);
    if (matches) {
      coefficients[0] = 0; // линейное
      coefficients[1] = parseFloat(matches[1] || '1');
      coefficients[2] = parseFloat(matches[2] || '0');
    }
  }
  
  return coefficients;
}; 