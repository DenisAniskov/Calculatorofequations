// Скрипт для подготовки деплоя на Netlify
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Проверяем, существует ли папка dist, если нет - создаем
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
  console.log('Создана папка dist');
}

// Создаем файл _redirects в папке dist
const redirectsContent = '/* /index.html 200';
fs.writeFileSync(path.join('dist', '_redirects'), redirectsContent);
console.log('Создан файл _redirects');

// Проверяем и копируем netlify.toml, если он еще не в dist
if (!fs.existsSync(path.join('dist', 'netlify.toml'))) {
  if (fs.existsSync('netlify.toml')) {
    fs.copyFileSync('netlify.toml', path.join('dist', 'netlify.toml'));
    console.log('Скопирован файл netlify.toml');
  }
}

console.log('Подготовка к деплою на Netlify завершена!'); 