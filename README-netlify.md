# Деплой на Netlify

Это руководство поможет вам развернуть калькулятор неравенств и уравнений с параметрами на платформе Netlify.

## Подготовка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/DenisAniskov/Calculatorofequations.git
cd Calculatorofequations
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе примера `.env.sample`:
```bash
# Замените YOUR_WOLFRAM_APP_ID на ваш ключ API Wolfram Alpha
VITE_WOLFRAM_APP_ID=YOUR_WOLFRAM_APP_ID
VITE_CORS_PROXY=https://corsproxy.io/?
```

## Локальная сборка и тестирование

1. Запустите локальный сервер разработки:
```bash
npm run dev
```

2. Для локальной сборки и предпросмотра:
```bash
npm run build
npm run preview
```

## Деплой на Netlify

### Способ 1: Использование UI Netlify

1. Зайдите на сайт [Netlify](https://app.netlify.com/)
2. Нажмите "Add new site" > "Import an existing project"
3. Выберите GitHub и авторизуйтесь
4. Выберите репозиторий DenisAniskov/Calculatorofequations
5. Настройки деплоя:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Нажмите "Deploy site"

### Способ 2: Использование нашего скрипта

1. Подготовьте проект к деплою:
```bash
npm run netlify
```

2. Установите Netlify CLI (если еще не установлен):
```bash
npm install -g netlify-cli
```

3. Войдите в свой аккаунт Netlify:
```bash
netlify login
```

4. Деплой на Netlify:
```bash
npm run netlify:deploy
```

### Способ 3: Непрерывный деплой (CI/CD)

1. Настройте в Netlify автоматический деплой при пуше в ветку `main`
2. Добавьте переменные окружения в настройках проекта на Netlify:
   - Ключ: `VITE_WOLFRAM_APP_ID`, Значение: Ваш API ключ Wolfram Alpha
   - Ключ: `VITE_CORS_PROXY`, Значение: `https://corsproxy.io/?`

## Настройка пользовательского домена

1. В панели управления Netlify перейдите в "Domain settings"
2. Нажмите "Add custom domain"
3. Следуйте инструкциям для настройки DNS

## Проблемы и их решение

- **Ошибка сборки**: Убедитесь, что ваша Node.js версии 14+ и выше
- **Ошибки CORS**: Проверьте настройку переменной `VITE_CORS_PROXY`
- **Проблемы с API Wolfram**: Убедитесь, что ваш API ключ активен

## Дополнительные настройки

### Настройка переменных окружения в Netlify

1. В панели управления сайтом на Netlify перейдите в "Site settings" > "Build & deploy" > "Environment"
2. Добавьте необходимые переменные окружения

### Настройка перенаправлений (редиректов)

Файл `_redirects` уже настроен для работы SPA (Single Page Application), но вы можете его модифицировать при необходимости. 