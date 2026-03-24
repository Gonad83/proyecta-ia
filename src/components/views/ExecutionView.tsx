import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Trophy, Archive, Link, ExternalLink, CalendarDays, FileText } from 'lucide-react';
import type { Project } from '../../types';
import { PRIORITY } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { TaskItem } from '../ui/TaskItem';
import { getSecondsLeft, formatTimeLeft } from '../../lib/dateUtils';

interface ExecutionViewProps {
  project: Project;
  updateProjectStatus: (id: string, status: string) => void;
  updateProjectLiveUrl: (id: string, url: string) => void;
  updateProjectNotes: (id: string, notes: string) => void;
  onOpenCreate: () => void;
  showToast: (msg: string, ok?: boolean) => void;
  setIsFailedGlobal: (failed: boolean) => void;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  project,
  updateProjectStatus,
  updateProjectLiveUrl,
  updateProjectNotes,
  onOpenCreate,
  showToast,
  setIsFailedGlobal
}) => {
  const {
    tasks, justCompletedId, fetchTasks, addTask, toggleTask,
    deleteTask, cyclePriority, reorderTasks
  } = useTasks(project.id, showToast);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFailed, setIsFailed] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const [editingUrl, setEditingUrl] = useState(false);
  const [liveUrl, setLiveUrl] = useState(project.live_url || '');
  
  const [projectNotes, setProjectNotes] = useState(project.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, project.id]);

  useEffect(() => {
    if (project.deadline) {
      const timer = setInterval(() => {
        const seconds = getSecondsLeft(project.deadline);
        setTimeLeft(seconds);
        const failed = seconds !== null && seconds <= 0;
        setIsFailed(failed);
        setIsFailedGlobal(failed);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [project.deadline, setIsFailedGlobal]);

  // Keyboard shortcut for adding task
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        taskInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addTask(newTaskTitle, newTaskDueDate);
    if (success) {
      setNewTaskTitle('');
      setNewTaskDueDate('');
      taskInputRef.current?.focus();
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateProjectNotes(project.id, projectNotes);
    setSavingNotes(false);
  };

  const handleSaveLiveUrl = async () => {
    await updateProjectLiveUrl(project.id, liveUrl);
    setEditingUrl(false);
  };

  // Drag logic
  const handleDragStart = (id: string) => setDraggingId(id);
  
  const [localTasks, setLocalTasks] = useState(tasks);
  
  // Sync tasks from API to local state
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleLocalDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id === draggingId || dragOverId.current === id) return;
    dragOverId.current = id;
    const dragIdx = localTasks.findIndex(t => t.id === draggingId);
    const overIdx = localTasks.findIndex(t => t.id === id);
    if (dragIdx === -1 || overIdx === -1) return;
    const newTasks = [...localTasks];
    const [removed] = newTasks.splice(dragIdx, 1);
    newTasks.splice(overIdx, 0, removed);
    setLocalTasks(newTasks);
  };

  const handleDragEnd = async () => {
    setDraggingId(null);
    dragOverId.current = null;
    await reorderTasks(localTasks);
  };

  const completedCount = localTasks.filter(t => t.is_completed).length;
  const progressPercent = localTasks.length > 0 ? Math.round((completedCount / localTasks.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-500 shadow-lg ${isFailed ? 'border-red-500 bg-red-900/20' : 'border-white/10 bg-zinc-900/60 backdrop-blur'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-zinc-500 font-mono text-xs tracking-widest uppercase flex items-center gap-2">Proyecto Activo <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div></span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter mt-0.5 truncate">{project.name}</h1>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-xs tracking-widest uppercase mb-0.5">
              <Clock size={11} /> Tiempo restante
            </div>
            <div className={`text-2xl sm:text-3xl font-black tabular-nums transition-colors ${isFailed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {timeLeft !== null ? formatTimeLeft(timeLeft) : '--'}
            </div>
            {isFailed && <div className="mt-1 py-0.5 px-3 bg-red-500 text-white font-bold rounded-full text-xs">DEADLINE SUPERADO</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateProjectStatus(project.id, 'Lanzado')} className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-colors">
              <Trophy size={12} /> <span className="hidden sm:inline">Lanzado</span>
            </button>
            <button onClick={() => updateProjectStatus(project.id, 'Archivado')} className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-zinc-800 border border-white/10 text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">
              <Archive size={12} /> <span className="hidden sm:inline">Archivar</span>
            </button>
            <button onClick={onOpenCreate} className="p-2 text-zinc-500 hover:text-white transition-colors hover:rotate-90 duration-300" title="Nuevo proyecto">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter italic">MICRO-EJECUCIÓN</h2>
            <span className="text-zinc-500 font-mono text-xs bg-zinc-900 px-2 py-1 rounded-md">{completedCount}/{localTasks.length}</span>
          </div>

          {localTasks.length > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-white'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Progreso</span>
                <span className={progressPercent === 100 ? 'text-green-400 font-bold' : ''}>{progressPercent}%{progressPercent === 100 ? ' ✓' : ''}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleAddTask} className="space-y-2 p-1">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  ref={taskInputRef}
                  className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-3.5 pl-10 outline-none focus:border-white/30 transition-all text-sm focus:ring-2 focus:ring-white/10"
                  placeholder="Siguiente paso… (N para enfocar)"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                />
                <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              </div>
              <button type="submit" className="px-5 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shrink-0 active:scale-95 duration-200">
                Agregar
              </button>
            </div>
            <div className="flex items-center gap-2 pl-2 opacity-60 focus-within:opacity-100 transition-opacity">
              <CalendarDays size={12} className="text-zinc-500 shrink-0" />
              <input
                type="date"
                className="bg-transparent border-0 border-b border-transparent focus:border-white/30 px-1 py-1 outline-none text-xs text-zinc-400"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
              />
              <span className="text-zinc-600 text-xs mt-0.5">Fecha límite (opcional)</span>
            </div>
          </form>

          <div className="space-y-2">
            {localTasks.length === 0 && (
              <p className="text-zinc-600 text-sm py-12 text-center border border-dashed border-white/10 rounded-xl bg-zinc-900/20">
                Añade el primer hito a tu MVP. Presiona <kbd className="font-sans px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs ml-1 shadow-sm font-bold">N</kbd>
              </p>
            )}
            {localTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                draggingId={draggingId}
                justCompletedId={justCompletedId}
                onDragStart={handleDragStart}
                onDragOver={handleLocalDragOver}
                onDragEnd={handleDragEnd}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onCyclePriority={cyclePriority}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Compromiso Personal</h2>
            <div className="p-5 rounded-2xl bg-zinc-900/60 italic text-zinc-300 border-l-4 border-white text-sm leading-relaxed shadow-lg">
              "{project.personal_commitment}"
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <FileText size={14} /> Notas de Progreso
            </h2>
            <div className="relative group">
              <textarea
                className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-4 outline-none focus:border-white/30 focus:bg-zinc-900 transition-all h-36 resize-none text-sm text-zinc-300 placeholder:text-zinc-600 shadow-inner"
                placeholder="Bloqueos, decisiones arquitectónicas, ideas espontáneas..."
                value={projectNotes}
                onChange={e => setProjectNotes(e.target.value)}
                onBlur={handleSaveNotes}
              />
              <div className="absolute bottom-3 right-3 text-xs font-medium text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {savingNotes ? 'Guardando...' : 'Autoguardado al salir'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600 bg-zinc-900/40 rounded-xl p-3 border border-white/5">
            <span className="font-semibold uppercase tracking-wider">Prioridad:</span>
            {(['high','medium','low'] as const).map(p => (
              <span key={p} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${PRIORITY[p].color} shadow-sm`} />
                {PRIORITY[p].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2 hover:bg-zinc-900/60 transition-colors">
            <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Problema Resuelto</h3>
            <p className="text-sm leading-relaxed text-zinc-300">{project.problem_solved}</p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2 hover:bg-zinc-900/60 transition-colors">
            <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Definición de MVP</h3>
            <p className="text-sm leading-relaxed text-zinc-300">{project.mvp_definition}</p>
          </div>
        </div>
        <div>
          {!editingUrl ? (
            project.live_url ? (
              <div className="flex items-center gap-3 w-full p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 group hover:border-blue-500/40 transition-colors">
                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                  <Link size={16} className="text-blue-400" />
                </div>
                <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 flex-grow truncate transition-colors">
                  {project.live_url} <ExternalLink size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
                <button onClick={() => setEditingUrl(true)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors shrink-0">Editar URL</button>
              </div>
            ) : (
              <button onClick={() => setEditingUrl(true)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 text-sm transition-all border border-white/10 border-dashed rounded-xl px-5 py-4 w-full">
                <Link size={14} /> <span className="font-medium">Vincular aplicación en pre-producción / producción...</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 w-full animate-in zoom-in-95 duration-200">
              <input
                autoFocus
                className="flex-grow bg-zinc-900 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 transition-colors focus:ring-4 focus:ring-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                placeholder="https://tu-app.vercel.app"
                value={liveUrl}
                onChange={e => setLiveUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveLiveUrl(); if (e.key === 'Escape') setEditingUrl(false); }}
              />
              <button onClick={handleSaveLiveUrl} className="px-5 py-3.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-400 transition-colors shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">Guardar</button>
              <button onClick={() => setEditingUrl(false)} className="px-4 py-3.5 text-zinc-500 hover:text-white text-sm bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors">✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
