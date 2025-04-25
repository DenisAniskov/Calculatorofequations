/**
 * Утилиты для решения математических неравенств с параметрами
 */

import * as math from 'mathjs';

/**
 * Решает квадратное неравенство с параметром
 * @param {number} a - Коэффициент при x²
 * @param {number} b - Коэффициент при x
 * @param {number} c - Свободный член
 * @returns {string} Решение неравенства
 */
export const solveQuadraticInequality = (a, b, c) => {
  // Проверка входных данных
  if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') {
    throw new Error('Параметры должны быть числами');
  }

  const steps = [];

  // Шаг 1: Приводим к стандартному виду
  steps.push(`Приводим к стандартному виду: ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0`);

  // Если a = 0, решаем как линейное неравенство
  if (a === 0) {
    return solveLinearInequality(b, c);
  }

  // Шаг 2: Вычисляем дискриминант
  const discriminant = b * b - 4 * a * c;
  steps.push(`Вычисляем дискриминант: D = b² - 4ac = ${b}² - 4 * ${a} * ${c} = ${discriminant}`);

  // Шаг 3: Анализируем дискриминант
  if (discriminant > 0) {
    // Два действительных корня
    const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    steps.push(`D > 0, уравнение имеет два действительных корня: x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`);
    
    if (a > 0) {
      steps.push(`Так как a > 0, решением является: x < ${x2.toFixed(4)} или x > ${x1.toFixed(4)}`);
    } else {
      steps.push(`Так как a < 0, решением является: ${x2.toFixed(4)} < x < ${x1.toFixed(4)}`);
    }
  } else if (discriminant === 0) {
    // Один действительный корень
    const x = -b / (2 * a);
    steps.push(`D = 0, уравнение имеет один действительный корень: x = ${x.toFixed(4)}`);
   
    if (a > 0) {
      steps.push(`Так как a > 0, решением является: x ≠ ${x.toFixed(4)}`);
    } else {
      steps.push(`Так как a < 0, решением является: x = ${x.toFixed(4)}`);
    }
  } else {
    // Нет действительных корней
    steps.push(`D < 0, уравнение не имеет действительных корней`);
    
    if (a > 0) {
      steps.push(`Так как a > 0 и D < 0, квадратичная функция всегда положительна, решением является: ∅ (пустое множество)`);
    } else {
      steps.push(`Так как a < 0 и D < 0, квадратичная функция всегда отрицательна, решением является: ℝ (все действительные числа)`);
    }
  }

  return steps.join('; ');
};

/**
 * Решает линейное неравенство с параметром
 * @param {Object} params - Параметры неравенства
 * @param {number|string} params.a - Коэффициент при x
 * @param {number|string} params.b - Свободный член
 * @param {string} params.operator - Оператор неравенства ('>', '<', '>=', '<=')
 * @returns {Object} Решение неравенства
 */
export const solveLinearInequality = (params) => {
  try {
    let a, b, operator;
    
    // Поддержка двух форматов вызова
    if (typeof params === 'object') {
      ({ a, b, operator } = params);
    } else {
      [a, b, operator] = arguments;
    }
    
    // Проверка входных данных
    if (a === undefined || b === undefined || !operator) {
      throw new Error('Не все параметры предоставлены');
    }

    const solution = [];
    
    solution.push(`1. Приводим к стандартному виду: ${a}x + ${b} ${operator} 0`);
    
    if (math.equal(math.number(a), 0)) {
      if ((math.larger(math.number(b), 0) && (operator === '<' || operator === '<=')) ||
          (math.smaller(math.number(b), 0) && (operator === '>' || operator === '>='))) {
        solution.push('2. Коэффициент при x равен 0, неравенство не имеет решений');
        solution.push('3. Решение: ∅ (пустое множество)');
      } else {
        solution.push('2. Коэффициент при x равен 0, неравенство верно при любых x');
        solution.push('3. Решение: ℝ (все действительные числа)');
      }
    } else {
      const x = math.divide(math.unaryMinus(math.number(b)), math.number(a));
      solution.push(`2. Находим точку пересечения с осью x: ${a}x + ${b} = 0`);
      solution.push(`3. x = ${x.toFixed(2)}`);
      
      if (math.larger(math.number(a), 0)) {
        if (operator === '>' || operator === '>=') {
          solution.push(`4. Так как a > 0, решением является интервал: (${x.toFixed(2)}; +∞)`);
        } else {
          solution.push(`4. Так как a > 0, решением является интервал: (-∞; ${x.toFixed(2)})`);
        }
      } else {
        if (operator === '>' || operator === '>=') {
          solution.push(`4. Так как a < 0, решением является интервал: (-∞; ${x.toFixed(2)})`);
        } else {
          solution.push(`4. Так как a < 0, решением является интервал: (${x.toFixed(2)}; +∞)`);
        }
      }
    }

    return solution;
  } catch (error) {
    throw new Error(`Ошибка при решении линейного неравенства: ${error.message}`);
  }
};

