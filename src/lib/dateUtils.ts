import { format, differenceInSeconds, addDays as addDaysFns } from 'date-fns';

export function formatDateTimeLocal(date: Date) {
  // Returns yyyy-MM-ddThh:mm for datetime-local
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatDueDateUser(dateStr: string) {
  // Example implementation that handles standard ES date formatting logic
  const d = new Date(dateStr + 'T00:00:00');
  const dLocal = new Date();
  
  // A simple diff to determine color
  const diffDays = Math.ceil((d.getTime() - dLocal.getTime()) / 86400000);
  
  const label = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  const color = diffDays < 0 ? 'text-red-400' : diffDays <= 2 ? 'text-yellow-400' : 'text-zinc-500';
  
  return { label, color };
}

export function getSecondsLeft(deadline: string | null) {
  if (!deadline) return null;
  return differenceInSeconds(new Date(deadline), new Date());
}

export function formatTimeLeft(seconds: number) {
  if (seconds <= 0) return "TIEMPO AGOTADO";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

export const addDays = addDaysFns;
