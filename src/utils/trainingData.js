// Генерация случайных коэффициентов для квадратного неравенства
const generateRandomCoefficients = () => {
  const a = Math.random() * 10 - 5; // от -5 до 5
  const b = Math.random() * 10 - 5;
  const c = Math.random() * 10 - 5;
  return { a, b, c };
};

// Аугментация данных
const augmentData = (example) => {
  const augmented = [];
  
  // Добавляем небольшие вариации к коэффициентам
  for (let i = 0; i < 3; i++) {
    const variation = {
      input: example.input.map(x => x * (1 + (Math.random() - 0.5) * 0.1)),
      output: example.output
    };
    augmented.push(variation);
  }
  
  return augmented;
};

// Генерация одного примера данных
const generateExample = () => {
  const { a, b, c } = generateRandomCoefficients();
  const inequality = `${a}x^2 + ${b}x + ${c} > 0`;
  
  // Решаем неравенство
  const D = b * b - 4 * a * c;
  let roots = [];
  
  if (D > 0) {
    const x1 = (-b + Math.sqrt(D)) / (2 * a);
    const x2 = (-b - Math.sqrt(D)) / (2 * a);
    roots = [x1, x2].sort((a, b) => a - b);
  } else if (D === 0) {
    const x = -b / (2 * a);
    roots = [x, x];
  } else {
    roots = [0, 0]; // Нет корней
  }
  
  return {
    input: [a, b, c],
    output: roots
  };
};

// Генерация набора обучающих данных
export const generateTrainingData = (count = 1000) => {
  const data = [];
  const types = {
    twoRoots: 0,
    oneRoot: 0,
    noRoots: 0
  };
  
  // Генерируем данные с балансировкой классов
  while (data.length < count) {
    const example = generateExample();
    const D = example.input[1] * example.input[1] - 4 * example.input[0] * example.input[2];
    
    // Балансируем классы
    if (D > 0 && types.twoRoots < count/3) {
      data.push(example);
      types.twoRoots++;
      // Добавляем аугментированные данные
      data.push(...augmentData(example));
    } else if (D === 0 && types.oneRoot < count/3) {
      data.push(example);
      types.oneRoot++;
      data.push(...augmentData(example));
    } else if (D < 0 && types.noRoots < count/3) {
      data.push(example);
      types.noRoots++;
      data.push(...augmentData(example));
    }
  }
  
  return data.slice(0, count);
};

// Разделение данных на обучающую и тестовую выборки
export const splitData = (data, testRatio = 0.2) => {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const testSize = Math.floor(data.length * testRatio);
  
  return {
    train: shuffled.slice(testSize),
    test: shuffled.slice(0, testSize)
  };
}; 