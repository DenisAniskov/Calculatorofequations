// Функция для создания PDF-документа из решения
export const exportSolutionToPDF = (solution) => {
  // Создаем новый документ
  const doc = document.createElement('div');
  doc.className = 'pdf-document';
  
  // Добавляем стили
  const style = document.createElement('style');
  style.textContent = `
    .pdf-document {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .pdf-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .pdf-content {
      line-height: 1.6;
    }
    .pdf-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  `;
  doc.appendChild(style);

  // Создаем содержимое
  const content = `
    <div class="pdf-header">
      <h1>Решение неравенства с параметром</h1>
      <p>Дата: ${new Date(solution.timestamp).toLocaleDateString('ru-RU')}</p>
    </div>
    
    <div class="pdf-content">
      <h2>Неравенство:</h2>
      <p>${solution.inequality}</p>
      
      <h2>Параметр:</h2>
      <p>${solution.parameter}</p>
      
      <h2>Решение:</h2>
      ${solution.steps.map(step => `
        <div class="step">
          <p>${step.explanation}</p>
          ${step.latex ? `<div class="latex">${step.latex}</div>` : ''}
        </div>
      `).join('')}
    </div>
    
    <div class="pdf-footer">
      <p>Создано с помощью Калькулятора неравенств с параметрами</p>
    </div>
  `;
  
  doc.innerHTML += content;

  // Создаем временный элемент для печати
  const printWindow = window.open('', '_blank');
  printWindow.document.write(doc.outerHTML);
  printWindow.document.close();

  // Печатаем документ
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

// Функция для экспорта нескольких решений
export const exportMultipleSolutionsToPDF = (solutions) => {
  const doc = document.createElement('div');
  doc.className = 'pdf-document';
  
  const style = document.createElement('style');
  style.textContent = `
    .pdf-document {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .pdf-header {
      text-align: center;
      margin-bottom: 20px;
      page-break-before: always;
    }
    .pdf-content {
      line-height: 1.6;
    }
    .pdf-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .solution {
      margin-bottom: 40px;
      page-break-after: always;
    }
  `;
  doc.appendChild(style);

  // Добавляем каждое решение
  solutions.forEach((solution, index) => {
    const solutionContent = `
      <div class="solution">
        <div class="pdf-header">
          <h1>Решение #${index + 1}</h1>
          <p>Дата: ${new Date(solution.timestamp).toLocaleDateString('ru-RU')}</p>
        </div>
        
        <div class="pdf-content">
          <h2>Неравенство:</h2>
          <p>${solution.inequality}</p>
          
          <h2>Параметр:</h2>
          <p>${solution.parameter}</p>
          
          <h2>Решение:</h2>
          ${solution.steps.map(step => `
            <div class="step">
              <p>${step.explanation}</p>
              ${step.latex ? `<div class="latex">${step.latex}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    doc.innerHTML += solutionContent;
  });

  // Добавляем футер
  doc.innerHTML += `
    <div class="pdf-footer">
      <p>Создано с помощью Калькулятора неравенств с параметрами</p>
      <p>Всего решений: ${solutions.length}</p>
    </div>
  `;

  // Создаем временный элемент для печати
  const printWindow = window.open('', '_blank');
  printWindow.document.write(doc.outerHTML);
  printWindow.document.close();

  // Печатаем документ
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}; 