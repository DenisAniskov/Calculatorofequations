import * as tf from '@tensorflow/tfjs';

/**
 * Создает оптимизированную модель нейронной сети для математических вычислений
 * Использует квантизацию весов и оптимизированную архитектуру для снижения потребления памяти
 * @param {Array} inputShape - Форма входных данных
 * @returns {tf.LayersModel} Оптимизированная модель
 */
export const createOptimizedModel = (inputShape = [5]) => {
  // Используем Sequential API для создания последовательной модели
  const model = tf.sequential();
  
  // Входной слой с L2-регуляризацией для предотвращения переобучения
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    inputShape: inputShape,
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    // Используем ограниченную точность для весов
    dtype: 'float16'
  }));
  
  // Добавляем слой нормализации пакета для улучшения обучения
  model.add(tf.layers.batchNormalization());
  
  // Скрытый слой с меньшим количеством нейронов
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    dtype: 'float16'
  }));
  
  // Добавляем Dropout для предотвращения переобучения
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Выходной слой
  model.add(tf.layers.dense({
    units: 1,
    activation: 'linear'
  }));
  
  // Оптимизированный компилятор
  const optimizer = tf.train.adam(0.001);
  
  // Компилируем модель
  model.compile({
    optimizer: optimizer,
    loss: 'meanSquaredError',
    metrics: ['mse']
  });
  
  return model;
};

/**
 * Обучает модель с использованием техник эффективного обучения
 * @param {tf.LayersModel} model - Модель для обучения
 * @param {Array} features - Массив признаков
 * @param {Array} labels - Массив целевых значений
 * @param {Object} options - Параметры обучения
 * @returns {Promise<tf.History>} История обучения
 */
export const trainOptimizedModel = async (model, features, labels, options = {}) => {
  const {
    epochs = 50,
    batchSize = 32,
    validationSplit = 0.2,
    callbacks = {},
    earlyStopping = true
  } = options;
  
  // Преобразуем данные в тензоры
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels);
  
  // Настраиваем колбэки
  const trainCallbacks = [];
  
  // Добавляем раннюю остановку при отсутствии улучшений
  if (earlyStopping) {
    trainCallbacks.push(tf.callbacks.earlyStopping({
      monitor: 'val_loss',
      patience: 5,
      minDelta: 0.001,
      mode: 'min',
      verbose: 1
    }));
  }
  
  // Добавляем пользовательские колбэки
  if (callbacks.onBatchEnd) {
    trainCallbacks.push({
      onBatchEnd: callbacks.onBatchEnd
    });
  }
  
  if (callbacks.onEpochEnd) {
    trainCallbacks.push({
      onEpochEnd: callbacks.onEpochEnd
    });
  }
  
  // Обучаем модель
  try {
    const history = await model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      shuffle: true,
      callbacks: trainCallbacks
    });
    
    // Освобождаем ресурсы
    xs.dispose();
    ys.dispose();
    
    return history;
  } catch (error) {
    console.error('Ошибка при обучении оптимизированной модели:', error);
    // Освобождаем ресурсы в случае ошибки
    xs.dispose();
    ys.dispose();
    throw error;
  }
};

/**
 * Выполняет предсказание с использованием модели
 * @param {tf.LayersModel} model - Обученная модель
 * @param {Array} features - Признаки для предсказания
 * @returns {Promise<number>} Результат предсказания
 */
export const predictWithOptimizedModel = async (model, features) => {
  try {
    // Преобразуем данные в тензор
    const input = tf.tensor2d([features]);
    
    // Получаем предсказание
    const prediction = model.predict(input);
    
    // Получаем скалярное значение из тензора
    const result = prediction.dataSync()[0];
    
    // Освобождаем ресурсы
    input.dispose();
    prediction.dispose();
    
    return result;
  } catch (error) {
    console.error('Ошибка при предсказании:', error);
    return null;
  }
};

/**
 * Сохраняет модель в IndexedDB с оптимизацией размера
 * @param {tf.LayersModel} model - Модель для сохранения
 * @param {string} modelName - Имя модели для сохранения
 * @returns {Promise<boolean>} Результат сохранения
 */
export const saveOptimizedModel = async (model, modelName) => {
  try {
    // Применяем квантизацию весов перед сохранением
    const quantizedModel = await tf.browser.toPixels(model);
    
    // Сохраняем модель
    await model.save(`indexeddb://${modelName}`);
    
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении модели:', error);
    return false;
  }
};

/**
 * Загружает модель из IndexedDB
 * @param {string} modelName - Имя модели для загрузки
 * @returns {Promise<tf.LayersModel|null>} Загруженная модель
 */
