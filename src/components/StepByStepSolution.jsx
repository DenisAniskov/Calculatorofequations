import React, { useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import { motion, AnimatePresence } from 'framer-motion';

const StepByStepSolution = ({ steps, darkMode, autoPlay = false, interval = 2000 }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playInterval, setPlayInterval] = useState(null);
  
  // Автоматическое воспроизведение шагов
  useEffect(() => {
    if (isPlaying) {
      const intervalId = setInterval(() => {
        setCurrentStep(step => {
          const nextStep = step + 1;
          if (nextStep >= steps.length) {
            setIsPlaying(false);
            return step;
          }
          return nextStep;
        });
      }, interval);
      
      setPlayInterval(intervalId);
      
      return () => clearInterval(intervalId);
    } else if (playInterval) {
      clearInterval(playInterval);
      setPlayInterval(null);
    }
  }, [isPlaying, steps.length, interval]);
  
  // Переход к следующему шагу
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };
  
  // Переход к предыдущему шагу
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };
  
  // Запуск или остановка воспроизведения
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  if (!steps || steps.length === 0) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        <p>Решение не найдено или недоступно</p>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg overflow-hidden transition-colors duration-200 ${
      darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Панель навигации */}
      <div className={`flex items-center justify-between p-2 border-b ${
        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`p-2 rounded-full transition-colors ${
              currentStep === 0 
                ? (darkMode ? 'text-gray-600' : 'text-gray-400') 
                : (darkMode ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-gray-200')
            }`}
            aria-label="Предыдущий шаг"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={togglePlay}
            className={`p-2 rounded-full transition-colors ${
              darkMode 
                ? 'text-blue-400 hover:bg-gray-800' 
                : 'text-blue-600 hover:bg-gray-200'
            }`}
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className={`p-2 rounded-full transition-colors ${
              currentStep === steps.length - 1 
                ? (darkMode ? 'text-gray-600' : 'text-gray-400') 
                : (darkMode ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-gray-200')
            }`}
            aria-label="Следующий шаг"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Шаг {currentStep + 1} из {steps.length}
        </div>
      </div>
      
      {/* Прогресс-бар */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
        <div 
          className="bg-blue-600 dark:bg-blue-500 h-1 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      {/* Содержимое шага */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-[100px]"
          >
            <MathJax>
              {steps[currentStep]}
            </MathJax>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Навигация по шагам (пуговицы) */}
      <div className="flex justify-center p-4 space-x-2 overflow-x-auto">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-3 h-3 rounded-full ${
              index === currentStep
                ? (darkMode ? 'bg-blue-500' : 'bg-blue-600')
                : (darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400')
            } transition-colors duration-200`}
            aria-label={`Перейти к шагу ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default StepByStepSolution; 