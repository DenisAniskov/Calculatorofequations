import React, { useState, useEffect } from 'react'
import InequalityCalculator from './components/InequalityCalculator'
import ParameterEquation from './components/ParameterEquation'
import Calculator from './components/Calculator'
import NeuralNetwork from './components/NeuralNetwork'

function App() {
  const [activeTab, setActiveTab] = useState('inequality')
  const [darkMode, setDarkMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [calculatorExpression, setCalculatorExpression] = useState('')
  const [calculatorResult, setCalculatorResult] = useState('')

  useEffect(() => {
    // Проверяем предпочтение темы в системе
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleCalculator = () => {
    try {
      // Безопасное вычисление выражения
      const result = Function('"use strict";return (' + calculatorExpression + ')')()
      setCalculatorResult(result.toString())
    } catch (error) {
      setCalculatorResult('Ошибка в выражении')
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Математический помощник
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Создатель: Денис Аниськов
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              ❓
            </button>
            <a
              href="https://github.com/yourusername/inequality-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
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
                <h3 className="font-semibold mb-2">Калькулятор</h3>
                <p>Используйте калькулятор для быстрых вычислений математических выражений.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Обучение нейронной сети</h3>
                <p>Обучите простую нейронную сеть на различных функциях и визуализируйте результаты.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
              darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('inequality')}
          >
            <h2 className="text-xl font-bold mb-4">Решение неравенств</h2>
            <p>Решайте линейные и квадратные неравенства с визуализацией</p>
          </div>

          <div
            className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
              darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('parameter')}
          >
            <h2 className="text-xl font-bold mb-4">Уравнения с параметром</h2>
            <p>Решайте уравнения с параметром и получайте пошаговое решение</p>
          </div>

          <div
            className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
              darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('calculator')}
          >
            <h2 className="text-xl font-bold mb-4">Калькулятор</h2>
            <p>Быстрые вычисления математических выражений</p>
          </div>

          <div
            className={`p-6 rounded-lg shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
              darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('neural')}
          >
            <h2 className="text-xl font-bold mb-4">Нейронная сеть</h2>
            <p>Обучите нейронную сеть на различных функциях</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setActiveTab('inequality')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'inequality'
                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            📊
          </button>
          <button
            onClick={() => setActiveTab('parameter')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'parameter'
                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            📝
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'calculator'
                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            🔢
          </button>
          <button
            onClick={() => setActiveTab('neural')}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === 'neural'
                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            🤖
          </button>
        </div>

        <div className={`mt-8 p-6 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
          {activeTab === 'inequality' && <InequalityCalculator darkMode={darkMode} />}
          {activeTab === 'parameter' && <ParameterEquation darkMode={darkMode} />}
          {activeTab === 'calculator' && (
            <Calculator
              darkMode={darkMode}
              expression={calculatorExpression}
              result={calculatorResult}
              onExpressionChange={setCalculatorExpression}
              onCalculate={handleCalculator}
            />
          )}
          {activeTab === 'neural' && <NeuralNetwork darkMode={darkMode} />}
        </div>
      </div>
    </div>
  )
}

export default App 