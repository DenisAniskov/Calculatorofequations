import * as math from 'mathjs';

// Утилиты для расширенного решения уравнений с параметрами

/**
 * Форматирует уравнение для отображения в LaTeX
 */
export const formatEquationAsLatex = (type, a, b, c, d, p, q, r) => {
  switch (type) {
    case 'quadratic':
      return `${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0, \\text{при } p = ${p}`;
    case 'linear':
      return `${a}x ${b >= 0 ? '+' : ''}${b} = 0, \\text{при } p = ${p}`;
    case 'rational':
      return `\\frac{${a}x ${b >= 0 ? '+' : ''}${b}}{${c}x ${d >= 0 ? '+' : ''}${d}} = 0, \\text{при } p = ${p}`;
    case 'exponential':
      return `${a}e^{${b}x} ${c >= 0 ? '+' : ''}${c} = 0, \\text{при } p = ${p}`;
    case 'logarithmic':
      return `${a}\\ln(${b}x ${c >= 0 ? '+' : ''}${c}) = 0, \\text{при } p = ${p}`;
    case 'trigonometric':
      return `${a}\\sin(${b}x ${c >= 0 ? '+' : ''}${c}) = 0, \\text{при } p = ${p}`;
    case 'cubic':
      return `${a}x^3 ${b >= 0 ? '+' : ''}${b}x^2 ${c >= 0 ? '+' : ''}${c}x ${d >= 0 ? '+' : ''}${d} = 0, \\text{при } p = ${p}`;
    case 'system':
      return `\\begin{cases} 
        ${a}x ${b >= 0 ? '+' : ''}${b}y = 0 \\\\
        ${c}x ${d >= 0 ? '+' : ''}${d}y = 0
      \\end{cases}, \\text{при } p = ${p}`;
    default:
      return '';
  }
};

/**
 * Генерирует визуализацию для уравнения
 */
export const generateVisualizationData = (type, a, b, c, d, p, q, r) => {
  const points = [];
  const step = 0.2;
  const range = 10;
  
  for (let x = -range; x <= range; x += step) {
    let y;
    
    try {
      switch (type) {
        case 'quadratic':
          y = a * x * x + b * x + c;
          break;
        case 'linear':
          y = a * x + b;
          break;
        case 'rational':
          // Избегаем деления на ноль
          if (Math.abs(c * x + d) < 0.001) continue;
          y = (a * x + b) / (c * x + d);
          break;
        case 'exponential':
          y = a * Math.exp(b * x) + c;
          break;
        case 'logarithmic':
          // Проверка области определения логарифма
          if (b * x + c <= 0) continue;
          y = a * Math.log(b * x + c);
          break;
        case 'trigonometric':
          y = a * Math.sin(b * x + c);
          break;
        case 'cubic':
          y = a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;
          break;
        default:
          y = 0;
      }
      
      // Добавляем точку только если значение в разумных пределах
      if (!isNaN(y) && isFinite(y) && Math.abs(y) <= 20) {
        points.push({ x, y });
      }
    } catch (e) {
      // Пропускаем ошибки вычислений
      continue;
    }
  }
  
  return points;
};

/**
 * Генерирует пошаговое решение уравнения
 */
