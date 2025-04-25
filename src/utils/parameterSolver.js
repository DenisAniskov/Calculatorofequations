import * as math from 'mathjs';

/**
 * Решает линейное уравнение ax + b = 0
 * @param {number} a - Коэффициент при x
 * @param {number} b - Свободный член
 * @returns {Object} Объект с решением и шагами
 */
export const solveLinearEquation = (a, b) => {
  const steps = [];
  let solution = {};
  
  steps.push(`Решаем линейное уравнение ${a}x + ${b} = 0`);
  
  if (a === 0) {
    if (b === 0) {
      steps.push(`${a}x + ${b} = 0 означает 0 = 0`);
      steps.push(`Уравнение верно при любом x`);
      solution = {
        type: 'infinite',
        solutions: ['x ∈ ℝ'],
        count: Infinity
      };
    } else {
      steps.push(`${a}x + ${b} = 0 означает ${b} = 0`);
      steps.push(`${b} ≠ 0, поэтому уравнение не имеет решений`);
      solution = {
        type: 'empty',
        solutions: [],
        count: 0
      };
    }
  } else {
    steps.push(`${a}x + ${b} = 0`);
    steps.push(`${a}x = ${-b}`);
    const x = -b / a;
    steps.push(`x = ${-b} / ${a} = ${x}`);
    solution = {
      type: 'unique',
      solutions: [x],
      count: 1
    };
  }
  
  return {
    solution,
    steps
  };
};

/**
 * Решает квадратное уравнение ax^2 + bx + c = 0
 * @param {number} a - Коэффициент при x^2
 * @param {number} b - Коэффициент при x
 * @param {number} c - Свободный член
 * @returns {Object} Объект с решением и шагами
 */
export const solveQuadraticEquation = (a, b, c) => {
  const steps = [];
  let solution = {};
  
  steps.push(`Решаем квадратное уравнение ${a}x² + ${b}x + ${c} = 0`);
  
  if (a === 0) {
    // Случай линейного уравнения
    return solveLinearEquation(b, c);
  }
  
  // Вычисляем дискриминант
  const discriminant = b * b - 4 * a * c;
  steps.push(`Вычисляем дискриминант: D = b² - 4ac = ${b}² - 4 · ${a} · ${c} = ${discriminant}`);
  
  if (discriminant < 0) {
    steps.push(`D = ${discriminant} < 0, поэтому уравнение не имеет действительных корней`);
    solution = {
      type: 'empty',
      solutions: [],
      count: 0,
      discriminant
    };
  } else if (discriminant === 0) {
    const x = -b / (2 * a);
    steps.push(`D = 0, поэтому уравнение имеет один корень`);
    steps.push(`x = -b / (2a) = -${b} / (2 · ${a}) = ${x}`);
    solution = {
      type: 'unique',
      solutions: [x],
      count: 1,
      discriminant
    };
  } else {
    const sqrtD = Math.sqrt(discriminant);
    const x1 = (-b + sqrtD) / (2 * a);
    const x2 = (-b - sqrtD) / (2 * a);
    steps.push(`D = ${discriminant} > 0, поэтому уравнение имеет два корня`);
    steps.push(`x₁ = (-b + √D) / (2a) = (-${b} + √${discriminant}) / (2 · ${a}) = ${x1}`);
    steps.push(`x₂ = (-b - √D) / (2a) = (-${b} - √${discriminant}) / (2 · ${a}) = ${x2}`);
    solution = {
      type: 'two',
      solutions: [x1, x2],
      count: 2,
      discriminant
    };
  }
  
  return {
    solution,
    steps
  };
};

/**
 * Решает кубическое уравнение ax^3 + bx^2 + cx + d = 0
 * @param {number} a - Коэффициент при x^3
 * @param {number} b - Коэффициент при x^2
 * @param {number} c - Коэффициент при x
 * @param {number} d - Свободный член
 * @returns {Object} Объект с решением и шагами
 */