export const loadOptimizedModel = async (modelName) => {
  try {
    // Загружаем модель
    const model = await tf.loadLayersModel(`indexeddb://${modelName}`);
    return model;
  } catch (error) {
    console.log('Модель не найдена в IndexedDB:', error);
    return null;
  }
};

/**
 * Оценивает качество модели на тестовых данных
 * @param {tf.LayersModel} model - Обученная модель
 * @param {Array} testFeatures - Тестовые признаки
 * @param {Array} testLabels - Тестовые метки
 * @returns {Object} Метрики качества модели
 */
export const evaluateModel = async (model, testFeatures, testLabels) => {
  try {
    // Преобразуем данные в тензоры
    const xsTest = tf.tensor2d(testFeatures);
    const ysTest = tf.tensor2d(testLabels);
    
    // Оцениваем модель
    const evaluation = await model.evaluate(xsTest, ysTest);
    
    // Получаем значения метрик
    const loss = evaluation[0].dataSync()[0];
    const mse = evaluation[1].dataSync()[0];
    
    // Рассчитываем среднюю абсолютную ошибку
    const predictions = model.predict(xsTest);
    const predictionValues = predictions.dataSync();
    const labelValues = ysTest.dataSync();
    
    let sumAbsError = 0;
    for (let i = 0; i < predictionValues.length; i++) {
      sumAbsError += Math.abs(predictionValues[i] - labelValues[i]);
    }
    const mae = sumAbsError / predictionValues.length;
    
    // Освобождаем ресурсы
    xsTest.dispose();
    ysTest.dispose();
    predictions.dispose();
    evaluation.forEach(tensor => tensor.dispose());
    
    return {
      loss,
      mse,
      mae,
      rmse: Math.sqrt(mse)
    };
  } catch (error) {
    console.error('Ошибка при оценке модели:', error);
    return {
      loss: null,
      mse: null,
      mae: null,
      rmse: null
    };
  }
};

/**
 * Генерирует синтетические данные для обучения модели математическим выражениям
 * @param {number} numSamples - Количество примеров
 * @param {Function} expressionFunc - Функция, генерирующая выражение
 * @returns {Object} Объект с признаками и метками
 */
export const generateSyntheticData = (numSamples, expressionFunc) => {
  const features = [];
  const labels = [];
  
  for (let i = 0; i < numSamples; i++) {
    const { feature, label } = expressionFunc();
    features.push(feature);
    labels.push([label]);
  }
  
  return { features, labels };
};

/**
 * Выполняет предварительную обработку данных для улучшения производительности модели
 * @param {Array} features - Массив признаков
 * @param {Array} labels - Массив меток
 * @returns {Object} Обработанные данные
 */
export const preprocessData = (features, labels) => {
  // Вычисляем статистики для нормализации
  const featureStats = calculateStats(features);
  const labelStats = calculateStats(labels.map(l => l[0]));
  
  // Нормализуем признаки и метки
  const normalizedFeatures = features.map(feature => 
    feature.map((value, index) => (value - featureStats.means[index]) / (featureStats.stds[index] + 1e-6))
  );
  
  const normalizedLabels = labels.map(label => 
    [(label[0] - labelStats.means[0]) / (labelStats.stds[0] + 1e-6)]
  );
  
  return {
    features: normalizedFeatures,
    labels: normalizedLabels,
    featureStats,
    labelStats
  };
};

/**
 * Вычисляет статистики (среднее, стандартное отклонение) для массива данных
 * @param {Array} data - Массив данных
 * @returns {Object} Статистики данных
 */
const calculateStats = (data) => {
  const dims = Array.isArray(data[0]) ? data[0].length : 1;
  let means = Array(dims).fill(0);
  let variances = Array(dims).fill(0);
  
  // Вычисляем среднее
  for (const item of data) {
    if (Array.isArray(item)) {
      for (let i = 0; i < dims; i++) {
        means[i] += item[i] / data.length;
      }
    } else {
      means[0] += item / data.length;
    }
  }
  
  // Вычисляем дисперсию
  for (const item of data) {
    if (Array.isArray(item)) {
      for (let i = 0; i < dims; i++) {
        variances[i] += Math.pow(item[i] - means[i], 2) / data.length;
      }
    } else {
      variances[0] += Math.pow(item - means[0], 2) / data.length;
    }
  }
  
  // Вычисляем стандартное отклонение
  const stds = variances.map(v => Math.sqrt(v));
  
  return { means, stds };
}; 