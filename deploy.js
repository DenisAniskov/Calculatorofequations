// Скрипт для деплоя на Netlify
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Начинаем подготовку к деплою на Netlify...');

// Проверяем, есть ли папка dist
if (!fs.existsSync('dist')) {
  console.log('📁 Создаем папку dist...');
  fs.mkdirSync('dist');
}

// Проверяем наличие файла _redirects в public
const publicRedirectsPath = path.join('public', '_redirects');
const distRedirectsPath = path.join('dist', '_redirects');

if (!fs.existsSync(publicRedirectsPath)) {
  console.log('🔄 Создаем файл _redirects в папке public...');
  fs.writeFileSync(publicRedirectsPath, '/* /index.html 200');
}

// Копируем _redirects в dist
console.log('🔄 Копируем _redirects в dist...');
fs.copyFileSync(publicRedirectsPath, distRedirectsPath);

// Запускаем сборку проекта
console.log('🔨 Запускаем сборку проекта...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Ошибка при сборке: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`⚠️ Предупреждения при сборке: ${stderr}`);
  }
  
  console.log(`✅ Сборка успешно завершена!`);
  console.log(stdout);
  
  // Проверяем, есть ли файл _redirects в dist после сборки
  if (!fs.existsSync(distRedirectsPath)) {
    console.log('🔄 Копируем _redirects в dist после сборки...');
    fs.copyFileSync(publicRedirectsPath, distRedirectsPath);
  }
  
  console.log('✅ Проект готов к деплою на Netlify!');
  console.log('');
  console.log('📋 Инструкция по деплою:');
  console.log('1. Зайдите на сайт Netlify (https://app.netlify.com/)');
  console.log('2. Нажмите "Add new site" > "Import an existing project"');
  console.log('3. Выберите GitHub и авторизуйтесь');
  console.log('4. Выберите репозиторий DenisAniskov/Calculatorofequations');
  console.log('5. Настройки деплоя:');
  console.log('   - Build command: npm run build');
  console.log('   - Publish directory: dist');
  console.log('6. Нажмите "Deploy site"');
  console.log('');
  console.log('🔗 Или используйте Netlify CLI:');
  console.log('   npx netlify deploy --prod');
}); 