import * as math from 'mathjs';

/**
 * Генерирует данные для обучения на линейных уравнениях
 * @param {number} samples - Количество примеров
 * @returns {Array} Массив объектов с данными
 */
export const generateLinearEquationData = (samples = 1000) => {
  const data = [];
  
  for (let i = 0; i < samples; i++) {
    // Генерируем случайные коэффициенты
    const a = Math.random() * 20 - 10; // от -10 до 10
    const b = Math.random() * 20 - 10; // от -10 до 10
    
    // Создаем линейное уравнение ax + b = 0
    const equation = `${a}*x + ${b} = 0`;
    
    // Находим решение
    let solution = null;
    if (a === 0) {
      if (b === 0) {
        solution = 'infinite'; // Бесконечно много решений
      } else {
        solution = 'none'; // Нет решений
      }
    } else {
      solution = -b / a; // Единственное решение
    }
    
    // Формируем признаки
    const features = [a, b, a !== 0 ? 1 : 0, b !== 0 ? 1 : 0];
    
    // Добавляем данные
    data.push({
      equation,
      features,
      solutionType: typeof solution === 'number' ? 'unique' : solution,
      solution: typeof solution === 'number' ? solution : null
    });
  }
  
  return data;
};

/**
 * Генерирует данные для обучения на квадратных уравнениях
 * @param {number} samples - Количество примеров
 * @returns {Array} Массив объектов с данными
 */
export const generateQuadraticEquationData = (samples = 1000) => {
  const data = [];
  
  for (let i = 0; i < samples; i++) {
    // Генерируем случайные коэффициенты
    let a = Math.random() * 10 - 5; // от -5 до 5
    if (Math.abs(a) < 0.1) a = 0.1 * Math.sign(a) || 0.1; // Избегаем значений, близких к нулю
    
    const b = Math.random() * 20 - 10; // от -10 до 10
    const c = Math.random() * 20 - 10; // от -10 до 10
    
    // Создаем квадратное уравнение ax^2 + bx + c = 0
    const equation = `${a}*x^2 + ${b}*x + ${c} = 0`;
    
    // Вычисляем дискриминант
    const discriminant = b * b - 4 * a * c;
    
    // Находим решения
    let solutions = [];
    let solutionType = '';
    
    if (discriminant < 0) {
      solutionType = 'none'; // Нет действительных корней
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      solutions = [x];
      solutionType = 'unique'; // Один корень
    } else {
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      solutions = [x1, x2];
      solutionType = 'two'; // Два корня
    }
    
    // Формируем признаки
    const features = [a, b, c, discriminant];
    
    // Добавляем данные
    data.push({
      equation,
      features,
      solutionType,
      solutions,
      discriminant
    });
  }
  
  return data;
};

/**
 * Генерирует данные для обучения на системах линейных уравнений
 * @param {number} samples - Количество примеров
 * @returns {Array} Массив объектов с данными
 */
export const generateLinearSystemData = (samples = 500) => {
  const data = [];
  
  for (let i = 0; i < samples; i++) {
    // Генерируем коэффициенты системы 2x2
    const a1 = Math.random() * 10 - 5;
    const b1 = Math.random() * 10 - 5;
    const c1 = Math.random() * 20 - 10;
    
    const a2 = Math.random() * 10 - 5;
    const b2 = Math.random() * 10 - 5;
    const c2 = Math.random() * 20 - 10;
    
    // Система уравнений:
    // a1*x + b1*y = c1
    // a2*x + b2*y = c2
    
    // Вычисляем определитель
    const det = a1 * b2 - a2 * b1;
    
    // Находим решение
    let solution = null;
    let solutionType = '';
    
    if (Math.abs(det) < 1e-10) {
      // Система либо несовместна, либо имеет бесконечно много решений
      const det1 = c1 * b2 - c2 * b1;
      const det2 = a1 * c2 - a2 * c1;
      
      if (Math.abs(det1) < 1e-10 && Math.abs(det2) < 1e-10) {
        solutionType = 'infinite'; // Бесконечно много решений
      } else {
        solutionType = 'none'; // Нет решений
      }
    } else {
      // Единственное решение
      const x = (c1 * b2 - c2 * b1) / det;
      const y = (a1 * c2 - a2 * c1) / det;
      solution = { x, y };
      solutionType = 'unique';
    }
    
    // Формируем признаки
    const features = [a1, b1, c1, a2, b2, c2, det];
    
    // Добавляем данные
    data.push({
      system: {
        eq1: `${a1}*x + ${b1}*y = ${c1}`,
        eq2: `${a2}*x + ${b2}*y = ${c2}`
      },
      features,
      solutionType,
      solution
    });
  }
  
  return data;
};

/**
 * Генерирует данные для обучения на тригонометрических уравнениях
 * @param {number} samples - Количество примеров
 * @returns {Array} Массив объектов с данными
 */
