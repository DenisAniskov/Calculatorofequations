import React, { useState, useEffect } from 'react'
import InequalityCalculator from './components/InequalityCalculator'
import ParameterEquation from './components/ParameterEquation'
import EnhancedParameterEquation from './components/EnhancedParameterEquation'
import Calculator from './components/Calculator'
import NeuralNetwork from './components/NeuralNetwork'
import NeuralCalculator from './components/NeuralCalculator'
import ParametricNeuralCalculator from './components/ParametricNeuralCalculator'
import ParametricSolver from './components/ParametricSolver'
import ParametricEquationSolver from './components/ParametricEquationSolver'
import * as math from 'mathjs'
import { MathJaxContext } from 'better-react-mathjax'
import './styles.css'

function App() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'inequality')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  const [showHelp, setShowHelp] = useState(false)
  const [calculatorExpression, setCalculatorExpression] = useState('')
  const [calculatorResult, setCalculatorResult] = useState('')
  const [calculatorError, setCalculatorError] = useState(null)
  const [lastUsedTabs, setLastUsedTabs] = useState(
    JSON.parse(localStorage.getItem('lastUsedTabs') || '[]')
  )
  const [appVersion, setAppVersion] = useState('1.3.0')
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorDetails, setErrorDetails] = useState({
    message: '',
    type: '',
    solution: ''
  })

  useEffect(() => {
    // Загружаем настройки из localStorage
    const savedTheme = localStorage.getItem('app_theme')
    const savedTab = localStorage.getItem('last_active_tab')
    const savedTabs = localStorage.getItem('last_used_tabs')
    
    // Проверяем предпочтение темы
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
      localStorage.setItem('app_theme', prefersDark ? 'dark' : 'light')
    }
    
    // Загружаем последнюю активную вкладку
    if (savedTab) {
      setActiveTab(savedTab)
    }
    
    // Загружаем историю вкладок
    if (savedTabs) {
      try {
        setLastUsedTabs(JSON.parse(savedTabs))
      } catch (e) {
        console.error('Ошибка при загрузке истории вкладок:', e)
        setLastUsedTabs([])
      }
    }
    
    // Устанавливаем тему для всего документа
    document.documentElement.classList.toggle('dark', darkMode)
  }, [])
  
  // Обновляем тему при изменении darkMode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('app_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    document.documentElement.classList.toggle('dark', newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)
  }

  const handleCalculator = (expression) => {
    setCalculatorExpression(expression)
    setCalculatorResult('')
    setCalculatorError(null)
    
    if (!expression.trim()) {
      return
    }
    
    try {
      // Используем mathjs для безопасного вычисления
      const result = math.evaluate(expression)
      setCalculatorResult(result)
    } catch (error) {
      console.error('Ошибка вычисления:', error)
      
      let errorMessage = 'Ошибка вычисления'
      let errorType = 'calculation'
      let solution = 'Проверьте синтаксис выражения'
      
      // Анализируем тип ошибки для предоставления конкретной помощи
      if (error.message.includes('Undefined symbol')) {
        const symbol = error.message.match(/Undefined symbol (\w+)/)?.[1]
        errorMessage = `Неизвестный символ: ${symbol || 'неизвестно'}`
        errorType = 'undefined_symbol'
        solution = 'Используйте только известные математические операции и функции'
      } else if (error.message.includes('Unexpected end of expression')) {
        errorMessage = 'Неожиданный конец выражения'
        errorType = 'unexpected_end'
        solution = 'Проверьте выражение на наличие незакрытых скобок или отсутствие операндов'
      } else if (error.message.includes('division by zero')) {
        errorMessage = 'Деление на ноль'
        errorType = 'division_by_zero'
        solution = 'Деление на ноль невозможно. Проверьте делитель в выражении'
      } else if (error.message.includes('Unexpected type')) {
        errorMessage = 'Несовместимые типы данных'
        errorType = 'type_error'
        solution = 'Проверьте, что выражение содержит совместимые операции и операнды'
      }
      
      setCalculatorError({
        message: errorMessage,
        details: error.message,
        type: errorType,
        solution: solution
      })
      
      // Показываем модальное окно с ошибкой
      setErrorDetails({
        message: errorMessage,
        type: errorType,
        solution: solution,
        originalMessage: error.message
      })
      setIsErrorModalOpen(true)
    }
  }
  
  const handleTabChange = (tab) => {
    // Сохраняем текущую вкладку в историю
    if (activeTab !== tab) {
      const updatedTabs = [activeTab, ...lastUsedTabs.filter(t => t !== activeTab)].slice(0, 5)
      setLastUsedTabs(updatedTabs)
      localStorage.setItem('last_used_tabs', JSON.stringify(updatedTabs))
    }
    
    // Устанавливаем новую активную вкладку
    setActiveTab(tab)
    localStorage.setItem('last_active_tab', tab)
  }
  
  // Определяем название текущей вкладки для отображения
  const getTabName = (tabId) => {
    switch (tabId) {
      case 'inequality': return 'Решение неравенств'
      case 'parameter': return 'Уравнения с параметром'
      case 'enhanced-parameter': return 'Продвинутый калькулятор уравнений'
      case 'calculator': return 'Калькулятор'
      case 'neural-calculator': return 'Умный калькулятор'
      case 'neural': return 'Нейронная сеть'
      case 'parametric-neural-calculator': return 'Параметрический нейрокалькулятор'
      case 'parametric-solver': return 'Параметрический решатель'
      case 'parametric-equation-solver': return 'Решатель уравнений с параметром'
      default: return 'Неизвестная вкладка'
    }
  }

  // Компонент для отображения модального окна с ошибкой
  const ErrorModal = () => {
    if (!isErrorModalOpen) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <h3 className="text-xl font-bold mb-2 text-red-500">Ошибка вычисления</h3>
          <p className="mb-4">{errorDetails.message}</p>
          
          <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="font-semibold mb-1">Решение:</h4>
            <p>{errorDetails.solution}</p>
          </div>
          
          {errorDetails.originalMessage && (
            <details className="mb-4">
              <summary className="cursor-pointer text-blue-500 hover:text-blue-600">
                Техническая информация
              </summary>
              <p className={`mt-2 p-2 rounded text-xs font-mono overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                {errorDetails.originalMessage}
              </p>
            </details>
          )}
          
          <div className="flex justify-end">
            <button
              className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              onClick={() => setIsErrorModalOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MathJaxContext>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Математический помощник
                </span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                  v{appVersion}
                </span>
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Создатель: Денис Аниськов
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Переключить тему"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Справка"
              >
                ❓
              </button>
              <a
                href="https://github.com/DenisAniskov/neural-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Открыть проект на GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {showHelp && (
            <div className={`mb-8 p-6 rounded-lg shadow-lg ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}>
              <h2 className="text-xl font-bold mb-4">Как пользоваться приложением</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Решение неравенств</h3>
                  <p>Введите коэффициенты неравенства и выберите тип. Получите решение и график.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Уравнения с параметром</h3>
                  <p>Выберите тип уравнения, введите коэффициенты и параметр. Получите пошаговое решение.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Продвинутый калькулятор уравнений</h3>
                  <p>Улучшенный интерфейс для решения уравнений с параметрами, включая визуализацию и ИИ-подсказки.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Калькулятор</h3>
                  <p>Используйте калькулятор для быстрых вычислений математических выражений.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Умный калькулятор</h3>
                  <p>Инновационный калькулятор с нейронной сетью, которая помогает предсказывать результаты вычислений.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Обучение нейронной сети</h3>
                  <p>Обучите простую нейронную сеть на различных функциях и визуализируйте результаты.</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Подсказки:</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>Используйте темную тему для комфортной работы в темное время суток</li>
                  <li>Ваши настройки автоматически сохраняются в браузере</li>
                  <li>Для большинства калькуляторов доступна история вычислений</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Текущий раздел: {getTabName(activeTab)}
            </h2>
            {lastUsedTabs.length > 0 && (
              <div className="flex flex-wrap items-center">
                <span className={`mr-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Недавно использованные:</span>
                {lastUsedTabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => handleTabChange(tab)}
                    className={`mr-2 mb-2 text-xs px-3 py-1 rounded-full ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {getTabName(tab)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'inequality' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50')
              }`}
              onClick={() => handleTabChange('inequality')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Решение неравенств</h2>
                <span className="text-2xl">📊</span>
              </div>
              <p>Решайте линейные и квадратные неравенства с визуализацией</p>
            </div>

            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'parameter' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50')
              }`}
              onClick={() => handleTabChange('parameter')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Уравнения с параметром</h2>
                <span className="text-2xl">📝</span>
              </div>
              <p>Решайте уравнения с параметром и получайте пошаговое решение</p>
            </div>
            
            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'enhanced-parameter' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')
              }`}
              onClick={() => handleTabChange('enhanced-parameter')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Продвинутый калькулятор уравнений</h2>
                <span className="text-2xl">✨</span>
              </div>
              <p>Улучшенный расчёт уравнений с интерактивной визуализацией и ИИ</p>
            </div>

            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'calculator' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50')
              }`}
              onClick={() => handleTabChange('calculator')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Калькулятор</h2>
                <span className="text-2xl">🔢</span>
              </div>
              <p>Быстрые вычисления математических выражений</p>
            </div>

            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'neural-calculator' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50')
              }`}
              onClick={() => handleTabChange('neural-calculator')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Умный калькулятор</h2>
                <span className="text-2xl">🧠</span>
              </div>
              <p>Калькулятор с нейронной сетью для предсказания результатов</p>
            </div>

            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'neural' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50')
              }`}
              onClick={() => handleTabChange('neural')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Нейронная сеть</h2>
                <span className="text-2xl">🤖</span>
              </div>
              <p>Обучите нейронную сеть на различных функциях</p>
            </div>

            <div
              className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                activeTab === 'parametric-equation-solver' 
                  ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')
              }`}
              onClick={() => handleTabChange('parametric-equation-solver')}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Решатель уравнений с параметром</h2>
                <span className="text-2xl">📊🔍</span>
              </div>
              <p>Решайте различные типы уравнений с параметром с помощью ИИ и Wolfram Alpha</p>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-2 mt-6">
            <button
              onClick={() => handleTabChange('inequality')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'inequality'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Решение неравенств"
            >
              📊
            </button>
            <button
              onClick={() => handleTabChange('parameter')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'parameter'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Уравнения с параметром"
            >
              📝
            </button>
            <button
              onClick={() => handleTabChange('enhanced-parameter')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'enhanced-parameter'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Продвинутый калькулятор уравнений"
            >
              ✨
            </button>
            <button
              onClick={() => handleTabChange('calculator')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'calculator'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Калькулятор"
            >
              🔢
            </button>
            <button
              onClick={() => handleTabChange('neural-calculator')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'neural-calculator'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Умный калькулятор"
            >
              🧠
            </button>
            <button
              onClick={() => handleTabChange('neural')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'neural'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Нейронная сеть"
            >
              🤖
            </button>
            <button
              onClick={() => handleTabChange('parametric-neural-calculator')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'parametric-neural-calculator'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Параметрический нейрокалькулятор"
            >
              📊+🧠
            </button>
            <button
              onClick={() => handleTabChange('parametric-solver')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'parametric-solver'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Параметрический решатель"
            >
              📐
            </button>
            <button
              onClick={() => handleTabChange('parametric-equation-solver')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'parametric-equation-solver'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Решатель уравнений с параметром"
            >
              📊🔍
            </button>
          </div>

          <div className={`mt-8 p-6 rounded-lg shadow-lg ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`}>
            {activeTab === 'inequality' && <InequalityCalculator darkMode={darkMode} />}
            {activeTab === 'parameter' && <ParameterEquation darkMode={darkMode} />}
            {activeTab === 'enhanced-parameter' && <EnhancedParameterEquation darkMode={darkMode} />}
            {activeTab === 'calculator' && (
              <Calculator
                darkMode={darkMode}
                expression={calculatorExpression}
                result={calculatorResult}
                error={calculatorError}
                onCalculate={handleCalculator}
              />
            )}
            {activeTab === 'neural' && <NeuralNetwork darkMode={darkMode} />}
            {activeTab === 'neural-calculator' && <NeuralCalculator darkMode={darkMode} />}
            {activeTab === 'parametric-neural-calculator' && <ParametricNeuralCalculator darkMode={darkMode} />}
            {activeTab === 'parametric-solver' && <ParametricSolver darkMode={darkMode} />}
            {activeTab === 'parametric-equation-solver' && <ParametricEquationSolver darkMode={darkMode} />}
          </div>
          
          <footer className={`mt-12 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>© 2023-2024 Математический помощник с нейронной сетью. Все права защищены.</p>
            <p className="mt-1 text-xs">Приложение использует алгоритмы машинного обучения и технологии Wolfram Alpha API</p>
            <p className="mt-2">Версия {appVersion} | Последнее обновление: {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
        
        {/* Модальное окно с ошибкой */}
        <ErrorModal />
      </div>
    </MathJaxContext>
  )
}

export default App 