// Функция для проверки корректности ввода неравенства
export const validateInequality = (inequality) => {
  if (!inequality || typeof inequality !== 'string') {
    throw new Error('Неравенство должно быть непустой строкой');
  }

  // Проверка на наличие оператора сравнения
  const operators = ['>', '<', '>=', '<=', '=', '≠'];
  let hasOperator = false;
  
  for (const op of operators) {
    if (inequality.includes(op)) {
      hasOperator = true;
      break;
    }
  }
  
  if (!hasOperator) {
    throw new Error('Неравенство должно содержать оператор сравнения (>, <, >=, <=, =, ≠)');
  }

  // Проверка на корректность скобок
  let bracketCount = 0;
  for (const char of inequality) {
    if (char === '(') bracketCount++;
    if (char === ')') bracketCount--;
    if (bracketCount < 0) {
      throw new Error('Неправильная последовательность скобок');
    }
  }
  if (bracketCount !== 0) {
    throw new Error('Не все скобки закрыты');
  }

  // Проверка на недопустимые символы
  const validChars = /^[0-9x+\-*/^()., <>≠=]+$/;
  if (!validChars.test(inequality.replace(/\s/g, ''))) {
    throw new Error('Неравенство содержит недопустимые символы');
  }

  try {
    parseExpression(inequality);
    return true;
  } catch (error) {
    throw new Error(`Ошибка в формате выражения: ${error.message}`);
  }
};

// Решение рациональных неравенств
export const solveRationalInequality = (params) => {
  try {
    let numerator, denominator, operator;
    
    // Поддержка двух форматов вызова
    if (typeof params === 'object') {
      ({ numerator, denominator, operator } = params);
    } else if (typeof params === 'string') {
      const [left, right] = params.split(/[><=]+/);
      operator = params.match(/[><=]+/)[0];
      numerator = left.split('/')[0];
      denominator = left.split('/')[1];
    } else {
      [numerator, denominator, operator] = arguments;
    }
    
    // Проверка входных данных
    if (!numerator || !denominator || !operator) {
      throw new Error('Не все параметры предоставлены');
    }

    const solution = [];
    
    // Если переданы строки, парсим коэффициенты
    if (typeof numerator === 'string' && typeof denominator === 'string') {
      const numCoeffs = parseCoefficients(numerator);
      const denomCoeffs = parseCoefficients(denominator);
      
      solution.push(`1. Приведем неравенство к стандартному виду: (${numCoeffs.a}x + ${numCoeffs.b})/(${denomCoeffs.a}x + ${denomCoeffs.b}) ${operator} 0`);
      solution.push('2. Найдем нули числителя и знаменателя:');
      
      // Находим нули числителя
      const x1 = math.divide(math.unaryMinus(math.number(numCoeffs.b)), math.number(numCoeffs.a));
      solution.push(`   Нуль числителя: x = ${x1.toFixed(2)}`);
      
      // Находим нули знаменателя
      const x2 = math.divide(math.unaryMinus(math.number(denomCoeffs.b)), math.number(denomCoeffs.a));
      solution.push(`   Нуль знаменателя: x = ${x2.toFixed(2)}`);
      
      // Определяем интервалы
      const points = [x1, x2].sort((a, b) => a - b);
      solution.push('3. Определяем интервалы:');
      solution.push(`   (-∞; ${points[0].toFixed(2)}), (${points[0].toFixed(2)}; ${points[1].toFixed(2)}), (${points[1].toFixed(2)}; +∞)`);
      
      // Анализируем знаки на интервалах
      solution.push('4. Анализируем знаки на интервалах:');
      const testPoints = [
        points[0] - 1,
        (points[0] + points[1]) / 2,
        points[1] + 1
      ];
      
      testPoints.forEach((x, i) => {
        const num = math.add(math.multiply(math.number(numCoeffs.a), x), math.number(numCoeffs.b));
        const den = math.add(math.multiply(math.number(denomCoeffs.a), x), math.number(denomCoeffs.b));
        const value = math.divide(num, den);
        const sign = math.larger(value, 0) ? '+' : '-';
        solution.push(`   На интервале ${i === 0 ? '(-∞; ' + points[0].toFixed(2) + ')' :
                          i === 1 ? '(' + points[0].toFixed(2) + '; ' + points[1].toFixed(2) + ')' :
                          '(' + points[1].toFixed(2) + '; +∞)'}: ${sign}`);
      });
      
      // Формируем ответ
      solution.push('5. Решение:');
      if (operator === '>' || operator === '>=') {
        solution.push(`   x ∈ (-∞; ${points[0].toFixed(2)}) ∪ (${points[1].toFixed(2)}; +∞)`);
      } else {
        solution.push(`   x ∈ (${points[0].toFixed(2)}; ${points[1].toFixed(2)})`);
      }
    } else {
      // Если переданы числовые коэффициенты
      const x1 = math.divide(math.unaryMinus(math.number(numerator)), math.number(denominator));
      solution.push(`1. Находим точку пересечения: x = ${x1.toFixed(2)}`);
      
      if (math.larger(math.number(denominator), 0)) {
        if (operator === '>' || operator === '>=') {
          solution.push(`2. Так как знаменатель положительный, решением является интервал: (${x1.toFixed(2)}; +∞)`);
        } else {
          solution.push(`2. Так как знаменатель положительный, решением является интервал: (-∞; ${x1.toFixed(2)})`);
        }
      } else {
        if (operator === '>' || operator === '>=') {
          solution.push(`2. Так как знаменатель отрицательный, решением является интервал: (-∞; ${x1.toFixed(2)})`);
        } else {
          solution.push(`2. Так как знаменатель отрицательный, решением является интервал: (${x1.toFixed(2)}; +∞)`);
        }
      }
    }

    return solution;
  } catch (error) {
    throw new Error(`Ошибка при решении рационального неравенства: ${error.message}`);
  }
};