export const solveCubicEquation = (a, b, c, d) => {
  const steps = [];
  let solution = {};
  
  steps.push(`Решаем кубическое уравнение ${a}x³ + ${b}x² + ${c}x + ${d} = 0`);
  
  if (a === 0) {
    // Случай квадратного уравнения
    return solveQuadraticEquation(b, c, d);
  }
  
  // Приводим к виду x^3 + px^2 + qx + r = 0
  const p = b / a;
  const q = c / a;
  const r = d / a;
  
  steps.push(`Приводим к виду x³ + px² + qx + r = 0, где p = ${p}, q = ${q}, r = ${r}`);
  
  // Далее применяем метод Кардано или другие методы...
  // Это упрощенная версия, которая использует math.js для вычисления корней
  
  try {
    // Преобразуем в полином и находим корни
    const poly = [a, b, c, d];
    const roots = math.polynomialRoot(poly);
    
    steps.push(`Находим корни уравнения с помощью численных методов`);
    
    // Фильтруем и форматируем решения
    const realRoots = roots
      .filter(root => Math.abs(root.im) < 1e-10)
      .map(root => parseFloat(root.re.toFixed(8)));
    
    if (realRoots.length === 0) {
      steps.push(`Уравнение не имеет действительных корней`);
      solution = {
        type: 'empty',
        solutions: [],
        count: 0
      };
    } else {
      realRoots.forEach((root, index) => {
        steps.push(`x${index + 1} = ${root}`);
      });
      
      solution = {
        type: realRoots.length === 1 ? 'unique' : 'multiple',
        solutions: realRoots,
        count: realRoots.length
      };
    }
  } catch (error) {
    steps.push(`Не удалось найти точное решение: ${error.message}`);
    solution = {
      type: 'error',
      solutions: [],
      count: 0,
      error: error.message
    };
  }
  
  return {
    solution,
    steps
  };
};

/**
 * Решает линейное уравнение с параметром ax + b = 0
 * @param {string|number} a - Коэффициент при x (может содержать параметр)
 * @param {string|number} b - Свободный член (может содержать параметр)
 * @param {string} param - Имя параметра
 * @returns {Object} Объект с решением и шагами
 */
export const solveLinearParametricEquation = (a, b, param) => {
  const steps = [];
  const cases = [];
  
  steps.push(`Решаем линейное уравнение с параметром ${param}: ${a}x + ${b} = 0`);
  
  // Случай 1: a = 0
  steps.push(`Рассмотрим случай, когда коэффициент при x равен 0: ${a} = 0`);
  cases.push({
    condition: `${a} = 0`,
    solution: () => {
      if (b === 0 || b === '0') {
        return {
          type: 'infinite',
          solutions: ['x ∈ ℝ'],
          condition: `${b} = 0`,
          description: 'Бесконечно много решений'
        };
      } else if (typeof b === 'string' && b.includes(param)) {
        return {
          type: 'parametric',
          solutions: ['x ∈ ℝ', `при ${b} = 0`],
          condition: `${b} = 0`,
          description: `Бесконечно много решений при ${b} = 0, нет решений при ${b} ≠ 0`
        };
      } else {
        return {
          type: 'empty',
          solutions: [],
          condition: `${b} ≠ 0`,
          description: 'Нет решений'
        };
      }
    }
  });
  
  // Случай 2: a ≠ 0
  steps.push(`Рассмотрим случай, когда коэффициент при x не равен 0: ${a} ≠ 0`);
  cases.push({
    condition: `${a} ≠ 0`,
    solution: () => {
      return {
        type: 'unique',
        solutions: [`x = -${b}/${a}`],
        description: `Единственное решение`
      };
    }
  });
  
  return {
    steps,
    cases
  };
};

/**
 * Решает квадратное уравнение с параметром ax^2 + bx + c = 0
 * @param {string|number} a - Коэффициент при x^2 (может содержать параметр)
 * @param {string|number} b - Коэффициент при x (может содержать параметр)
 * @param {string|number} c - Свободный член (может содержать параметр)
 * @param {string} param - Имя параметра
 * @returns {Object} Объект с решением и шагами
 */
