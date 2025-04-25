import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ReferenceArea, Label
} from 'recharts';

const InequalityGraph = ({ type, params, solution, darkMode }) => {
  const [data, setData] = useState([]);
  const [domain, setDomain] = useState([-10, 10]);
  const [referencePoints, setReferencePoints] = useState([]);
  const [solutionRanges, setSolutionRanges] = useState([]);
  
  // Генерация данных для графика
  useEffect(() => {
    if (!params) return;
    
    let rootValues = [];
    let rangeMin = -10;
    let rangeMax = 10;
    
    // Извлекаем корни уравнения из решения, если они есть
    if (solution && Array.isArray(solution) && solution.length > 0) {
      const solutionText = solution.join(' ');
      const rootRegex = /x\s*=\s*([-+]?\d+(\.\d+)?)/g;
      const rangeRegex = /x\s*[∈∉]\s*\(([-+]?\d+(\.\d+)?)\s*;\s*([-+]?\d+(\.\d+)?|[+]?∞)\)/g;
      const unionRegex = /x\s*[∈∉]\s*\(([-+]?\d+(\.\d+)?|[-]?∞)\s*;\s*([-+]?\d+(\.\d+)?)\)\s*[∪∩]\s*\(([-+]?\d+(\.\d+)?)\s*;\s*([-+]?\d+(\.\d+)?|[+]?∞)\)/g;
      
      // Ищем корни в решении
      let match;
      while ((match = rootRegex.exec(solutionText)) !== null) {
        rootValues.push(parseFloat(match[1]));
      }
      
      // Ищем диапазоны решений
      const ranges = [];
      
      // Проверяем на объединение интервалов
      const unionMatches = [...solutionText.matchAll(unionRegex)];
      if (unionMatches.length > 0) {
        for (const unionMatch of unionMatches) {
          const firstStart = unionMatch[1] === '-∞' ? -Infinity : parseFloat(unionMatch[1]);
          const firstEnd = parseFloat(unionMatch[3]);
          const secondStart = parseFloat(unionMatch[5]);
          const secondEnd = unionMatch[7] === '+∞' ? Infinity : parseFloat(unionMatch[7]);
          
          ranges.push([firstStart, firstEnd]);
          ranges.push([secondStart, secondEnd]);
        }
      } else {
        // Для простых интервалов
        const rangeMatches = [...solutionText.matchAll(rangeRegex)];
        for (const rangeMatch of rangeMatches) {
          const start = parseFloat(rangeMatch[1]);
          const end = rangeMatch[3] === '+∞' ? Infinity : parseFloat(rangeMatch[3]);
          ranges.push([start, end]);
        }
      }
      
      setSolutionRanges(ranges);
      
      // Определяем диапазон графика на основе найденных корней и интервалов
      if (rootValues.length > 0) {
        const minRoot = Math.min(...rootValues);
        const maxRoot = Math.max(...rootValues);
        const padding = Math.max(5, (maxRoot - minRoot) * 0.5);
        rangeMin = Math.min(-10, minRoot - padding);
        rangeMax = Math.max(10, maxRoot + padding);
      }
    }
    
    setReferencePoints(rootValues);
    
    // Создаем точки для графика
    const points = [];
    const step = (rangeMax - rangeMin) / 100;
    
    for (let x = rangeMin; x <= rangeMax; x += step) {
      let y;
      
      switch (type) {
        case 'quadratic':
          y = params.a * x * x + params.b * x + params.c;
          break;
        case 'linear':
          y = params.a * x + params.b;
          break;
        case 'rational':
          if (typeof params.numerator === 'object' && typeof params.denominator === 'object') {
            const num = params.numerator.a * x + params.numerator.b;
            const denom = params.denominator.a * x + params.denominator.b;
            
            // Избегаем деления на ноль
            if (Math.abs(denom) < 0.001) {
              // Добавляем разрыв в график
              points.push({ x, y: null });
              continue;
            }
            
            y = num / denom;
          } else {
            y = 0; // По умолчанию, если не можем вычислить
          }
          break;
        default:
          y = 0;
      }
      
      // Ограничиваем y для лучшего отображения
      if (y !== null && !isNaN(y)) {
        if (y > 100) y = 100;
        if (y < -100) y = -100;
      }
      
      points.push({ x, y });
    }
    
    setData(points);
    setDomain([rangeMin, rangeMax]);
  }, [type, params, solution]);
  
  const renderReferenceAreas = () => {
    if (solutionRanges.length === 0) return null;
    
    return solutionRanges.map((range, index) => {
      const x1 = range[0] === -Infinity ? domain[0] : range[0];
      const x2 = range[1] === Infinity ? domain[1] : range[1];
      
      return (
        <ReferenceArea
          key={`area-${index}`}
          x1={x1}
          x2={x2}
          stroke="none"
          strokeOpacity={0.3}
          fill={darkMode ? "#4299e1" : "#3182ce"}
          fillOpacity={0.3}
        />
      );
    });
  };
  
  if (!params) {
    return (
      <div className={`mt-6 p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h3 className="text-lg font-semibold mb-4">График решения</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Введите неравенство для отображения графика
        </div>
      </div>
    );
  }
  
  return (
    <div className={`mt-6 p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h3 className="text-lg font-semibold mb-4">Графическое представление</h3>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4a5568" : "#e2e8f0"} />
            <XAxis 
              dataKey="x" 
              type="number" 
              domain={domain} 
              stroke={darkMode ? "#e2e8f0" : "#4a5568"}
              tick={{ fill: darkMode ? "#e2e8f0" : "#4a5568" }}
              label={{ 
                value: 'x', 
                position: 'insideBottomRight', 
                offset: -10,
                fill: darkMode ? "#e2e8f0" : "#4a5568"
              }}
            />
            <YAxis 
              stroke={darkMode ? "#e2e8f0" : "#4a5568"}
              tick={{ fill: darkMode ? "#e2e8f0" : "#4a5568" }}
              label={{ 
                value: 'y', 
                angle: -90, 
                position: 'insideLeft',
                fill: darkMode ? "#e2e8f0" : "#4a5568"
              }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: darkMode ? "#2d3748" : "#fff",
                color: darkMode ? "#e2e8f0" : "#1a202c",
                border: `1px solid ${darkMode ? "#4a5568" : "#e2e8f0"}`
              }}
              formatter={(value) => [value !== null ? value.toFixed(2) : 'Разрыв', 'Значение']}
              labelFormatter={(label) => `x = ${label.toFixed(2)}`}
            />
            <Legend />
            
            {/* Горизонтальная ось y=0 */}
            <ReferenceLine y={0} stroke={darkMode ? "#e2e8f0" : "#4a5568"} strokeWidth={1} />
            
            {/* Вертикальная ось x=0 */}
            <ReferenceLine x={0} stroke={darkMode ? "#e2e8f0" : "#4a5568"} strokeWidth={1} />
            
            {/* Отображаем корни уравнения вертикальными линиями */}
            {referencePoints.map((x, index) => (
              <ReferenceLine
                key={`ref-${index}`}
                x={x}
                stroke={darkMode ? "#f56565" : "#e53e3e"}
                strokeDasharray="3 3"
                strokeWidth={2}
              >
                <Label 
                  value={`x=${x.toFixed(2)}`} 
                  position="top" 
                  fill={darkMode ? "#f56565" : "#e53e3e"}
                />
              </ReferenceLine>
            ))}
            
            {/* Отображаем интервалы решений */}
            {renderReferenceAreas()}
            
            {/* График функции */}
            <Line
              type="monotone"
              dataKey="y"
              stroke={darkMode ? "#38b2ac" : "#2b6cb0"}
              dot={false}
              strokeWidth={2}
              connectNulls={false}
              name={
                type === 'quadratic' ? `f(x) = ${params.a}x² ${params.b >= 0 ? '+' : ''}${params.b}x ${params.c >= 0 ? '+' : ''}${params.c}` :
                type === 'linear' ? `f(x) = ${params.a}x ${params.b >= 0 ? '+' : ''}${params.b}` :
                type === 'rational' ? 'Рациональная функция' : 'Функция'
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center">
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Области решения выделены цветом. Корни уравнения отмечены пунктирными линиями.
        </p>
      </div>
    </div>
  );
};

export default InequalityGraph; 