// Парсинг математических выражений
export const parseExpression = (expression) => {
  try {
    // Нормализуем специальные символы
    const normalized = expression
      .replace(/\^/g, '^')
      .replace(/\*/g, '*')
      .replace(/\//g, '/')
      .replace(/sqrt/g, 'sqrt')
      .replace(/sin/g, 'sin')
      .replace(/cos/g, 'cos')
      .replace(/tan/g, 'tan')
      .replace(/log/g, 'log')
      .replace(/ln/g, 'log');

    return math.parse(normalized);
  } catch (error) {
    throw new Error('Ошибка при парсинге выражения');
  }
};

// Вычисление выражений
export const evaluateExpression = (expression, scope = {}) => {
  try {
    const parsed = parseExpression(expression);
    return parsed.evaluate(scope);
  } catch (error) {
    throw new Error('Ошибка при вычислении выражения');
  }
};

// Вспомогательная функция для нахождения корней
const findRoots = (expression) => {
  try {
    const parsed = parseExpression(expression);
    const roots = new Set(); // Используем Set для уникальных значений
    
    // Улучшенный метод поиска корней с адаптивным шагом
    const searchRange = 100;
    let step = 0.1;
    
    for (let x = -searchRange; x <= searchRange; x += step) {
      const y1 = parsed.evaluate({ x });
      const y2 = parsed.evaluate({ x: x + step });
      
      // Если знак меняется, уточняем корень методом бисекции
      if (y1 * y2 <= 0) {
        let left = x;
        let right = x + step;
        let mid;
        
        // Уточнение корня
        for (let i = 0; i < 10; i++) {
          mid = (left + right) / 2;
          const yMid = parsed.evaluate({ x: mid });
          
          if (Math.abs(yMid) < 1e-10) {
            roots.add(Number(mid.toFixed(6)));
            break;
          }
          
          if (yMid * parsed.evaluate({ x: left }) < 0) {
            right = mid;
          } else {
            left = mid;
          }
        }
        
        // Если нашли корень, добавляем его
        if (mid !== undefined) {
          roots.add(Number(mid.toFixed(6)));
        }
      }
    }
    
    return Array.from(roots).sort((a, b) => a - b);
  } catch (error) {
    console.error('Ошибка при поиске корней:', error);
    return [];
  }
};

// Вспомогательная функция для парсинга коэффициентов
const parseCoefficients = (expression) => {
  if (!expression || typeof expression !== 'string') {
    throw new Error('Выражение должно быть непустой строкой');
  }

  // Удаляем пробелы и нормализуем выражение
  expression = expression.replace(/\s+/g, '')
                        .replace(/([+-])([+-])/g, '$2') // Обработка двойных знаков
                        .replace(/^([+-])?(\d*[a-zA-Z]?)x/, '$1$2x') // Нормализация коэффициента при x
                        .replace(/([+-])?(\d+)$/, '$1$2'); // Нормализация свободного члена
  
  // Поиск коэффициента при x
  const xMatch = expression.match(/([+-]?\d*[a-zA-Z]?)x/);
  let a = 0;
  if (xMatch) {
    const coef = xMatch[1];
    if (coef === '' || coef === '+') a = 1;
    else if (coef === '-') a = -1;
    else a = Number(coef);
  }
  
  // Поиск свободного члена
  const bMatch = expression.match(/([+-]?\d+)(?!.*x)/);
  const b = bMatch ? Number(bMatch[1]) : 0;
  
  // Проверка на корректность чисел
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Некорректные коэффициенты');
  }
  
  return { a, b };
};

