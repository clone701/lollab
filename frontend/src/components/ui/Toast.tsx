import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    // 表示時のアニメーション
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    // 非表示時のアニメーション
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      // アニメーション完了後にonCloseを呼ぶ
      setTimeout(() => {
        onClose();
      }, 300); // アニメーション時間と同じ
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-700',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-8 py-4 rounded-lg shadow-lg transition-all duration-300 min-w-[300px] ${
        isExiting
          ? 'translate-y-20 opacity-0'
          : isEntering
            ? 'translate-y-20 opacity-0'
            : 'translate-y-0 opacity-100'
      }`}
    >
      <p className="text-base">{message}</p>
    </div>
  );
};

export default Toast;
