# Калькулятор неравенств с параметрами

Веб-приложение для решения математических неравенств с параметрами, построенное с использованием React и SymPy.

## Возможности

- Решение квадратных неравенств с параметрами
- Решение линейных неравенств с параметрами
- Решение рациональных неравенств
- Пошаговое решение с подробными объяснениями
- Валидация входных данных
- Поддержка различных типов неравенств (>, <, >=, <=)

## Технологии

- React
- SymPy (для символьных вычислений)
- Tailwind CSS (для стилизации)
- Netlify (для деплоя)

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/inequality-calculator.git
cd inequality-calculator
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите приложение в режиме разработки:
```bash
npm start
```

4. Для сборки production-версии:
```bash
npm run build
```

## Примеры использования

### Квадратное неравенство

```javascript
// Решение квадратного неравенства ax² + bx + c > 0
const params = {
  a: 1,
  b: -5,
  c: 6,
  operator: '>'
};
const solution = solveQuadraticInequality(params);
```

### Линейное неравенство

```javascript
// Решение линейного неравенства ax + b > 0
const params = {
  a: 2,
  b: -4,
  operator: '>'
};
const solution = solveLinearInequality(params);
```

### Рациональное неравенство

```javascript
// Решение рационального неравенства (ax + b)/(cx + d) > 0
const inequality = "(2x + 4)/(x - 2) > 0";
const solution = solveRationalInequality(inequality);
```

## Структура проекта

```
src/
  ├── components/         # React компоненты
  ├── utils/             # Утилиты и математические функции
  ├── styles/            # CSS стили
  └── App.js             # Основной компонент приложения
```

## Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте изменения в ваш форк (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## Лицензия

MIT

## Автор

Ваше имя - [@yourusername](https://github.com/yourusername) 