// Функция для парсинга неравенства
export const parseInequality = (inequality) => {
  // Удаляем пробелы
  inequality = inequality.replace(/\s+/g, '');
  
  // Разделяем на левую и правую части
  const [left, right] = inequality.split(/([<>]=?|=)/);
  const operator = inequality.match(/[<>]=?|=/)[0];
  
  // Приводим к стандартному виду ax² + bx + c
  const hasQuadratic = left.includes('x^2') || left.includes('x²');
  
  if (hasQuadratic) {
    return {
      type: 'quadratic',
      a: parseCoefficients(left, 'x^2'),
      b: parseCoefficients(left, 'x'),
      c: parseCoefficients(left, ''),
      operator
    };
  } else if (left.includes('/')) {
    return {
      type: 'rational',
      expression: inequality
    };
  } else {
    return {
      type: 'linear',
      a: parseCoefficients(left, 'x'),
      b: parseCoefficients(left, ''),
      operator
    };
  }
};

/**
 * Генерирует детальное пошаговое решение для неравенств
 * @param {string} type - Тип неравенства ('quadratic', 'linear', 'rational', и т.д.)
 * @param {Object} params - Параметры неравенства
 * @returns {Array} Массив строк с пошагами решения
 */
export const generateStepByStepSolutionForInequality = (type, params) => {
  const steps = [];
  
  switch (type) {
    case 'quadratic':
      return generateQuadraticInequalitySolution(params);
    case 'linear':
      return generateLinearInequalitySolution(params);
    case 'rational':
      return generateRationalInequalitySolution(params);
    case 'exponential':
      return generateExponentialInequalitySolution(params);
    case 'logarithmic':
      return generateLogarithmicInequalitySolution(params);
    case 'trigonometric':
      return generateTrigonometricInequalitySolution(params);
    default:
      steps.push(`Для неравенства типа "${type}" пошаговое решение не реализовано.`);
      return steps;
  }
};

/**
 * Генерирует пошаговое решение для квадратного неравенства
 * @param {Object} params - Параметры неравенства
 * @returns {Array} Массив шагов решения
 */
