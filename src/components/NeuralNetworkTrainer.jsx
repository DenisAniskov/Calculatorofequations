import React, { useState, useEffect } from 'react';
import { createModel, trainModel } from '../utils/neuralNetwork';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NeuralNetworkTrainer = ({ onModelTrained }) => {
  const [model, setModel] = useState(null);
  const [trainingData, setTrainingData] = useState([]);
  const [dataType, setDataType] = useState('quadratic');
  const [numPoints, setNumPoints] = useState(100);
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.01);
  const [batchSize, setBatchSize] = useState(32);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    setModel(createModel());
    generateData();
  }, [dataType, numPoints, noiseLevel]);

  const generateData = () => {
    const data = [];
    const xValues = Array.from({ length: numPoints }, (_, i) => 
      -5 + (i * 10) / (numPoints - 1)
    );

    xValues.forEach(x => {
      let y;
      switch (dataType) {
        case 'quadratic':
          y = x * x;
          break;
        case 'linear':
          y = 2 * x + 1;
          break;
        case 'sine':
          y = Math.sin(x);
          break;
        case 'exponential':
          y = Math.exp(x / 2);
          break;
        case 'logarithmic':
          y = Math.log(Math.abs(x) + 1) * Math.sign(x);
          break;
        default:
          y = x * x;
      }

      // Добавляем шум
      y += (Math.random() - 0.5) * noiseLevel * 2;
      data.push({ x, y });
    });

    setTrainingData(data);
    setResults(null);
    setError('');
  };

  const handleTrain = async () => {
    if (!model) {
      setError('Модель не инициализирована');
      return;
    }

    if (trainingData.length === 0) {
      setError('Нет данных для обучения');
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      const updatedModel = await trainModel(
        model,
        trainingData,
        epochs,
        learningRate,
        batchSize,
        (currentEpoch) => {
          setProgress((currentEpoch / epochs) * 100);
        }
      );

      setModel(updatedModel);
      onModelTrained(updatedModel);
      setSuccess('Модель успешно обучена!');

      // Оцениваем результаты
      const predictions = trainingData.map(point => ({
        x: point.x,
        y: updatedModel.forward(point.x)
      }));

      setResults({
        predictions,
        mse: calculateMSE(predictions, trainingData),
        rmse: calculateRMSE(predictions, trainingData)
      });
    } catch (err) {
      setError('Ошибка при обучении: ' + err.message);
    } finally {
      setIsTraining(false);
    }
  };

  const calculateMSE = (predictions, actual) => {
    return predictions.reduce((sum, pred, i) => 
      sum + Math.pow(pred.y - actual[i].y, 2), 0) / predictions.length;
  };

  const calculateRMSE = (predictions, actual) => {
    return Math.sqrt(calculateMSE(predictions, actual));
  };

  const handleReset = () => {
    setModel(createModel());
    generateData();
    setResults(null);
    setError('');
    setSuccess('');
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Результаты обучения нейронной сети'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const chartData = {
    labels: trainingData.map(point => point.x.toFixed(2)),
    datasets: [
      {
        label: 'Исходные данные',
        data: trainingData.map(point => point.y),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      ...(results ? [{
        label: 'Предсказания',
        data: results.predictions.map(point => point.y),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }] : [])
    ]
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Обучение нейронной сети</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Тип данных
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="quadratic">Квадратичная функция</option>
              <option value="linear">Линейная функция</option>
              <option value="sine">Синусоида</option>
              <option value="exponential">Экспонента</option>
              <option value="logarithmic">Логарифм</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Количество точек: {numPoints}
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              value={numPoints}
              onChange={(e) => setNumPoints(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Уровень шума: {noiseLevel.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Количество эпох: {epochs}
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Скорость обучения: {learningRate.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={learningRate}
              onChange={(e) => setLearningRate(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Размер батча: {batchSize}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleTrain}
          disabled={isTraining}
          className="btn btn-primary"
        >
          {isTraining ? 'Обучение...' : 'Обучить'}
        </button>
        <button
          onClick={handleReset}
          disabled={isTraining}
          className="btn btn-secondary"
        >
          Сбросить
        </button>
      </div>

      {isTraining && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Прогресс: {Math.round(progress)}%
          </p>
        </div>
      )}

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-500 mb-4">
          {success}
        </div>
      )}

      {results && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Результаты:</h3>
          <p>Среднеквадратичная ошибка (MSE): {results.mse.toFixed(6)}</p>
          <p>Корень среднеквадратичной ошибки (RMSE): {results.rmse.toFixed(6)}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow">
        <Line options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default NeuralNetworkTrainer; 