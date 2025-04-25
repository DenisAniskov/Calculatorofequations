import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { prepareSolutionForExport } from '../utils/equationUtils';
import { MathJax } from 'better-react-mathjax';

const ExportSolution = ({ 
  equation, 
  steps, 
  domain, 
  roots, 
  darkMode,
  onExportStart,
  onExportComplete,
  onExportError 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const exportableContentRef = useRef(null);
  
  // Подготовка данных для экспорта
  const solutionData = prepareSolutionForExport(equation, steps, domain, roots);
  
  // Функция для экспорта в изображение
  const exportAsImage = async () => {
    if (!exportableContentRef.current) return;
    
    try {
      setIsExporting(true);
      if (onExportStart) onExportStart('image');
      
      const dataUrl = await toPng(exportableContentRef.current, { 
        quality: 1,
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      });
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.download = `equation-solution-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      setIsExporting(false);
      if (onExportComplete) onExportComplete('image');
    } catch (error) {
      console.error('Ошибка при экспорте изображения:', error);
      setIsExporting(false);
      if (onExportError) onExportError('image', error.message);
    }
  };
  
  // Функция для экспорта в PDF
  const exportAsPdf = async () => {
    if (!exportableContentRef.current) return;
    
    try {
      setIsExporting(true);
      if (onExportStart) onExportStart('pdf');
      
      const dataUrl = await toPng(exportableContentRef.current, {
        quality: 1,
        backgroundColor: '#ffffff', // Всегда используем белый для PDF
      });
      
      // Создаем PDF документ
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
      });
      
      // Добавляем заголовок
      pdf.setFontSize(16);
      pdf.text('Решение уравнения с параметром', 105, 15, { align: 'center' });
      
      // Добавляем дату
      pdf.setFontSize(10);
      pdf.text(`Дата: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
      
      // Добавляем изображение решения
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 10, 30, pdfWidth, pdfHeight);
      
      // Скачиваем PDF
      pdf.save(`equation-solution-${Date.now()}.pdf`);
      
      setIsExporting(false);
      if (onExportComplete) onExportComplete('pdf');
    } catch (error) {
      console.error('Ошибка при экспорте PDF:', error);
      setIsExporting(false);
      if (onExportError) onExportError('pdf', error.message);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Кнопки экспорта */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportAsImage}
          disabled={isExporting}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            darkMode
              ? 'bg-teal-700 hover:bg-teal-600 text-white disabled:bg-gray-700'
              : 'bg-teal-500 hover:bg-teal-600 text-white disabled:bg-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Сохранить как изображение
        </button>
        
        <button
          onClick={exportAsPdf}
          disabled={isExporting}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            darkMode
              ? 'bg-red-700 hover:bg-red-600 text-white disabled:bg-gray-700'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Сохранить как PDF
        </button>
      </div>
      
      {/* Контент для экспорта (скрытый) */}
      <div className="hidden">
        <div
          ref={exportableContentRef}
          className="p-8 bg-white text-black"
          style={{ width: '800px', minHeight: '600px' }}
        >
          <h1 className="text-3xl font-bold mb-6">Решение уравнения с параметром</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Уравнение:</h2>
            <div className="p-4 bg-gray-100 rounded-lg">
              <MathJax>{equation}</MathJax>
            </div>
          </div>
          
          {domain && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Область определения:</h2>
              <div className="p-4 bg-gray-100 rounded-lg">
                <MathJax>{domain}</MathJax>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Решение:</h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex">
                    <span className="inline-block w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <MathJax>{step}</MathJax>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {roots && roots.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Корни уравнения:</h2>
              <div className="p-4 bg-gray-100 rounded-lg">
                <MathJax>
                  {roots.map((root, index) => (
                    <div key={index}>
                      x_{index + 1} = {root}
                    </div>
                  ))}
                </MathJax>
              </div>
            </div>
          )}
          
          <div className="text-gray-500 text-sm mt-8">
            Сгенерировано: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSolution; 