export const generateTrigonometricData = (samples = 500) => {
  const data = [];
  const functions = ['sin', 'cos', 'tan'];
  
  for (let i = 0; i < samples; i++) {
    // Случайно выбираем тригонометрическую функцию
    const funcIndex = Math.floor(Math.random() * functions.length);
    const func = functions[funcIndex];
    
    // Генерируем коэффициенты
    const a = Math.random() * 5 + 0.5; // от 0.5 до 5.5
    const b = Math.random() * Math.PI; // от 0 до π
    const c = Math.random() * 2 - 1; // от -1 до 1
    
    // Создаем уравнение вида a*func(x + b) = c
    const equation = `${a}*${func}(x + ${b}) = ${c}`;
    
    // Для упрощения решаем только для первого периода
    let solutions = [];
    let solutionType = '';
    
    if (Math.abs(c) > a) {
      // Если |c| > a, то уравнение не имеет решений для sin и cos
      if (func === 'sin' || func === 'cos') {
        solutionType = 'none';
      } else {
        // Для tan всегда есть решение
        solutionType = 'periodic';
        const basicSolution = Math.atan(c / a) - b;
        solutions = [basicSolution];
      }
    } else {
      if (func === 'sin') {
        solutionType = 'periodic';
        const angle = Math.asin(c / a);
        const sol1 = angle - b;
        const sol2 = Math.PI - angle - b;
        solutions = [sol1, sol2];
      } else if (func === 'cos') {
        solutionType = 'periodic';
        const angle = Math.acos(c / a);
        const sol1 = angle - b;
        const sol2 = -angle - b;
        solutions = [sol1, sol2];
      } else {
        solutionType = 'periodic';
        const basicSolution = Math.atan(c / a) - b;
        solutions = [basicSolution];
      }
    }
    
    // Формируем признаки
    const features = [
      a, 
      b, 
      c, 
      funcIndex, // Кодируем функцию числом
      Math.abs(c) <= a ? 1 : 0 // Есть ли решение
    ];
    
    // Добавляем данные
    data.push({
      equation,
      features,
      solutionType,
      solutions
    });
  }
  
  return data;
};

/**
 * Генерирует данные для обучения на параметрических линейных уравнениях
 * @param {number} samples - Количество примеров
 * @returns {Array} Массив объектов с данными
 */
export const generateParametricLinearData = (samples = 500) => {
  const data = [];
  const parameters = ['a', 'b', 'c', 'm', 'n', 'p'];
  
  for (let i = 0; i < samples; i++) {
    // Выбираем случайный параметр
    const param = parameters[Math.floor(Math.random() * parameters.length)];
    
    // Выбираем случайное значение параметра
    const paramValue = Math.random() * 10 - 5; // от -5 до 5
    
    // Генерируем коэффициенты уравнения (a*x + b = 0)
    // Один из коэффициентов будет содержать параметр
    const hasParamInA = Math.random() < 0.5;
    
    let a, b;
    if (hasParamInA) {
      const aFactor = Math.random() * 2 - 1; // от -1 до 1
      a = `${aFactor}*${param}`; // a = aFactor*param
      b = Math.random() * 10 - 5; // от -5 до 5
    } else {
      a = Math.random() * 10 - 5; // от -5 до 5
      const bFactor = Math.random() * 2 - 1; // от -1 до 1
      b = `${bFactor}*${param}`; // b = bFactor*param
    }
    
    // Строим уравнение
    const equation = `${a}*x + ${b} = 0`;
    
    // Вычисляем значения коэффициентов при подстановке значения параметра
    const aValue = hasParamInA ? parseFloat(a) * paramValue : parseFloat(a);
    const bValue = hasParamInA ? parseFloat(b) : parseFloat(b) * paramValue;
    
    // Находим решение
    let solution = null;
    let solutionType = '';
    
    if (aValue === 0) {
      if (bValue === 0) {
        solutionType = 'infinite';
      } else {
        solutionType = 'none';
      }
    } else {
      solution = -bValue / aValue;
      solutionType = 'unique';
    }
    
    // Формируем признаки
    const features = [
      hasParamInA ? parseFloat(a.split('*')[0]) : parseFloat(a),
      hasParamInA ? 0 : parseFloat(b.split('*')[0]),
      hasParamInA ? 1 : 0, // Флаг наличия параметра в a
      hasParamInA ? 0 : 1, // Флаг наличия параметра в b
      paramValue,
      parameters.indexOf(param) / parameters.length // Нормализованный индекс параметра
    ];
    
    // Добавляем данные
    data.push({
      equation,
      parameter: param,
      parameterValue: paramValue,
      features,
      solutionType,
      solution
    });
  }
  
  return data;
};

/**
 * Генерирует данные для обучения на параметрических квадратных уравнениях
 * @param {number} samples - Количество примеров
 * @returns {Array} Массив объектов с данными
 */
