import React, { useEffect, useRef, useState } from 'react';
import * as math from 'mathjs';

const ParametricVisualization = ({ expression, parameter, darkMode }) => {
  const canvasRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [xRange, setXRange] = useState({ min: -10, max: 10 });
  const [paramRange, setParamRange] = useState({ min: -5, max: 5 });
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Функция для преобразования координат из математических в координаты канваса
  const transformCoords = (x, y) => {
    const xScale = width / (xRange.max - xRange.min);
    const yScale = height / (paramRange.max - paramRange.min);
    
    const canvasX = (x - xRange.min) * xScale;
    const canvasY = height - (y - paramRange.min) * yScale;
    
    return { x: canvasX, y: canvasY };
  };

  // Функция для вычисления значения выражения при заданном x и значении параметра
  const evaluateExpression = (x, paramValue) => {
    try {
      // Заменяем параметр его значением и x значением
      const replacedExpr = expression
        .replace(new RegExp(parameter, 'g'), `(${paramValue})`)
        .replace(/x/g, `(${x})`);
      
      return math.evaluate(replacedExpr);
    } catch (error) {
      console.error('Ошибка при вычислении выражения:', error);
      return null;
    }
  };

  // Функция для определения цвета точки в зависимости от значения выражения
  const getPointColor = (value, isDarkMode) => {
    if (value === null) return isDarkMode ? '#555' : '#ddd';
    
    if (Math.abs(value) < 0.01) {
      // Точка решения
      return '#FF5733';
    } else if (value > 0) {
      // Положительное значение
      return isDarkMode ? '#4CAF50' : '#2E7D32';
    } else {
      // Отрицательное значение
      return isDarkMode ? '#F44336' : '#C62828';
    }
  };

  // Функция для отрисовки визуализации
  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    // Настраиваем размеры канваса
    canvas.width = width;
    canvas.height = height;
    
    // Устанавливаем фон
    ctx.fillStyle = darkMode ? '#1f2937' : '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    setIsDrawing(true);
    
    try {
      // Отрисовываем сетку
      ctx.strokeStyle = darkMode ? '#4b5563' : '#d1d5db';
      ctx.lineWidth = 0.5;
      
      // Вертикальные линии сетки
      for (let x = Math.ceil(xRange.min); x <= xRange.max; x++) {
        const { x: canvasX } = transformCoords(x, 0);
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, height);
        ctx.stroke();
      }
      
      // Горизонтальные линии сетки
      for (let y = Math.ceil(paramRange.min); y <= paramRange.max; y++) {
        const { y: canvasY } = transformCoords(0, y);
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(width, canvasY);
        ctx.stroke();
      }
      
      // Отрисовываем оси
      ctx.strokeStyle = darkMode ? '#e5e7eb' : '#4b5563';
      ctx.lineWidth = 1.5;
      
      // Ось X
      const { y: xAxisY } = transformCoords(0, 0);
      ctx.beginPath();
      ctx.moveTo(0, xAxisY);
      ctx.lineTo(width, xAxisY);
      ctx.stroke();
      
      // Ось Y
      const { x: yAxisX } = transformCoords(0, 0);
      ctx.beginPath();
      ctx.moveTo(yAxisX, 0);
      ctx.lineTo(yAxisX, height);
      ctx.stroke();
      
      // Подписи осей
      ctx.fillStyle = darkMode ? '#e5e7eb' : '#1f2937';
      ctx.font = '14px Arial';
      ctx.fillText('x', width - 15, xAxisY - 10);
      ctx.fillText(parameter, yAxisX + 10, 15);
      
      // Отрисовываем значения выражения для различных x и значений параметра
      const resolution = 100;
      const xStep = (xRange.max - xRange.min) / resolution;
      const paramStep = (paramRange.max - paramRange.min) / resolution;
      
      // Отрисовываем тепловую карту значений
      for (let i = 0; i <= resolution; i++) {
        const x = xRange.min + i * xStep;
        
        for (let j = 0; j <= resolution; j++) {
          const paramValue = paramRange.min + j * paramStep;
          
          const value = evaluateExpression(x, paramValue);
          const { x: canvasX, y: canvasY } = transformCoords(x, paramValue);
          
          // Рисуем точку
          ctx.fillStyle = getPointColor(value, darkMode);
          ctx.fillRect(canvasX - 1, canvasY - 1, 3, 3);
        }
      }
      
      // Дополнительно отрисовываем линию решений (где выражение = 0)
      ctx.strokeStyle = '#FF5733';
      ctx.lineWidth = 2;
      
      let isFirstPoint = true;
      let prevX, prevY;
      
      for (let paramValue = paramRange.min; paramValue <= paramRange.max; paramValue += paramStep) {
        for (let x = xRange.min; x <= xRange.max; x += xStep) {
          const value = evaluateExpression(x, paramValue);
          
          if (value !== null && Math.abs(value) < 0.1) {
            const { x: canvasX, y: canvasY } = transformCoords(x, paramValue);
            
            if (isFirstPoint) {
              ctx.beginPath();
              ctx.moveTo(canvasX, canvasY);
              isFirstPoint = false;
            } else {
              if (Math.sqrt(Math.pow(canvasX - prevX, 2) + Math.pow(canvasY - prevY, 2)) < 50) {
                ctx.lineTo(canvasX, canvasY);
              } else {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(canvasX, canvasY);
              }
            }
            
            prevX = canvasX;
            prevY = canvasY;
          }
        }
      }
      
      ctx.stroke();
      
      setError(null);
    } catch (error) {
      console.error('Ошибка при визуализации:', error);
      setError(`Не удалось построить визуализацию: ${error.message}`);
    }
    
    setIsDrawing(false);
  };

  // Обновляем визуализацию при изменении параметров
  useEffect(() => {
    if (!expression || !parameter) return;
    drawVisualization();
  }, [expression, parameter, width, height, xRange, paramRange, darkMode]);

  // Обработчики изменения диапазонов
  const handleXRangeChange = (e, bound) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setXRange(prev => ({ ...prev, [bound]: value }));
    }
  };

  const handleParamRangeChange = (e, bound) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setParamRange(prev => ({ ...prev, [bound]: value }));
    }
  };

  return (
    <div className={`mt-6 p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h3 className="text-xl font-bold mb-4">Визуализация решений</h3>
      
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block mb-1">Диапазон X:</label>
          <div className="flex items-center">
            <input
              type="number"
              value={xRange.min}
              onChange={(e) => handleXRangeChange(e, 'min')}
              className={`w-20 p-1 rounded-lg mr-2 ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            />
            <span>до</span>
            <input
              type="number"
              value={xRange.max}
              onChange={(e) => handleXRangeChange(e, 'max')}
              className={`w-20 p-1 rounded-lg ml-2 ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            />
          </div>
        </div>
        
        <div>
          <label className="block mb-1">Диапазон {parameter}:</label>
          <div className="flex items-center">
            <input
              type="number"
              value={paramRange.min}
              onChange={(e) => handleParamRangeChange(e, 'min')}
              className={`w-20 p-1 rounded-lg mr-2 ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            />
            <span>до</span>
            <input
              type="number"
              value={paramRange.max}
              onChange={(e) => handleParamRangeChange(e, 'max')}
              className={`w-20 p-1 rounded-lg ml-2 ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      <div className="relative mb-4">
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height}
          className="border rounded-lg"
        />
        
        {isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-white">Построение визуализации...</div>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-sm">
          <span className="inline-block w-4 h-4 bg-[#FF5733] mr-2"></span>
          Решения уравнения (где выражение = 0)
        </p>
        <p className="text-sm">
          <span className="inline-block w-4 h-4 bg-[#4CAF50] mr-2"></span>
          Положительные значения выражения
        </p>
        <p className="text-sm">
          <span className="inline-block w-4 h-4 bg-[#F44336] mr-2"></span>
          Отрицательные значения выражения
        </p>
      </div>
      
      <div className="text-sm mt-4">
        <p>Визуализация показывает область решений уравнения {expression} = 0 для различных значений переменной x и параметра {parameter}.</p>
        <p className="mt-2">Оранжевая линия показывает точки, в которых выражение равно нулю.</p>
      </div>
    </div>
  );
};

export default ParametricVisualization; 