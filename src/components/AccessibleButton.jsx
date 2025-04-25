import React from 'react';

/**
 * Компонент доступной кнопки с поддержкой всех необходимых атрибутов доступности
 * 
 * @param {object} props - Свойства компонента
 * @param {string} props.label - Текст кнопки
 * @param {function} props.onClick - Обработчик клика
 * @param {string} props.ariaLabel - Описание для скринридеров
 * @param {boolean} props.disabled - Флаг отключения кнопки
 * @param {string} props.className - Дополнительные классы стилей
 * @param {string} props.variant - Вариант кнопки (primary, secondary, danger, success)
 * @param {string} props.size - Размер кнопки (sm, md, lg)
 * @param {boolean} props.outlined - Флаг контурной кнопки
 * @param {React.ReactNode} props.icon - Иконка кнопки
 */
const AccessibleButton = ({
  label,
  onClick,
  ariaLabel,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  outlined = false,
  icon,
  ...props
}) => {
  // Базовые классы
  const baseClasses = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Классы для вариантов
  const variantClasses = {
    primary: outlined 
      ? 'border border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30 focus:ring-blue-500'
      : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-blue-500',
    secondary: outlined
      ? 'border border-gray-500 text-gray-700 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-500'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus:ring-gray-500',
    danger: outlined
      ? 'border border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30 focus:ring-red-500'
      : 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500',
    success: outlined
      ? 'border border-green-500 text-green-500 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/30 focus:ring-green-500'
      : 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 focus:ring-green-500',
  };
  
  // Классы для размеров
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Классы для отключенного состояния
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';
  
  // Собираем все классы
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${disabledClasses}
    ${className}
  `;
  
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      <div className="flex items-center justify-center">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
    </button>
  );
};

export default AccessibleButton; 