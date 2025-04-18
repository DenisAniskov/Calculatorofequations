// Функция для создания URL с параметрами решения
const createShareableUrl = (solution) => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  params.set('inequality', solution.inequality);
  params.set('parameter', solution.parameter);
  return `${baseUrl}?${params.toString()}`;
};

// Функция для копирования в буфер обмена
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Функция для шаринга через Web Share API
export const shareSolution = async (solution) => {
  const url = createShareableUrl(solution);
  const title = 'Решение неравенства с параметром';
  const text = `Неравенство: ${solution.inequality}\nПараметр: ${solution.parameter}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { success: true, method: 'native' };
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }

  // Если Web Share API недоступен, копируем ссылку в буфер обмена
  const copied = await copyToClipboard(url);
  return {
    success: copied,
    method: 'clipboard'
  };
};

// Функция для создания изображения решения для соцсетей
export const createSocialImage = async (solution) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Настраиваем размер канваса
  canvas.width = 1200;
  canvas.height = 630;
  
  // Задаем стили
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  
  // Добавляем заголовок
  ctx.fillText('Решение неравенства с параметром', canvas.width / 2, 100);
  
  // Добавляем неравенство
  ctx.font = '36px Arial';
  ctx.fillText(solution.inequality, canvas.width / 2, 200);
  
  // Добавляем параметр
  ctx.fillText(`Параметр: ${solution.parameter}`, canvas.width / 2, 300);
  
  // Добавляем watermark
  ctx.font = '24px Arial';
  ctx.fillStyle = '#666666';
  ctx.fillText('Калькулятор неравенств с параметрами', canvas.width / 2, canvas.height - 50);
  
  return canvas.toDataURL('image/png');
};

// Функция для шаринга в конкретную соцсеть
export const shareToSocialNetwork = async (solution, network) => {
  const url = encodeURIComponent(createShareableUrl(solution));
  const text = encodeURIComponent(`Решение неравенства: ${solution.inequality}`);
  const title = encodeURIComponent('Решение неравенства с параметром');
  
  const networks = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    vk: `https://vk.com/share.php?url=${url}&title=${title}&description=${text}`,
  };
  
  if (networks[network]) {
    window.open(networks[network], '_blank', 'width=600,height=400');
    return true;
  }
  
  return false;
}; 