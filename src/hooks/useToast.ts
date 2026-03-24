import { useState, useCallback } from 'react';

export interface ToastData {
  msg: string;
  ok: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }, []);

  return { toast, showToast };
}