function generateQuadraticInequalitySolution(params) {
  const { a, b, c, operator } = params;
  const steps = [];
  
  // Формирование неравенства
  const inequalityStr = `${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} ${operator} 0`;
  steps.push(`\\text{Дано неравенство: } ${inequalityStr}`);
  
  // Проверка на тип неравенства
  if (a === 0) {
    steps.push(`\\text{Коэффициент при } x^2 \\text{ равен нулю, поэтому это линейное неравенство.}`);
    return generateLinearInequalitySolution({ a: b, b: c, operator });
  }
  
  // Шаг 1: Исследуем квадратичную функцию
  steps.push(`\\text{Шаг 1: Исследуем квадратичную функцию } f(x) = ${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`);
  
  // Шаг 2: Находим вершину параболы
  const xVertex = -b / (2 * a);
  const yVertex = a * xVertex * xVertex + b * xVertex + c;
  steps.push(`\\text{Шаг 2: Находим координаты вершины параболы:}`);
  steps.push(`x_{\\text{верш}} = -\\frac{b}{2a} = -\\frac{${b}}{2 \\cdot ${a}} = ${xVertex.toFixed(4)}`);
  steps.push(`y_{\\text{верш}} = ${a}(${xVertex.toFixed(4)})^2 ${b >= 0 ? '+' : ''}${b}(${xVertex.toFixed(4)}) ${c >= 0 ? '+' : ''}${c} = ${yVertex.toFixed(4)}`);
  
  // Шаг 3: Определяем направление ветвей параболы
  steps.push(`\\text{Шаг 3: Определяем направление ветвей параболы:}`);
  if (a > 0) {
    steps.push(`\\text{Так как коэффициент } a = ${a} > 0, \\text{ ветви параболы направлены вверх.}`);
  } else {
    steps.push(`\\text{Так как коэффициент } a = ${a} < 0, \\text{ ветви параболы направлены вниз.}`);
  }
  
  // Шаг 4: Вычисляем дискриминант
  const D = b * b - 4 * a * c;
  steps.push(`\\text{Шаг 4: Вычисляем дискриминант квадратного уравнения:}`);
  steps.push(`D = b^2 - 4ac = ${b}^2 - 4 \\cdot ${a} \\cdot ${c} = ${D}`);
  
  // Шаг 5: Находим корни уравнения (если есть)
  steps.push(`\\text{Шаг 5: Находим точки пересечения параболы с осью Ox:}`);
  
  let roots = [];
  if (D > 0) {
    const x1 = (-b + Math.sqrt(D)) / (2 * a);
    const x2 = (-b - Math.sqrt(D)) / (2 * a);
    roots = [Math.min(x1, x2), Math.max(x1, x2)];
    
    steps.push(`\\text{Дискриминант } D = ${D} > 0, \\text{ поэтому уравнение имеет два корня:}`);
    steps.push(`x_1 = \\frac{-b + \\sqrt{D}}{2a} = \\frac{-${b} + \\sqrt{${D}}}{2 \\cdot ${a}} = ${x1.toFixed(4)}`);
    steps.push(`x_2 = \\frac{-b - \\sqrt{D}}{2a} = \\frac{-${b} - \\sqrt{${D}}}{2 \\cdot ${a}} = ${x2.toFixed(4)}`);
  } else if (D === 0) {
    const x = -b / (2 * a);
    roots = [x];
    
    steps.push(`\\text{Дискриминант } D = ${D} = 0, \\text{ поэтому уравнение имеет один корень:}`);
    steps.push(`x = \\frac{-b}{2a} = \\frac{-${b}}{2 \\cdot ${a}} = ${x.toFixed(4)}`);
  } else {
    steps.push(`\\text{Дискриминант } D = ${D} < 0, \\text{ поэтому уравнение не имеет действительных корней.}`);
  }
  
  // Шаг 6: Определяем решение неравенства
  steps.push(`\\text{Шаг 6: Определяем решение неравенства } ${inequalityStr}:`);
  
  if (D < 0) {
    // Нет корней
    if ((a > 0 && (operator === '>' || operator === '>=')) || 
        (a < 0 && (operator === '<' || operator === '<='))) {
      steps.push(`\\text{Парабола не пересекает ось Ox, и так как } a = ${a} ${a > 0 ? '> 0' : '< 0'}, \\text{ то } f(x) ${a > 0 ? '> 0' : '< 0'} \\text{ для всех } x.`);
      steps.push(`\\text{Поэтому неравенство } ${inequalityStr} \\text{ не имеет решений: } \\emptyset`);
    } else {
      steps.push(`\\text{Парабола не пересекает ось Ox, и так как } a = ${a} ${a > 0 ? '> 0' : '< 0'}, \\text{ то } f(x) ${a > 0 ? '> 0' : '< 0'} \\text{ для всех } x.`);
      steps.push(`\\text{Поэтому решением неравенства } ${inequalityStr} \\text{ является множество всех действительных чисел: } \\mathbb{R}`);
    }
  } else if (D === 0) {
    // Один корень
    if (operator === '>' || operator === '<') {
      if ((a > 0 && operator === '>') || (a < 0 && operator === '<')) {
        steps.push(`\\text{Парабола касается оси Ox в точке } x = ${roots[0].toFixed(4)}.`);
        steps.push(`\\text{Так как } a = ${a} ${a > 0 ? '> 0' : '< 0'} \\text{ и оператор неравенства строгий}, \\text{ то решение: } x \\neq ${roots[0].toFixed(4)}`);
      } else {
        steps.push(`\\text{Парабола касается оси Ox в точке } x = ${roots[0].toFixed(4)}.`);
        steps.push(`\\text{Так как } a = ${a} ${a > 0 ? '> 0' : '< 0'} \\text{ и оператор неравенства строгий}, \\text{ то решение: } x = ${roots[0].toFixed(4)}`);
      }
    } else { // >=, <=
      if ((a > 0 && operator === '>=') || (a < 0 && operator === '<=')) {
        steps.push(`\\text{Парабола касается оси Ox в точке } x = ${roots[0].toFixed(4)}.`);
        steps.push(`\\text{Так как } a = ${a} ${a > 0 ? '> 0' : '< 0'} \\text{ и оператор неравенства нестрогий}, \\text{ то решение: } x = ${roots[0].toFixed(4)}`);
      } else {
        steps.push(`\\text{Парабола касается оси Ox в точке } x = ${roots[0].toFixed(4)}.`);
        steps.push(`\\text{Так как } a = ${a} ${a > 0 ? '> 0' : '< 0'} \\text{ и оператор неравенства нестрогий}, \\text{ то решение: } \\mathbb{R}`);
      }
    }
  } else {
    // Два корня
    const x1 = roots[0].toFixed(4);
    const x2 = roots[1].toFixed(4);
    
    if (a > 0) {
      if (operator === '>' || operator === '>=') {
        steps.push(`\\text{Парабола пересекает ось Ox в точках } x_1 = ${x1} \\text{ и } x_2 = ${x2}.`);
        steps.push(`\\text{Так как } a = ${a} > 0, \\text{ то ветви параболы направлены вверх, и } f(x) > 0 \\text{ при } x < ${x1} \\text{ или } x > ${x2}.`);
        steps.push(`\\text{Поэтому решением неравенства } ${inequalityStr} \\text{ является: } x \\in (-\\infty; ${x1}) \\cup (${x2}; +\\infty)`);
      } else {
        steps.push(`\\text{Парабола пересекает ось Ox в точках } x_1 = ${x1} \\text{ и } x_2 = ${x2}.`);
        steps.push(`\\text{Так как } a = ${a} > 0, \\text{ то ветви параболы направлены вверх, и } f(x) < 0 \\text{ при } ${x1} < x < ${x2}.`);
        steps.push(`\\text{Поэтому решением неравенства } ${inequalityStr} \\text{ является: } x \\in (${x1}; ${x2})`);
      }
    } else {
      if (operator === '>' || operator === '>=') {
        steps.push(`\\text{Парабола пересекает ось Ox в точках } x_1 = ${x1} \\text{ и } x_2 = ${x2}.`);
        steps.push(`\\text{Так как } a = ${a} < 0, \\text{ то ветви параболы направлены вниз, и } f(x) > 0 \\text{ при } ${x1} < x < ${x2}.`);
        steps.push(`\\text{Поэтому решением неравенства } ${inequalityStr} \\text{ является: } x \\in (${x1}; ${x2})`);
      } else {
        steps.push(`\\text{Парабола пересекает ось Ox в точках } x_1 = ${x1} \\text{ и } x_2 = ${x2}.`);
        steps.push(`\\text{Так как } a = ${a} < 0, \\text{ то ветви параболы направлены вниз, и } f(x) < 0 \\text{ при } x < ${x1} \\text{ или } x > ${x2}.`);
        steps.push(`\\text{Поэтому решением неравенства } ${inequalityStr} \\text{ является: } x \\in (-\\infty; ${x1}) \\cup (${x2}; +\\infty)`);
      }
    }
  }
  
  return steps;
}