export const solveQuadraticParametricEquation = (a, b, c, param) => {
  const steps = [];
  const cases = [];
  
  steps.push(`Решаем квадратное уравнение с параметром ${param}: ${a}x² + ${b}x + ${c} = 0`);
  
  // Случай 1: a = 0 (уравнение становится линейным)
  steps.push(`Рассмотрим случай, когда коэффициент при x² равен 0: ${a} = 0`);
  cases.push({
    condition: `${a} = 0`,
    solution: () => {
      steps.push(`В этом случае уравнение становится линейным: ${b}x + ${c} = 0`);
      return solveLinearParametricEquation(b, c, param);
    }
  });
  
  // Случай 2: a ≠ 0 (уравнение остается квадратным)
  steps.push(`Рассмотрим случай, когда коэффициент при x² не равен 0: ${a} ≠ 0`);
  steps.push(`Вычисляем дискриминант: D = ${b}² - 4·${a}·${c}`);
  
  cases.push({
    condition: `${a} ≠ 0`,
    subcases: [
      {
        condition: `D > 0`,
        solution: () => {
          return {
            type: 'two',
            solutions: [
              `x₁ = (-${b} + √D) / (2·${a})`,
              `x₂ = (-${b} - √D) / (2·${a})`
            ],
            description: 'Два различных действительных корня'
          };
        }
      },
      {
        condition: `D = 0`,
        solution: () => {
          return {
            type: 'unique',
            solutions: [`x = -${b} / (2·${a})`],
            description: 'Один действительный корень (кратности 2)'
          };
        }
      },
      {
        condition: `D < 0`,
        solution: () => {
          return {
            type: 'empty',
            solutions: [],
            description: 'Нет действительных корней'
          };
        }
      }
    ]
  });
  
  return {
    steps,
    cases
  };
};

/**
 * Определяет, при каких значениях параметра уравнение имеет заданное количество решений
 * @param {string} equation - Уравнение в виде строки
 * @param {string} parameter - Имя параметра
 * @param {number} solutionCount - Необходимое количество решений (0, 1, 2 или Infinity)
 * @returns {Object} Объект с результатом
 */
export const findParameterValuesForSolutionCount = (equation, parameter, solutionCount) => {
  // Пример упрощенной функции, которая анализирует частные случаи
  // В реальном приложении здесь был бы более сложный алгоритм
  
  const result = {
    parameterValues: [],
    explanation: []
  };
  
  // Пытаемся определить тип уравнения (линейное, квадратное и т.д.)
  if (equation.includes('x^2') || equation.includes('x²')) {
    result.explanation.push(`Уравнение ${equation} является квадратным относительно x`);
    
    // Для квадратного уравнения анализируем дискриминант
    result.explanation.push(`Для квадратного уравнения вида ax² + bx + c = 0 количество решений определяется знаком дискриминанта D = b² - 4ac`);
    
    if (solutionCount === 0) {
      result.explanation.push(`Уравнение не имеет решений, когда D < 0`);
      result.parameterValues.push(`D < 0`);
    } else if (solutionCount === 1) {
      result.explanation.push(`Уравнение имеет ровно одно решение, когда D = 0`);
      result.parameterValues.push(`D = 0`);
    } else if (solutionCount === 2) {
      result.explanation.push(`Уравнение имеет два различных решения, когда D > 0`);
      result.parameterValues.push(`D > 0`);
    } else if (solutionCount === Infinity) {
      result.explanation.push(`Квадратное уравнение не может иметь бесконечно много решений, если коэффициенты конечны`);
      result.parameterValues = [];
    }
  } else {
    // Предполагаем, что это линейное уравнение
    result.explanation.push(`Уравнение ${equation} является линейным относительно x`);
    
    if (solutionCount === 0) {
      result.explanation.push(`Линейное уравнение ax + b = 0 не имеет решений, когда a = 0 и b ≠ 0`);
      result.parameterValues.push(`a = 0, b ≠ 0`);
    } else if (solutionCount === 1) {
      result.explanation.push(`Линейное уравнение ax + b = 0 имеет ровно одно решение, когда a ≠ 0`);
      result.parameterValues.push(`a ≠ 0`);
    } else if (solutionCount === Infinity) {
      result.explanation.push(`Линейное уравнение ax + b = 0 имеет бесконечно много решений, когда a = 0 и b = 0`);
      result.parameterValues.push(`a = 0, b = 0`);
    } else {
      result.explanation.push(`Линейное уравнение не может иметь ровно ${solutionCount} решений`);
      result.parameterValues = [];
    }
  }
  
  return result;
};

/**
 * Определяет области знакопостоянства функции с параметром
 * @param {string} expression - Выражение в виде строки
 * @param {string} parameter - Имя параметра
 * @returns {Object} Объект с результатом
 */
