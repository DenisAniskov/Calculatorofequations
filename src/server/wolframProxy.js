const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

// Настройка CORS для взаимодействия с фронтендом
app.use(cors());
app.use(bodyParser.json());

// Wolfram Alpha API ключ
const WOLFRAM_APP_ID = 'AKXPY8-5LH3UQ4JJ4';
const BASE_URL = 'https://api.wolframalpha.com/v2/query';

// Обработчик запросов к Wolfram Alpha API
app.post('/api/wolfram', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Не указан параметр запроса' 
      });
    }
    
    const params = new URLSearchParams({
      input: query,
      appid: WOLFRAM_APP_ID,
      format: 'plaintext,image',
      output: 'json',
      ...options
    });
    
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ошибка при запросе к Wolfram Alpha:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Ошибка сервера' 
    });
  }
});

// Эндпоинт здоровья сервера
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Wolfram Alpha прокси-сервер запущен на порту ${port}`);
});

module.exports = app; 