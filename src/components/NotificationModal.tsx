import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  message,
  type = 'info',
  title,
  onClose,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    error: <AlertCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertCircle className="w-6 h-6 text-yellow-500" />,
    info: <AlertCircle className="w-6 h-6 text-blue-500" />,
  };

  const titleMap = {
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Предупреждение',
    info: 'Информация',
  };

  const icon = iconMap[type];
  const defaultTitle = title || titleMap[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-10">
          <h2 className="text-white font-semibold flex items-center gap-2">
            {icon}
            {defaultTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-300">{message}</p>

          {/* Actions */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
