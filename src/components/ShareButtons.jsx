import React, { useState } from 'react';
import AccessibleButton from './AccessibleButton';
import { shareSolution, shareToSocialNetwork } from '../utils/share';

const ShareButtons = ({ solution }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const handleShare = async () => {
    try {
      await shareSolution(solution);
      setShareStatus('success');
      setTimeout(() => setShareStatus(''), 3000);
    } catch (error) {
      setShareStatus('error');
      setTimeout(() => setShareStatus(''), 3000);
    }
  };

  const handleSocialShare = (network) => {
    const url = shareToSocialNetwork(network, solution);
    window.open(url, '_blank');
  };

  return (
    <div className="relative">
      <AccessibleButton
        variant="outline"
        onClick={() => setShowShareMenu(!showShareMenu)}
        tooltipText="Поделиться"
        icon="↗️"
      >
        Поделиться
      </AccessibleButton>

      {showShareMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={handleShare}
          >
            Копировать ссылку
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => handleSocialShare('telegram')}
          >
            Telegram
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => handleSocialShare('vk')}
          >
            ВКонтакте
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => handleSocialShare('twitter')}
          >
            Twitter
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => handleSocialShare('facebook')}
          >
            Facebook
          </button>
        </div>
      )}

      {shareStatus && (
        <div className={`absolute right-0 mt-2 px-4 py-2 rounded-lg ${
          shareStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {shareStatus === 'success' ? 'Ссылка скопирована!' : 'Ошибка при копировании'}
        </div>
      )}
    </div>
  );
};

export default ShareButtons; 