export const generateStepByStepSolution = (type, a, b, c, d, p, q, r) => {
  const steps = [];
  
  switch (type) {
    case 'quadratic':
      steps.push(`Рассмотрим квадратное уравнение: ${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0 при p = ${p}`);
      
      steps.push(`Шаг 1: Вычислим дискриминант: D = ${b}^2 - 4 \\cdot ${a} \\cdot ${c} = ${b*b - 4*a*c}`);
      
      const D = b*b - 4*a*c;
      
      if (D > 0) {
        const x1 = (-b + Math.sqrt(D)) / (2 * a);
        const x2 = (-b - Math.sqrt(D)) / (2 * a);
        
        steps.push(`Шаг 2: Дискриминант положительный, находим два корня:`);
        steps.push(`x_1 = \\frac{-${b} + \\sqrt{${D}}}{2 \\cdot ${a}} = ${x1.toFixed(4)}`);
        steps.push(`x_2 = \\frac{-${b} - \\sqrt{${D}}}{2 \\cdot ${a}} = ${x2.toFixed(4)}`);
        steps.push(`Ответ: x = ${x1.toFixed(4)} или x = ${x2.toFixed(4)}`);
      } else if (D === 0) {
        const x = -b / (2 * a);
        steps.push(`Шаг 2: Дискриминант равен нулю, находим один корень:`);
        steps.push(`x = \\frac{-${b}}{2 \\cdot ${a}} = ${x.toFixed(4)}`);
        steps.push(`Ответ: x = ${x.toFixed(4)}`);
      } else {
        steps.push(`Шаг 2: Дискриминант отрицательный, действительных корней нет`);
        steps.push(`Ответ: нет действительных корней`);
      }
      break;
      
    case 'linear':
      steps.push(`Рассмотрим линейное уравнение: ${a}x ${b >= 0 ? '+' : ''}${b} = 0 при p = ${p}`);
      
      if (a === 0) {
        if (b === 0) {
          steps.push(`Шаг 1: Коэффициенты a и b равны нулю`);
          steps.push(`Ответ: x - любое число (тождество)`);
        } else {
          steps.push(`Шаг 1: Коэффициент a равен нулю, уравнение ${b} = 0 не имеет решений`);
          steps.push(`Ответ: нет решений`);
        }
      } else {
        steps.push(`Шаг 1: Перенесем все слагаемые, кроме ax, в правую часть: ${a}x = ${-b}`);
        steps.push(`Шаг 2: Делим обе части на ${a}: x = ${-b} / ${a} = ${(-b/a).toFixed(4)}`);
        steps.push(`Ответ: x = ${(-b/a).toFixed(4)}`);
      }
      break;
      
    // Другие типы уравнений...
      
    default:
      steps.push(`Для данного типа уравнения пошаговое решение не реализовано`);
  }
  
  return steps;
};

/**
 * Находит область определения выражения
 */
export const findDomain = (type, a, b, c, d) => {
  let domain = "x ∈ ℝ"; // По умолчанию - все действительные числа
  
  switch (type) {
    case 'rational':
      domain = `x ≠ ${(-d/c).toFixed(4)}`;
      break;
    case 'logarithmic':
      domain = c >= 0 
        ? `x > ${(-c/b).toFixed(4)}`
        : `x < ${(-c/b).toFixed(4)}`;
      break;
    case 'irrational':
      domain = b >= 0 
        ? `x ≥ ${(-b/a).toFixed(4)}`
        : `x ≤ ${(-b/a).toFixed(4)}`;
      break;
  }
  
  return domain;
};

/**
 * Генерирует рекомендации для решения уравнения
 */
export const generateRecommendations = (type, a, b, c, d, p) => {
  const recommendations = [];
  
  switch (type) {
    case 'quadratic':
      recommendations.push("Используйте формулу дискриминанта для нахождения корней");
      if (c === 0) recommendations.push("Один из корней уравнения равен нулю, вынесите x за скобки");
      if (a === 1 && c === 1) recommendations.push("Рассмотрите виет для подбора корней");
      break;
    case 'linear':
      recommendations.push("Переместите все члены с x влево, остальные вправо");
      recommendations.push("Выразите x, разделив на коэффициент");
      break;
    case 'rational':
      recommendations.push("Определите область допустимых значений");
      recommendations.push("Умножьте обе части на знаменатель, но учтите знак функции в нулях знаменателя");
      break;
  }
  
  // Добавляем рекомендации, связанные с параметром
  if (p !== 0) {
    recommendations.push(`Рассмотрите значение параметра p = ${p} и его влияние на решение`);
    recommendations.push("Исследуйте, как меняется решение при разных значениях параметра");
  }
  
  return recommendations;
};

/**
 * Экспортирует решение в формат для печати
 */
export const prepareSolutionForExport = (equation, steps, domain, roots) => {
  return {
    title: "Решение уравнения с параметром",
    equation,
    domain,
    steps,
    roots,
    timestamp: new Date().toISOString()
  };
}; 