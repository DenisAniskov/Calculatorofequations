import * as tf from '@tensorflow/tfjs';

/**
 * Класс для работы с локальной моделью машинного обучения
 */
class InequalityModel {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
  }

  /**
   * Инициализация модели
   */
  async initialize() {
    try {
      // Создаем простую модель для классификации типа неравенства
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 4, activation: 'softmax' })
        ]
      });

      // Компилируем модель
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      console.log('Модель успешно инициализирована');
    } catch (error) {
      console.error('Ошибка при инициализации модели:', error);
      throw error;
    }
  }

  /**
   * Преобразование неравенства в числовой вектор
   * @param {string} inequality - Строка с неравенством
   * @returns {tf.Tensor} - Тензор с признаками
   */
  preprocessInequality(inequality) {
    // Извлекаем числовые признаки из неравенства
    const features = new Array(10).fill(0);
    
    // Признак 0: наличие x²
    features[0] = inequality.includes('x²') ? 1 : 0;
    
    // Признак 1: наличие дробей
    features[1] = inequality.includes('/') ? 1 : 0;
    
    // Признак 2: количество переменных x
    features[2] = (inequality.match(/x/g) || []).length;
    
    // Признак 3: наличие параметров
    features[3] = inequality.match(/[a-zA-Z]/g)?.length || 0;
    
    // Признак 4: тип оператора (>, <, >=, <=)
    const operators = {
      '>': 1,
      '<': 2,
      '>=': 3,
      '<=': 4
    };
    for (const [op, value] of Object.entries(operators)) {
      if (inequality.includes(op)) {
        features[4] = value;
        break;
      }
    }
    
    // Признак 5: количество скобок
    features[5] = (inequality.match(/[()]/g) || []).length;
    
    // Признак 6: наличие степеней
    features[6] = inequality.includes('^') ? 1 : 0;
    
    // Признак 7: длина неравенства
    features[7] = inequality.length;
    
    // Признак 8: количество операторов
    features[8] = (inequality.match(/[+\-*/]/g) || []).length;
    
    // Признак 9: наличие модуля
    features[9] = inequality.includes('|') ? 1 : 0;

    return tf.tensor2d([features]);
  }

  /**
   * Предсказание типа неравенства
   * @param {string} inequality - Строка с неравенством
   * @returns {Object} - Результат предсказания
   */
  async predict(inequality) {
    if (!this.isModelLoaded) {
      await this.initialize();
    }

    try {
      const features = this.preprocessInequality(inequality);
      const prediction = await this.model.predict(features).array();
      
      // Типы неравенств
      const types = ['linear', 'quadratic', 'rational', 'other'];
      
      // Находим наиболее вероятный тип
      const maxIndex = prediction[0].indexOf(Math.max(...prediction[0]));
      const confidence = prediction[0][maxIndex];

      return {
        type: types[maxIndex],
        confidence: confidence,
        probabilities: types.reduce((acc, type, index) => {
          acc[type] = prediction[0][index];
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Ошибка при предсказании:', error);
      throw error;
    }
  }

  /**
   * Обучение модели на новых данных
   * @param {Array} trainingData - Массив примеров для обучения
   */
  async train(trainingData) {
    if (!this.isModelLoaded) {
      await this.initialize();
    }

    try {
      const xs = tf.concat(trainingData.map(d => this.preprocessInequality(d.inequality)));
      const ys = tf.tensor2d(trainingData.map(d => d.label));

      await this.model.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Эпоха ${epoch + 1}: точность = ${logs.acc}`);
          }
        }
      });

      console.log('Модель успешно обучена');
    } catch (error) {
      console.error('Ошибка при обучении модели:', error);
      throw error;
    }
  }
}

// Создаем и экспортируем единственный экземпляр модели
export const inequalityModel = new InequalityModel(); 