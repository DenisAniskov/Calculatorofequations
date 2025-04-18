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