/**
 * Генерирует пошаговое решение для линейного неравенства
 * @param {Object} params - Параметры неравенства
 * @returns {Array} Массив шагов решения
 */
function generateLinearInequalitySolution(params) {
  const { a, b, operator } = params;
  const steps = [];
  
  // Формирование неравенства
  const inequalityStr = `${a}x ${b >= 0 ? '+' : ''}${b} ${operator} 0`;
  steps.push(`\\text{Дано линейное неравенство: } ${inequalityStr}`);
  
  // Шаг 1: Проверяем коэффициент при x
  steps.push(`\\text{Шаг 1: Проверяем коэффициент при } x:`);
  
  if (a === 0) {
    // Случай когда a = 0
    steps.push(`\\text{Коэффициент при } x \\text{ равен нулю, поэтому неравенство принимает вид: } ${b} ${operator} 0`);
    
    if ((b > 0 && (operator === '<' || operator === '<=')) || 
        (b < 0 && (operator === '>' || operator === '>='))) {
      steps.push(`\\text{Неравенство } ${b} ${operator} 0 \\text{ ложно при любом } x, \\text{ поэтому решений нет: } \\emptyset`);
    } else if ((b > 0 && (operator === '>' || operator === '>=')) || 
               (b < 0 && (operator === '<' || operator === '<='))) {
      steps.push(`\\text{Неравенство } ${b} ${operator} 0 \\text{ истинно при любом } x, \\text{ поэтому решение: } x \\in \\mathbb{R}`);
    } else if (b === 0) {
      if (operator === '>' || operator === '<') {
        steps.push(`\\text{Неравенство } 0 ${operator} 0 \\text{ ложно при любом } x, \\text{ поэтому решений нет: } \\emptyset`);
      } else {
        steps.push(`\\text{Неравенство } 0 ${operator} 0 \\text{ истинно при любом } x, \\text{ поэтому решение: } x \\in \\mathbb{R}`);
      }
    }
  } else {
    // Случай когда a ≠ 0
    steps.push(`\\text{Коэффициент при } x \\text{ не равен нулю: } a = ${a}`);
    
    // Шаг 2: Решаем соответствующее уравнение
    steps.push(`\\text{Шаг 2: Находим точку пересечения с осью Ox, решая уравнение: } ${a}x ${b >= 0 ? '+' : ''}${b} = 0`);
    steps.push(`${a}x = ${-b}`);
    
    const x = -b / a;
    steps.push(`x = \\frac{${-b}}{${a}} = ${x.toFixed(4)}`);
    
    // Шаг 3: Определяем решение неравенства
    steps.push(`\\text{Шаг 3: Определяем решение неравенства } ${inequalityStr}:`);
    
    if (a > 0) {
      if (operator === '>' || operator === '>=') {
        const includeEqual = operator === '>=';
        steps.push(`\\text{Так как } a = ${a} > 0, \\text{ то неравенство эквивалентно: } x ${includeEqual ? '\\geq' : '>'} ${x.toFixed(4)}`);
        steps.push(`\\text{Решение: } x \\in (${includeEqual ? x.toFixed(4) : `${x.toFixed(4)}`}; +\\infty)`);
      } else { // <, <=
        const includeEqual = operator === '<=';
        steps.push(`\\text{Так как } a = ${a} > 0, \\text{ то неравенство эквивалентно: } x ${includeEqual ? '\\leq' : '<'} ${x.toFixed(4)}`);
        steps.push(`\\text{Решение: } x \\in (-\\infty; ${includeEqual ? x.toFixed(4) : `${x.toFixed(4)}`})`);
      }
    } else { // a < 0
      if (operator === '>' || operator === '>=') {
        const includeEqual = operator === '>=';
        steps.push(`\\text{Так как } a = ${a} < 0, \\text{ то неравенство эквивалентно: } x ${includeEqual ? '\\leq' : '<'} ${x.toFixed(4)}`);
        steps.push(`\\text{Решение: } x \\in (-\\infty; ${includeEqual ? x.toFixed(4) : `${x.toFixed(4)}`})`);
      } else { // <, <=
        const includeEqual = operator === '<=';
        steps.push(`\\text{Так как } a = ${a} < 0, \\text{ то неравенство эквивалентно: } x ${includeEqual ? '\\geq' : '>'} ${x.toFixed(4)}`);
        steps.push(`\\text{Решение: } x \\in (${includeEqual ? x.toFixed(4) : `${x.toFixed(4)}`}; +\\infty)`);
      }
    }
  }
  
  return steps;
}