export const findSignConstancyRegions = (expression, parameter) => {
  const result = {
    positive: [],
    negative: [],
    explanation: []
  };
  
  result.explanation.push(`Анализируем знакопостоянство выражения ${expression} в зависимости от параметра ${parameter}`);
  
  // Пример упрощенной реализации для квадратного трехчлена вида ax² + bx + c
  if (expression.match(/(\w+)\^2/) || expression.match(/(\w+)²/)) {
    result.explanation.push(`Выражение содержит квадратичный член, анализируем как квадратный трехчлен`);
    result.explanation.push(`Для квадратного трехчлена вида ax² + bx + c знак определяется знаком коэффициента a и значением дискриминанта D = b² - 4ac`);
    
    result.explanation.push(`Если a > 0, то выражение положительно при x < x₁ или x > x₂, где x₁, x₂ — корни уравнения, если они существуют`);
    result.explanation.push(`Если a < 0, то выражение отрицательно при x < x₁ или x > x₂, где x₁, x₂ — корни уравнения, если они существуют`);
    
    result.positive.push(`a > 0, D < 0 (для всех x)`);
    result.positive.push(`a > 0, D ≥ 0, x < x₁ или x > x₂`);
    result.negative.push(`a < 0, D < 0 (для всех x)`);
    result.negative.push(`a < 0, D ≥ 0, x < x₁ или x > x₂`);
    
  } else if (expression.match(/(\w+)\^3/) || expression.match(/(\w+)³/)) {
    result.explanation.push(`Выражение содержит кубический член, анализируем как кубический полином`);
    result.explanation.push(`Для кубического полинома вида ax³ + bx² + cx + d знак при больших |x| определяется знаком коэффициента a`);
    
    result.positive.push(`a > 0, x → +∞`);
    result.negative.push(`a < 0, x → +∞`);
    result.negative.push(`a > 0, x → -∞`);
    result.positive.push(`a < 0, x → -∞`);
    
  } else {
    // Предполагаем, что это линейная функция
    result.explanation.push(`Выражение анализируется как линейная функция вида ax + b`);
    result.explanation.push(`Линейная функция ax + b меняет знак в точке x = -b/a, если a ≠ 0`);
    
    result.positive.push(`a > 0, x > -b/a`);
    result.positive.push(`a < 0, x < -b/a`);
    result.negative.push(`a > 0, x < -b/a`);
    result.negative.push(`a < 0, x > -b/a`);
  }
  
  return result;
};

/**
 * Решает уравнение с параметром методом замены
 * @param {string} equation - Уравнение в виде строки
 * @param {string} parameter - Имя параметра
 * @returns {Object} Объект с решением и шагами
 */
export const solveParametricEquationBySubstitution = (equation, parameter) => {
  const steps = [];
  const solutions = [];
  
  steps.push(`Решаем уравнение с параметром ${parameter}: ${equation}`);
  
  // Пример простой реализации для некоторых типов замен
  
  // Проверяем на биквадратные уравнения (вида ax⁴ + bx² + c = 0)
  if (equation.includes('x^4') && equation.includes('x^2') && !equation.includes('x^3') && !equation.includes('x^1')) {
    steps.push(`Уравнение имеет вид биквадратного: ax⁴ + bx² + c = 0`);
    steps.push(`Делаем замену t = x²`);
    steps.push(`Получаем квадратное уравнение: at² + bt + c = 0`);
    steps.push(`Решаем полученное квадратное уравнение относительно t`);
    
    solutions.push({
      substitution: 't = x²',
      result: 'Далее решается квадратное уравнение относительно t и производится обратная замена',
      parameterDependency: 'Количество решений зависит от дискриминанта квадратного уравнения'
    });
  } 
  // Проверяем на уравнения с симметрией (вида ax² + bx + c = 0, где b зависит от параметра)
  else if (equation.includes('x^2') && equation.includes(parameter)) {
    steps.push(`Уравнение квадратное с параметром ${parameter}`);
    steps.push(`Анализируем дискриминант D = b² - 4ac в зависимости от параметра ${parameter}`);
    
    solutions.push({
      approach: 'Исследование дискриминанта',
      result: 'Количество решений зависит от знака дискриминанта',
      parameterDependency: 'Нужно найти значения параметра, при которых D > 0, D = 0 или D < 0'
    });
  }
  // Общий случай
  else {
    steps.push(`Для данного уравнения нет стандартной замены`);
    steps.push(`Рекомендуется решать, выделяя различные случаи в зависимости от значений параметра ${parameter}`);
    
    solutions.push({
      approach: 'Общий метод',
      result: 'Решать, рассматривая различные случаи',
      parameterDependency: 'Необходимо проанализировать уравнение для различных значений параметра'
    });
  }
  
  return {
    steps,
    solutions
  };
}; 