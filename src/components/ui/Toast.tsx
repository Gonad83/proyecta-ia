import React from 'react';

interface ToastProps {
  toast: { msg: string; ok: boolean } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl pointer-events-none transition-all
      ${toast.ok ? 'bg-white text-black' : 'bg-red-500 text-white'}`}>
      {toast.msg}
    </div>
  );
};
