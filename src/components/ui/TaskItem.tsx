import React, { useState } from 'react';
import { GripVertical, CheckCircle2, Circle, CalendarDays, Trash2 } from 'lucide-react';
import type { Task } from '../../types';
import { PRIORITY } from '../../types';
import { formatDueDateUser } from '../../lib/dateUtils';

interface TaskItemProps {
  task: Task;
  draggingId: string | null;
  justCompletedId: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onCyclePriority: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task, draggingId, justCompletedId,
  onDragStart, onDragOver, onDragEnd,
  onToggle, onDelete, onCyclePriority
}) => {
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null);

  const due = task.due_date ? formatDueDateUser(task.due_date) : null;
  const prio = (task.priority || 'medium') as 'high' | 'medium' | 'low';

  const isDragging = draggingId === task.id;
  const isJustCompleted = justCompletedId === task.id;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={e => onDragOver(e, task.id)}
      onDragEnd={onDragEnd}
      className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 select-none
        ${task.is_completed ? 'bg-zinc-950/60 border-white/5 opacity-40' : 'bg-zinc-900/80 border-white/10 hover:border-white/20'}
        ${isDragging ? 'opacity-25 scale-[0.97]' : ''}
        ${isJustCompleted ? 'scale-[1.02] border-green-500/40' : ''}`}
    >
      <GripVertical size={13} className="text-zinc-700 cursor-grab active:cursor-grabbing shrink-0" />

      <button
        onClick={() => onCyclePriority(task)}
        title={`Prioridad ${PRIORITY[prio].label} — click para cambiar`}
        className="shrink-0 p-1"
      >
        <div className={`w-2 h-2 rounded-full ${PRIORITY[prio].color} transition-colors duration-300`} />
      </button>

      <button onClick={() => onToggle(task)} className="shrink-0 transition-transform hover:scale-110">
        {task.is_completed
          ? <CheckCircle2 className="text-green-500" size={16} />
          : <Circle size={16} className="text-zinc-600" />}
      </button>

      <span
        className={`flex-grow text-sm cursor-pointer leading-snug transition-all ${task.is_completed ? 'line-through text-zinc-500' : ''}`}
        onClick={() => onToggle(task)}
      >
        {task.title}
      </span>

      {due && !task.is_completed && (
        <span className={`text-xs font-mono flex items-center gap-0.5 shrink-0 ${due.color}`}>
          <CalendarDays size={10} /> {due.label}
        </span>
      )}

      {confirmTaskId === task.id ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onDelete(task.id)} className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors">Sí</button>
          <span className="text-zinc-700 text-xs">/</span>
          <button onClick={() => setConfirmTaskId(null)} className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">No</button>
        </div>
      ) : (
        <button onClick={() => setConfirmTaskId(task.id)} className="text-zinc-700 hover:text-red-400 transition-colors shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};