/**
 * Генерирует пошаговое решение для рационального неравенства
 * @param {Object} params - Параметры неравенства
 * @returns {Array} Массив шагов решения
 */
function generateRationalInequalitySolution(params) {
  const { numerator, denominator, operator } = params;
  const steps = [];
  
  // Формирование неравенства
  const numeratorStr = typeof numerator === 'object' 
    ? `${numerator.a}x ${numerator.b >= 0 ? '+' : ''}${numerator.b}` 
    : numerator;
  
  const denominatorStr = typeof denominator === 'object'
    ? `${denominator.a}x ${denominator.b >= 0 ? '+' : ''}${denominator.b}`
    : denominator;
  
  const inequalityStr = `\\frac{${numeratorStr}}{${denominatorStr}} ${operator} 0`;
  steps.push(`\\text{Дано рациональное неравенство: } ${inequalityStr}`);
  
  // Шаг 1: Находим корни числителя
  steps.push(`\\text{Шаг 1: Находим корни числителя, решая уравнение: } ${numeratorStr} = 0`);
  
  let numeratorRoots = [];
  if (typeof numerator === 'object') {
    if (numerator.a !== 0) {
      const x = -numerator.b / numerator.a;
      numeratorRoots.push(x);
      steps.push(`${numerator.a}x ${numerator.b >= 0 ? '+' : ''}${numerator.b} = 0`);
      steps.push(`${numerator.a}x = ${-numerator.b}`);
      steps.push(`x = \\frac{${-numerator.b}}{${numerator.a}} = ${x.toFixed(4)}`);
    } else if (numerator.b === 0) {
      steps.push(`\\text{Числитель тождественно равен нулю.}`);
    } else {
      steps.push(`\\text{Числитель равен константе } ${numerator.b} \\neq 0, \\text{ поэтому нет корней.}`);
    }
  } else {
    steps.push(`\\text{Для вычисления корней числителя требуется привести выражение } ${numeratorStr} \\text{ к стандартному виду.}`);
  }
  
  // Шаг 2: Находим точки разрыва (корни знаменателя)
  steps.push(`\\text{Шаг 2: Находим точки разрыва, решая уравнение: } ${denominatorStr} = 0`);
  
  let denominatorRoots = [];
  if (typeof denominator === 'object') {
    if (denominator.a !== 0) {
      const x = -denominator.b / denominator.a;
      denominatorRoots.push(x);
      steps.push(`${denominator.a}x ${denominator.b >= 0 ? '+' : ''}${denominator.b} = 0`);
      steps.push(`${denominator.a}x = ${-denominator.b}`);
      steps.push(`x = \\frac{${-denominator.b}}{${denominator.a}} = ${x.toFixed(4)}`);
    } else if (denominator.b === 0) {
      steps.push(`\\text{Знаменатель тождественно равен нулю, что недопустимо.}`);
      steps.push(`\\text{Неравенство не имеет смысла, так как нельзя делить на нуль.}`);
      return steps;
    } else {
      steps.push(`\\text{Знаменатель равен константе } ${denominator.b} \\neq 0, \\text{ поэтому точек разрыва нет.}`);
    }
  } else {
    steps.push(`\\text{Для вычисления точек разрыва требуется привести выражение } ${denominatorStr} \\text{ к стандартному виду.}`);
  }
  
  // Шаг 3: Разбиваем числовую прямую на интервалы
  steps.push(`\\text{Шаг 3: Разбиваем числовую прямую на интервалы с помощью корней числителя и знаменателя:}`);
  
  const criticalPoints = [...numeratorRoots, ...denominatorRoots].sort((a, b) => a - b);
  
  if (criticalPoints.length === 0) {
    steps.push(`\\text{Нет критических точек, функция сохраняет знак на всей числовой прямой.}`);
    
    // Определяем знак дроби для одной тестовой точки
    let testPoint = 0;
    // Если знаменатель равен 0 в точке 0, используем другую тестовую точку
    if (denominatorRoots.includes(0)) {
      testPoint = 1;
    }
    
    let signAtTestPoint;
    if (typeof numerator === 'object' && typeof denominator === 'object') {
      const numValue = numerator.a * testPoint + numerator.b;
      const denomValue = denominator.a * testPoint + denominator.b;
      signAtTestPoint = (numValue / denomValue) > 0;
    } else {
      signAtTestPoint = true; // Предположим, что положительно
      steps.push(`\\text{Для определения знака дроби на всей числовой прямой нужно вычислить значение в тестовой точке.}`);
    }
    
    if ((signAtTestPoint && (operator === '>' || operator === '>=')) || 
        (!signAtTestPoint && (operator === '<' || operator === '<='))) {
      steps.push(`\\text{Дробь сохраняет ${signAtTestPoint ? 'положительный' : 'отрицательный'} знак на всей области определения.}`);
      steps.push(`\\text{Поэтому решением неравенства } ${inequalityStr} \\text{ является: } x \\in \\mathbb{R} ${denominatorRoots.length > 0 ? `\\setminus \\{${denominatorRoots.map(r => r.toFixed(4)).join(', ')}\\}` : ''}`);
    } else {
      steps.push(`\\text{Дробь сохраняет ${signAtTestPoint ? 'положительный' : 'отрицательный'} знак на всей области определения.}`);
      steps.push(`\\text{Поэтому неравенство } ${inequalityStr} \\text{ не имеет решений: } \\emptyset`);
    }
  } else {
    steps.push(`\\text{Критические точки: } ${criticalPoints.map(p => p.toFixed(4)).join(', ')}`);
    steps.push(`\\text{Они разбивают числовую прямую на следующие интервалы:}`);
    
    // Формируем интервалы
    const intervals = [];
    intervals.push(`(-\\infty; ${criticalPoints[0].toFixed(4)})`);
    
    for (let i = 0; i < criticalPoints.length - 1; i++) {
      intervals.push(`(${criticalPoints[i].toFixed(4)}; ${criticalPoints[i + 1].toFixed(4)})`);
    }
    
    intervals.push(`(${criticalPoints[criticalPoints.length - 1].toFixed(4)}; +\\infty)`);
    
    steps.push(intervals.join(', '));
    steps.push(`\\text{Для каждого интервала определим знак дроби, выбрав тестовую точку внутри интервала.}`);
    steps.push(`\\text{Затем выберем те интервалы, где выполняется условие неравенства } ${operator} 0.`);
    
    // В полной реализации нужно определить знак на каждом интервале
    // и выбрать те интервалы, где выполняется условие неравенства
    steps.push(`\\text{Для полного решения требуется проверить знак дроби в каждом интервале.}`);
  }
  
  return steps;
}

/**
 * Заглушки для других типов неравенств - можно реализовать по мере необходимости
 */
function generateExponentialInequalitySolution(params) {
  return [`\\text{Решение экспоненциального неравенства будет реализовано в будущих обновлениях.}`];
}

function generateLogarithmicInequalitySolution(params) {
  return [`\\text{Решение логарифмического неравенства будет реализовано в будущих обновлениях.}`];
}

function generateTrigonometricInequalitySolution(params) {
  return [`\\text{Решение тригонометрического неравенства будет реализовано в будущих обновлениях.}`];
} 