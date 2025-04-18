import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import * as tf from '@tensorflow/tfjs';
import { createModel, trainModel, predict } from '../utils/neuralNetwork';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NeuralNetwork = ({ darkMode }) => {
  const [model, setModel] = useState(null);
  const [trainingData, setTrainingData] = useState([]);
  const [predictionData, setPredictionData] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.01);
  const [functionType, setFunctionType] = useState('linear');
  const [input, setInput] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация TensorFlow.js и модели
  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        // Инициализируем TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js initialized');
        
        // Создаем модель
        const newModel = await createModel();
        setModel(newModel);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing TensorFlow:', err);
        setError('Ошибка инициализации TensorFlow.js. Пожалуйста, обновите страницу.');
        setIsInitialized(false);
      }
    };

    initializeTensorFlow();

    // Очистка при размонтировании
    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, []);

  const generateTrainingData = () => {
    const data = [];
    for (let x = -10; x <= 10; x += 0.1) {
      let y;
      switch (functionType) {
        case 'linear':
          y = 2 * x + 1;
          break;
        case 'quadratic':
          y = x * x;
          break;
        case 'sine':
          y = Math.sin(x);
          break;
        case 'exponential':
          y = Math.exp(x / 5);
          break;
        default:
          y = x;
      }
      data.push({ x, y });
    }
    return data;
  };

  const handleTrain = async () => {
    if (!model || !isInitialized) {
      setError('Модель не инициализирована. Пожалуйста, подождите или обновите страницу.');
      return;
    }
    
    setIsTraining(true);
    setError(null);
    setTrainingProgress(0);
    setLossHistory([]);
    
    try {
      const data = generateTrainingData();
      setTrainingData(data);

      const result = await trainModel(model, functionType, epochs, learningRate, (progress, loss) => {
        setTrainingProgress(progress);
        setLossHistory(prev => [...prev, loss]);
      });

      if (result) {
        const predictions = data.map(point => ({
          x: point.x,
          y: predict(model, point.x)
        }));
        setPredictionData(predictions);
      }
    } catch (err) {
      console.error('Error training model:', err);
      setError('Ошибка при обучении модели. Пожалуйста, попробуйте снова.');
    } finally {
      setIsTraining(false);
    }
  };

  // Обработчик предсказания
  const handlePredict = async () => {
    if (!model || !isInitialized || !input) {
      setError('Модель не инициализирована или не введено значение. Пожалуйста, проверьте ввод.');
      return;
    }
    
    try {
      const result = await predict(model, input);
      setPrediction(result.prediction);
      setConfidence(result.confidence);
      setError(null);
    } catch (err) {
      console.error('Error making prediction:', err);
      setError('Ошибка при выполнении предсказания. Пожалуйста, проверьте введенные данные.');
    }
  };

  // Данные для графика
  const chartData = {
    labels: trainingData.map(d => d.x.toFixed(1)),
    datasets: [
      {
        label: 'Исходные данные',
        data: trainingData.map(d => d.y),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Предсказания',
        data: predictionData.map(d => d.y),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      }
    ]
  };

  // Настройки графика
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Обучение нейронной сети'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'x'
        }
      },
      y: {
        title: {
          display: true,
          text: 'y'
        }
      }
    }
  };

  const lossChartData = {
    labels: lossHistory.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Функция потерь',
        data: lossHistory,
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
      }
    ]
  };

  const lossChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'График функции потерь'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Loss'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Эпоха'
        }
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-8">
              Обучение нейронной сети
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                  Тип функции:
                </label>
                <select
                  value={functionType}
                  onChange={(e) => setFunctionType(e.target.value)}
                  className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="linear">Линейная</option>
                  <option value="quadratic">Квадратичная</option>
                  <option value="sine">Синус</option>
                  <option value="exponential">Экспоненциальная</option>
                </select>
              </div>

              <div>
                <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                  Количество эпох:
                </label>
                <input
                  type="number"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  min="1"
                  max="1000"
                  className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-gray-700 dark:text-gray-200 mb-3 text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
                  Скорость обучения:
                </label>
                <input
                  type="number"
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  min="0.0001"
                  max="1"
                  step="0.0001"
                  className={`w-full p-4 border-2 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <button
              onClick={handleTrain}
              disabled={isTraining}
              className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transform hover:scale-105 transition-all duration-200 mb-8 ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTraining ? `Обучение... ${trainingProgress}%` : 'Начать обучение'}
            </button>

            {isTraining && (
              <div className="mb-8">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  Прогресс обучения: {trainingProgress}%
                </p>
              </div>
            )}

            {trainingData.length > 0 && (
              <div className="space-y-8">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform hover:scale-[1.01] transition-all duration-300">
                  <Line data={chartData} options={chartOptions} />
                </div>

                {lossHistory.length > 0 && (
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform hover:scale-[1.01] transition-all duration-300">
                    <Line data={lossChartData} options={lossChartOptions} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralNetwork; 