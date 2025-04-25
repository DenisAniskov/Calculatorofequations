import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { generateVisualizationData } from '../utils/equationUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EquationVisualizer = ({ 
  type, 
  parameters, 
  darkMode, 
  roots = [], 
  animate = true,
  showRoots = true,
  showDerivative = false 
}) => {
  const { a, b, c, d, p } = parameters;
  const [progress, setProgress] = useState(0);
  const [dataPoints, setDataPoints] = useState([]);
  const [visibleDataPoints, setVisibleDataPoints] = useState([]);
  const animationRef = useRef(null);
  
  // Генерация данных для визуализации
  useEffect(() => {
    const points = generateVisualizationData(type, a, b, c, d, p);
    setDataPoints(points);
    
    if (animate) {
      setProgress(0);
      setVisibleDataPoints([]);
    } else {
      setVisibleDataPoints(points);
    }
  }, [type, a, b, c, d, p, animate]);
  
  // Обработка анимации
  useEffect(() => {
    if (!animate || dataPoints.length === 0) return;
    
    // Сбрасываем предыдущую анимацию
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    let animationProgress = 0;
    const animationDuration = 1500; // ms
    const startTime = performance.now();
    
    const animateGraph = (timestamp) => {
      const elapsed = timestamp - startTime;
      animationProgress = Math.min(elapsed / animationDuration, 1);
      setProgress(animationProgress);
      
      const pointsToShow = Math.floor(dataPoints.length * animationProgress);
      setVisibleDataPoints(dataPoints.slice(0, pointsToShow));
      
      if (animationProgress < 1) {
        animationRef.current = requestAnimationFrame(animateGraph);
      }
    };
    
    animationRef.current = requestAnimationFrame(animateGraph);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dataPoints, animate]);
  
  // Нет данных для отображения
  if (visibleDataPoints.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg`}>
        <div className="text-gray-500 dark:text-gray-400">Загрузка графика...</div>
      </div>
    );
  }
  
  // Подготовка данных для графика
  const chartData = {
    labels: visibleDataPoints.map(point => point.x),
    datasets: [
      {
        label: 'График функции',
        data: visibleDataPoints.map(point => point.y),
        borderColor: darkMode ? 'rgba(79, 209, 197, 1)' : 'rgba(53, 162, 235, 1)',
        backgroundColor: darkMode ? 'rgba(79, 209, 197, 0.1)' : 'rgba(53, 162, 235, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      // Условно добавляем корни, если нужны
      ...(showRoots && roots.length ? [{
        label: 'Корни уравнения',
        data: roots.map(root => ({
          x: root,
          y: 0
        })),
        borderColor: darkMode ? 'rgba(255, 99, 132, 1)' : 'rgba(255, 99, 132, 1)',
        backgroundColor: darkMode ? 'rgba(255, 99, 132, 1)' : 'rgba(255, 99, 132, 1)',
        borderWidth: 0,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'rectRot'
      }] : [])
    ]
  };
  
  // Настройки графика
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Отключаем анимацию обновления, так как мы делаем свою
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'x',
          color: darkMode ? '#e2e8f0' : '#1e293b',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#e2e8f0' : '#1e293b',
        }
      },
      y: {
        title: {
          display: true,
          text: 'y',
          color: darkMode ? '#e2e8f0' : '#1e293b',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#e2e8f0' : '#1e293b',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: darkMode ? '#e2e8f0' : '#1e293b',
        }
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          title: function(context) {
            return `x = ${parseFloat(context[0].label).toFixed(2)}`;
          },
          label: function(context) {
            return `y = ${context.parsed.y.toFixed(4)}`;
          }
        },
        backgroundColor: darkMode ? 'rgba(51, 65, 85, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#e2e8f0' : '#1e293b',
        bodyColor: darkMode ? '#e2e8f0' : '#1e293b',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1
      }
    }
  };
  
  return (
    <div className="relative">
      <div className="h-64 sm:h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      {/* Индикатор загрузки */}
      {animate && progress < 1 && (
        <div className="absolute bottom-0 left-0 right-0">
          <div 
            className="h-1 bg-blue-500 dark:bg-blue-400 transition-all duration-200 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default EquationVisualizer; 