export const generateParametricQuadraticData = (samples = 500) => {
  const data = [];
  const parameters = ['a', 'b', 'c', 'm', 'n', 'p'];
  
  for (let i = 0; i < samples; i++) {
    // Выбираем случайный параметр
    const param = parameters[Math.floor(Math.random() * parameters.length)];
    
    // Выбираем случайное значение параметра
    const paramValue = Math.random() * 6 - 3; // от -3 до 3
    
    // Определяем, какой коэффициент будет содержать параметр
    const paramPosition = Math.floor(Math.random() * 3); // 0 = a, 1 = b, 2 = c
    
    // Генерируем коэффициенты
    let a, b, c;
    
    if (paramPosition === 0) {
      const aFactor = Math.random() * 2 - 1; // от -1 до 1
      a = `${aFactor}*${param}`;
      b = Math.random() * 10 - 5;
      c = Math.random() * 10 - 5;
    } else if (paramPosition === 1) {
      a = Math.random() * 5 - 2.5;
      if (Math.abs(a) < 0.1) a = 0.1 * Math.sign(a) || 0.1; // Избегаем значений, близких к нулю
      
      const bFactor = Math.random() * 2 - 1;
      b = `${bFactor}*${param}`;
      c = Math.random() * 10 - 5;
    } else {
      a = Math.random() * 5 - 2.5;
      if (Math.abs(a) < 0.1) a = 0.1 * Math.sign(a) || 0.1; // Избегаем значений, близких к нулю
      
      b = Math.random() * 10 - 5;
      const cFactor = Math.random() * 2 - 1;
      c = `${cFactor}*${param}`;
    }
    
    // Строим уравнение
    const equation = `${a}*x^2 + ${b}*x + ${c} = 0`;
    
    // Вычисляем значения коэффициентов при подстановке значения параметра
    const aValue = paramPosition === 0 ? parseFloat(a.split('*')[0]) * paramValue : parseFloat(a);
    const bValue = paramPosition === 1 ? parseFloat(b.split('*')[0]) * paramValue : parseFloat(b);
    const cValue = paramPosition === 2 ? parseFloat(c.split('*')[0]) * paramValue : parseFloat(c);
    
    // Вычисляем дискриминант
    const discriminant = bValue * bValue - 4 * aValue * cValue;
    
    // Находим решения
    let solutions = [];
    let solutionType = '';
    
    if (aValue === 0) {
      // Уравнение становится линейным
      if (bValue === 0) {
        if (cValue === 0) {
          solutionType = 'infinite';
        } else {
          solutionType = 'none';
        }
      } else {
        solutions = [-cValue / bValue];
        solutionType = 'unique';
      }
    } else {
      if (discriminant < 0) {
        solutionType = 'none';
      } else if (discriminant === 0) {
        solutions = [-bValue / (2 * aValue)];
        solutionType = 'unique';
      } else {
        const x1 = (-bValue + Math.sqrt(discriminant)) / (2 * aValue);
        const x2 = (-bValue - Math.sqrt(discriminant)) / (2 * aValue);
        solutions = [x1, x2];
        solutionType = 'two';
      }
    }
    
    // Формируем признаки
    const features = [
      paramPosition === 0 ? parseFloat(a.split('*')[0]) : parseFloat(a),
      paramPosition === 1 ? parseFloat(b.split('*')[0]) : parseFloat(b),
      paramPosition === 2 ? parseFloat(c.split('*')[0]) : parseFloat(c),
      paramPosition === 0 ? 1 : 0, // Флаг наличия параметра в a
      paramPosition === 1 ? 1 : 0, // Флаг наличия параметра в b
      paramPosition === 2 ? 1 : 0, // Флаг наличия параметра в c
      paramValue,
      parameters.indexOf(param) / parameters.length // Нормализованный индекс параметра
    ];
    
    // Добавляем данные
    data.push({
      equation,
      parameter: param,
      parameterValue: paramValue,
      features,
      solutionType,
      solutions,
      discriminant
    });
  }
  
  return data;
};

/**
 * Объединяет данные из разных источников для обучения
 * @param {Object} options - Параметры генерации данных
 * @returns {Array} Объединенный массив данных
 */
export const generateCompleteTrainingData = (options = {}) => {
  const {
    linearSamples = 1000,
    quadraticSamples = 1000,
    linearSystemSamples = 500,
    trigonometricSamples = 500,
    parametricLinearSamples = 500,
    parametricQuadraticSamples = 500,
  } = options;
  
  const linearData = generateLinearEquationData(linearSamples);
  const quadraticData = generateQuadraticEquationData(quadraticSamples);
  const linearSystemData = generateLinearSystemData(linearSystemSamples);
  const trigonometricData = generateTrigonometricData(trigonometricSamples);
  const parametricLinearData = generateParametricLinearData(parametricLinearSamples);
  const parametricQuadraticData = generateParametricQuadraticData(parametricQuadraticSamples);
  
  return {
    linearData,
    quadraticData,
    linearSystemData,
    trigonometricData,
    parametricLinearData,
    parametricQuadraticData,
    
    // Общее количество примеров
    totalSamples: linearSamples + quadraticSamples + linearSystemSamples + 
                  trigonometricSamples + parametricLinearSamples + parametricQuadraticSamples
  };
}; 