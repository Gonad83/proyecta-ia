import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Play, Lightbulb, Circle, Plus, CheckCircle2, Clock, Archive, Trophy, List, ArrowLeft, Trash2, ExternalLink, Link, GripVertical, CalendarDays, FileText, Zap } from 'lucide-react';
import { differenceInSeconds, addDays } from 'date-fns';

interface Project {
  id: string;
  name: string;
  problem_solved: string;
  mvp_definition: string;
  status: string;
  deadline: string;
  personal_commitment: string;
  created_at: string;
  live_url?: string;
  notes?: string | null;
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  due_date?: string | null;
  sort_order?: number | null;
  priority?: 'high' | 'medium' | 'low' | null;
}

interface Idea {
  id: string;
  raw_idea: string;
  context: string;
  created_at: string;
}

type View = 'execution' | 'ideas' | 'all-projects';

const PRIORITY = {
  high:   { color: 'bg-red-500',    label: 'Alta',  next: 'medium' as const },
  medium: { color: 'bg-yellow-400', label: 'Media', next: 'low'    as const },
  low:    { color: 'bg-zinc-600',   label: 'Baja',  next: 'high'   as const },
};

function App() {
  const [view, setView]                     = useState<View>('execution');
  const [activeProject, setActiveProject]   = useState<Project | null>(null);
  const [allProjects, setAllProjects]       = useState<Project[]>([]);
  const [tasks, setTasks]                   = useState<Task[]>([]);
  const [ideas, setIdeas]                   = useState<Idea[]>([]);
  const [timeLeft, setTimeLeft]             = useState<number | null>(null);
  const [isFailed, setIsFailed]             = useState(false);
  const [loading, setLoading]               = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newTaskTitle, setNewTaskTitle]     = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [editingUrl, setEditingUrl]         = useState(false);
  const [liveUrl, setLiveUrl]               = useState('');
  const [newIdea, setNewIdea]               = useState('');
  const [newIdeaContext, setNewIdeaContext] = useState('');
  const [projectNotes, setProjectNotes]     = useState('');
  const [savingNotes, setSavingNotes]       = useState(false);
  const [draggingId, setDraggingId]         = useState<string | null>(null);
  // UX improvements
  const [toast, setToast]                   = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmTaskId, setConfirmTaskId]   = useState<string | null>(null);
  const [confirmIdeaId, setConfirmIdeaId]   = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  const dragOverId    = useRef<string | null>(null);
  const taskInputRef  = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    problem_solved: '',
    mvp_definition: '',
    deadline: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    personal_commitment: ''
  });

  // ── Toast helper ──
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === 'n' || e.key === 'N') && view === 'execution' && activeProject && !showCreateProject) {
        e.preventDefault();
        taskInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [view, activeProject, showCreateProject]);

  useEffect(() => { fetchActiveProject(); fetchAllProjects(); }, []);
  useEffect(() => {
    if (activeProject) {
      fetchTasks(activeProject.id);
      setProjectNotes(activeProject.notes || '');
    }
  }, [activeProject]);
  useEffect(() => { if (view === 'ideas') fetchIdeas(); }, [view]);
  useEffect(() => {
    if (activeProject?.deadline) {
      const timer = setInterval(() => {
        const seconds = differenceInSeconds(new Date(activeProject.deadline), new Date());
        setTimeLeft(seconds);
        setIsFailed(seconds <= 0);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeProject]);

  async function fetchActiveProject() {
    setLoading(true);
    const { data } = await supabase.from('pi_projects').select('*').eq('status', 'En Desarrollo').limit(1).maybeSingle();
    if (data) { setActiveProject(data); setLiveUrl(data.live_url || ''); setProjectNotes(data.notes || ''); }
    else setActiveProject(null);
    setLoading(false);
  }

  async function fetchAllProjects() {
    const { data } = await supabase.from('pi_projects').select('*').order('created_at', { ascending: false });
    if (data) setAllProjects(data);
  }

  async function fetchTasks(projectId: string) {
    const { data } = await supabase
      .from('pi_tasks').select('*').eq('project_id', projectId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (data) setTasks(data);
  }

  async function fetchIdeas() {
    const { data } = await supabase.from('pi_idea_brainstorm').select('*').order('created_at', { ascending: false });
    if (data) setIdeas(data);
  }

  async function handleCreateProject(e: { preventDefault(): void }) {
    e.preventDefault();
    const { data, error } = await supabase.from('pi_projects').insert([{ ...formData, status: 'En Desarrollo' }]).select().single();
    if (data) {
      setActiveProject(data);
      setShowCreateProject(false);
      fetchAllProjects();
      showToast('Proyecto creado');
      setFormData({ name: '', problem_solved: '', mvp_definition: '', deadline: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"), personal_commitment: '' });
    } else { console.error(error); showToast('Error al crear proyecto', false); }
  }

  async function addTask(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject) return;
    let result = await supabase.from('pi_tasks').insert([{
      project_id: activeProject.id,
      title: newTaskTitle,
      due_date: newTaskDueDate || null,
      sort_order: tasks.length,
      priority: 'medium',
    }]).select().single();
    if (result.error) {
      result = await supabase.from('pi_tasks').insert([{
        project_id: activeProject.id,
        title: newTaskTitle,
      }]).select().single();
    }
    if (result.data) {
      setTasks([...tasks, result.data]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      showToast('Tarea agregada');
      taskInputRef.current?.focus();
    } else {
      showToast('Error al agregar tarea', false);
    }
  }

  async function toggleTask(task: Task) {
    const newVal = !task.is_completed;
    const { error } = await supabase.from('pi_tasks').update({ is_completed: newVal }).eq('id', task.id);
    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: newVal } : t));
      if (newVal) {
        setJustCompletedId(task.id);
        showToast('Tarea completada');
        setTimeout(() => setJustCompletedId(null), 500);
      }
    }
  }

  async function deleteTask(id: string) {
    await supabase.from('pi_tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
    setConfirmTaskId(null);
    showToast('Tarea eliminada');
  }

  async function cyclePriority(task: Task) {
    const current = (task.priority || 'medium') as 'high' | 'medium' | 'low';
    const next = PRIORITY[current].next;
    const { error } = await supabase.from('pi_tasks').update({ priority: next }).eq('id', task.id);
    if (!error) setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: next } : t));
  }

  async function updateProjectStatus(projectId: string, status: string) {
    await supabase.from('pi_projects').update({ status }).eq('id', projectId);
    fetchAllProjects();
    fetchActiveProject();
    showToast(`Proyecto marcado como ${status}`);
  }

  async function saveLiveUrl() {
    if (!activeProject) return;
    await supabase.from('pi_projects').update({ live_url: liveUrl }).eq('id', activeProject.id);
    setActiveProject({ ...activeProject, live_url: liveUrl });
    setEditingUrl(false);
    showToast('Link guardado');
  }

  async function addIdea(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!newIdea.trim()) return;
    const { data } = await supabase.from('pi_idea_brainstorm').insert([{ raw_idea: newIdea, context: newIdeaContext }]).select().single();
    if (data) { setIdeas([data, ...ideas]); setNewIdea(''); setNewIdeaContext(''); showToast('Idea guardada'); }
  }

  async function deleteIdea(id: string) {
    await supabase.from('pi_idea_brainstorm').delete().eq('id', id);
    setIdeas(ideas.filter(i => i.id !== id));
    setConfirmIdeaId(null);
    showToast('Idea eliminada');
  }

  async function saveNotes() {
    if (!activeProject) return;
    setSavingNotes(true);
    await supabase.from('pi_projects').update({ notes: projectNotes }).eq('id', activeProject.id);
    setActiveProject({ ...activeProject, notes: projectNotes });
    setSavingNotes(false);
    showToast('Notas guardadas');
  }

  // Drag & drop
  function handleDragStart(id: string) { setDraggingId(id); }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id === draggingId || dragOverId.current === id) return;
    dragOverId.current = id;
    const dragIdx = tasks.findIndex(t => t.id === draggingId);
    const overIdx = tasks.findIndex(t => t.id === id);
    if (dragIdx === -1 || overIdx === -1) return;
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(dragIdx, 1);
    newTasks.splice(overIdx, 0, removed);
    setTasks(newTasks);
  }
  async function handleDragEnd() {
    setDraggingId(null);
    dragOverId.current = null;
    await Promise.all(tasks.map((task, i) => supabase.from('pi_tasks').update({ sort_order: i }).eq('id', task.id)));
    showToast('Orden guardado');
  }

  // Computed
  const completedCount   = tasks.filter(t => t.is_completed).length;
  const progressPercent  = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const launchedCount    = allProjects.filter(p => p.status === 'Lanzado').length;

  const formatTime = (s: number) => {
    if (s <= 0) return "TIEMPO AGOTADO";
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
    const label = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    return { label, color: diffDays < 0 ? 'text-red-400' : diffDays <= 2 ? 'text-yellow-400' : 'text-zinc-500' };
  };

  const statusColor: Record<string, string> = {
    'En Desarrollo': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Lanzado':       'text-green-400 bg-green-400/10 border-green-400/20',
    'Archivado':     'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    'Bloqueado':     'text-red-400 bg-red-400/10 border-red-400/20',
    'Idea':          'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'Definiendo':    'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };

  // ── Skeleton loading ──
  if (loading) return (
    <div className="bg-[#0a0a0a] min-h-screen text-zinc-100">
      <nav className="border-b border-white/5 px-6 py-4 flex justify-between items-center bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold rounded-sm text-sm">PI</div>
          <span className="font-bold tracking-tighter text-xl uppercase">Proyecta IA</span>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8 animate-pulse">
        <div className="h-28 bg-zinc-900 rounded-2xl" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="h-5 bg-zinc-900 rounded-xl w-40" />
            <div className="h-4 bg-zinc-900 rounded-full w-full" />
            <div className="h-12 bg-zinc-900 rounded-xl" />
            {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-900 rounded-xl" />)}
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-zinc-900 rounded-xl" />
            <div className="h-40 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isFailed && view === 'execution' ? 'bg-red-950' : 'bg-[#0a0a0a]'} text-zinc-100`}>

      {/* ── NAV ── */}
      <nav className="border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold rounded-sm text-sm shrink-0">PI</div>
          <span className="font-bold tracking-tighter text-lg sm:text-xl uppercase">Proyecta IA</span>
        </div>
        {/* Stats rápidas */}
        {allProjects.length > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-zinc-600 text-xs font-mono">
            <Zap size={11} className="text-yellow-500" />
            {launchedCount} lanzado{launchedCount !== 1 ? 's' : ''} · {allProjects.length} proyectos
          </span>
        )}
        <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-zinc-400">
          <button onClick={() => { setView('execution'); setShowCreateProject(false); }} className={`hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors ${view === 'execution' ? 'text-white' : ''}`}>
            <Play size={13} /> <span className="hidden sm:inline">Ejecución</span>
          </button>
          <button onClick={() => setView('all-projects')} className={`hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors ${view === 'all-projects' ? 'text-white' : ''}`}>
            <List size={13} /> <span className="hidden sm:inline">Proyectos</span>
          </button>
          <button onClick={() => setView('ideas')} className={`hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors ${view === 'ideas' ? 'text-white' : ''}`}>
            <Lightbulb size={13} /> <span className="hidden sm:inline">Ideas</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ===== EXECUTION VIEW ===== */}
        {view === 'execution' && (
          <>
            {!activeProject || showCreateProject ? (
              <div className="max-w-xl mx-auto space-y-8">
                {showCreateProject && activeProject && (
                  <button onClick={() => setShowCreateProject(false)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
                    <ArrowLeft size={14} /> Volver
                  </button>
                )}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">¿QUÉ VAS A LANZAR?</h1>
                  <p className="text-zinc-500 text-sm">Define tu próximo MVP. Solo puedes tener uno activo.</p>
                </div>
                <form onSubmit={handleCreateProject} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre del Proyecto</label>
                    <input required className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 outline-none focus:border-white/40 transition-colors" placeholder="Ej: App de Matemáticas para niños" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Problema Real que Resuelve</label>
                    <textarea required className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 outline-none focus:border-white/40 transition-colors h-24 resize-none" placeholder="¿Por qué el mundo necesita esto?" value={formData.problem_solved} onChange={e => setFormData({...formData, problem_solved: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Definición de MVP</label>
                    <textarea required className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 outline-none focus:border-white/40 transition-colors h-24 resize-none" placeholder="¿Qué es lo mínimo para lanzar?" value={formData.mvp_definition} onChange={e => setFormData({...formData, mvp_definition: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Deadline</label>
                      <input required type="datetime-local" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 outline-none focus:border-white/40 transition-colors" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Compromiso Personal</label>
                      <input required className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 outline-none focus:border-white/40 transition-colors" placeholder="¿Por qué esto te importa?" value={formData.personal_commitment} onChange={e => setFormData({...formData, personal_commitment: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black text-lg hover:bg-zinc-200 transition-colors">
                    INICIAR EJECUCIÓN
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">

                {/* ── HEADER: nombre + timer + botones ── */}
                <div className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-500 ${isFailed ? 'border-red-500 bg-red-900/20' : 'border-white/8 bg-zinc-900/40'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Proyecto Activo</span>
                      <h1 className="text-2xl sm:text-4xl font-black tracking-tighter mt-0.5 truncate">{activeProject.name}</h1>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-xs tracking-widest uppercase mb-0.5">
                        <Clock size={11} /> Tiempo restante
                      </div>
                      <div className={`text-2xl sm:text-3xl font-black tabular-nums ${isFailed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft !== null ? formatTime(timeLeft) : '--'}
                      </div>
                      {isFailed && <div className="mt-1 py-0.5 px-3 bg-red-500 text-white font-bold rounded-full text-xs">DEADLINE SUPERADO</div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateProjectStatus(activeProject.id, 'Lanzado')} className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-colors">
                        <Trophy size={12} /> <span className="hidden sm:inline">Lanzado</span>
                      </button>
                      <button onClick={() => updateProjectStatus(activeProject.id, 'Archivado')} className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-zinc-800 border border-white/10 text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">
                        <Archive size={12} /> <span className="hidden sm:inline">Archivar</span>
                      </button>
                      <button onClick={() => setShowCreateProject(true)} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Nuevo proyecto">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── TAREAS + Sidebar ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tighter italic">MICRO-EJECUCIÓN</h2>
                      <span className="text-zinc-500 font-mono text-xs">{completedCount}/{tasks.length}</span>
                    </div>

                    {/* Progress bar */}
                    {tasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${progressPercent === 100 ? 'bg-green-400' : 'bg-white'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-600 font-mono">
                          <span>Progreso</span>
                          <span className={progressPercent === 100 ? 'text-green-400 font-bold' : ''}>{progressPercent}%{progressPercent === 100 ? ' ✓' : ''}</span>
                        </div>
                      </div>
                    )}

                    {/* Add task form */}
                    <form onSubmit={addTask} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <input
                            ref={taskInputRef}
                            className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-3.5 pl-10 outline-none focus:border-white/30 transition-all text-sm"
                            placeholder="Siguiente paso… (N para enfocar)"
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                          />
                          <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shrink-0">
                          Agregar
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pl-1">
                        <CalendarDays size={12} className="text-zinc-700 shrink-0" />
                        <input
                          type="date"
                          className="bg-transparent border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-white/30 text-xs text-zinc-500"
                          value={newTaskDueDate}
                          onChange={e => setNewTaskDueDate(e.target.value)}
                        />
                        <span className="text-zinc-700 text-xs">Fecha límite (opcional)</span>
                      </div>
                    </form>

                    {/* Task list */}
                    <div className="space-y-2">
                      {tasks.length === 0 && (
                        <p className="text-zinc-600 text-sm py-8 text-center">Sin tareas. Presiona <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">N</kbd> para agregar.</p>
                      )}
                      {tasks.map(task => {
                        const due  = task.due_date ? formatDueDate(task.due_date) : null;
                        const prio = (task.priority || 'medium') as 'high' | 'medium' | 'low';
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task.id)}
                            onDragOver={e => handleDragOver(e, task.id)}
                            onDragEnd={handleDragEnd}
                            className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 select-none
                              ${task.is_completed ? 'bg-zinc-950/60 border-white/5 opacity-40' : 'bg-zinc-900/80 border-white/10 hover:border-white/20'}
                              ${draggingId === task.id ? 'opacity-25 scale-[0.97]' : ''}
                              ${justCompletedId === task.id ? 'scale-[1.02] border-green-500/40' : ''}`}
                          >
                            <GripVertical size={13} className="text-zinc-700 cursor-grab active:cursor-grabbing shrink-0" />

                            {/* Priority dot */}
                            <button
                              onClick={() => cyclePriority(task)}
                              title={`Prioridad ${PRIORITY[prio].label} — click para cambiar`}
                              className="shrink-0 p-1"
                            >
                              <div className={`w-2 h-2 rounded-full ${PRIORITY[prio].color}`} />
                            </button>

                            <button onClick={() => toggleTask(task)} className="shrink-0">
                              {task.is_completed
                                ? <CheckCircle2 className="text-green-500" size={16} />
                                : <Circle size={16} className="text-zinc-600" />}
                            </button>

                            <span
                              className={`flex-grow text-sm cursor-pointer leading-snug ${task.is_completed ? 'line-through text-zinc-500' : ''}`}
                              onClick={() => toggleTask(task)}
                            >
                              {task.title}
                            </span>

                            {due && !task.is_completed && (
                              <span className={`text-xs font-mono flex items-center gap-0.5 shrink-0 ${due.color}`}>
                                <CalendarDays size={10} /> {due.label}
                              </span>
                            )}

                            {/* Delete with confirm */}
                            {confirmTaskId === task.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => deleteTask(task.id)} className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors">Sí</button>
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
                      })}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Compromiso</h2>
                      <div className="p-4 rounded-2xl bg-zinc-900/80 italic text-zinc-300 border-l-4 border-white text-sm leading-relaxed">
                        "{activeProject.personal_commitment}"
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                        <FileText size={12} /> Notas
                      </h2>
                      <textarea
                        className="w-full bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 outline-none focus:border-white/20 transition-all h-32 resize-none text-sm text-zinc-300 placeholder:text-zinc-700"
                        placeholder="Pensamientos, bloqueos, decisiones..."
                        value={projectNotes}
                        onChange={e => setProjectNotes(e.target.value)}
                        onBlur={saveNotes}
                      />
                      <button onClick={saveNotes} disabled={savingNotes} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
                        {savingNotes ? 'Guardando...' : 'Guardar notas'}
                      </button>
                    </div>
                    {/* Priority legend */}
                    <div className="flex items-center gap-3 text-xs text-zinc-700">
                      <span>Prioridad:</span>
                      {(['high','medium','low'] as const).map(p => (
                        <span key={p} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full inline-block ${PRIORITY[p].color}`} />
                          {PRIORITY[p].label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── INFO DE REFERENCIA ── */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-1">
                      <h3 className="text-zinc-600 font-bold uppercase text-xs tracking-wider">Problema</h3>
                      <p className="text-sm leading-relaxed text-zinc-500">{activeProject.problem_solved}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-1">
                      <h3 className="text-zinc-600 font-bold uppercase text-xs tracking-wider">MVP</h3>
                      <p className="text-sm leading-relaxed text-zinc-500">{activeProject.mvp_definition}</p>
                    </div>
                  </div>
                  <div>
                    {!editingUrl ? (
                      activeProject.live_url ? (
                        <div className="flex items-center gap-3 w-full p-4 rounded-xl bg-zinc-900/30 border border-white/5">
                          <Link size={14} className="text-zinc-600 shrink-0" />
                          <a href={activeProject.live_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 flex-grow truncate transition-colors">
                            {activeProject.live_url} <ExternalLink size={11} />
                          </a>
                          <button onClick={() => setEditingUrl(true)} className="text-zinc-600 hover:text-white text-xs transition-colors shrink-0">Editar</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingUrl(true)} className="flex items-center gap-2 text-zinc-600 hover:text-white text-sm transition-colors border border-white/5 border-dashed rounded-xl px-4 py-3 w-full">
                          <Link size={13} /> Agregar link de la app en producción...
                        </button>
                      )
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          autoFocus
                          className="flex-grow bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors"
                          placeholder="https://tu-app.vercel.app"
                          value={liveUrl}
                          onChange={e => setLiveUrl(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveLiveUrl(); if (e.key === 'Escape') setEditingUrl(false); }}
                        />
                        <button onClick={saveLiveUrl} className="px-4 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shrink-0">Guardar</button>
                        <button onClick={() => setEditingUrl(false)} className="px-3 py-3 text-zinc-500 hover:text-white text-sm">✕</button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* ===== ALL PROJECTS VIEW ===== */}
        {view === 'all-projects' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">PROYECTOS</h1>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-mono text-sm">{allProjects.length} total</span>
                {launchedCount > 0 && <span className="text-xs text-green-400 font-bold bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">{launchedCount} lanzado{launchedCount !== 1 ? 's' : ''}</span>}
              </div>
            </div>
            {allProjects.length === 0 && <p className="text-zinc-500 text-center py-20 text-sm">Sin proyectos aún.</p>}
            <div className="space-y-3">
              {allProjects.map(project => (
                <div key={project.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-grow min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h3 className="font-bold text-base">{project.name}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor[project.status] || 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm line-clamp-1">{project.problem_solved}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {project.status === 'En Desarrollo' && (
                        <>
                          <button onClick={() => updateProjectStatus(project.id, 'Lanzado')} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-colors">
                            <Trophy size={11} /> <span className="hidden sm:inline">Lanzado</span>
                          </button>
                          <button onClick={() => updateProjectStatus(project.id, 'Archivado')} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-zinc-800 border border-white/10 text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">
                            <Archive size={11} /> <span className="hidden sm:inline">Archivar</span>
                          </button>
                        </>
                      )}
                      {(project.status === 'Archivado' || project.status === 'Bloqueado') && (
                        <button onClick={() => updateProjectStatus(project.id, 'En Desarrollo')} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-colors">
                          <Play size={11} /> <span className="hidden sm:inline">Reactivar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== IDEAS VIEW ===== */}
        {view === 'ideas' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">RINCÓN DE IDEAS</h1>
              <p className="text-zinc-500 text-sm mt-1">Captura ideas sin filtro. Vuelve a ellas cuando tengas tiempo.</p>
            </div>
            <form onSubmit={addIdea} className="space-y-3 p-5 sm:p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <textarea
                required
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 outline-none focus:border-white/30 transition-all h-24 resize-none text-sm"
                placeholder="¿Qué idea tienes? Escríbela sin filtro..."
                value={newIdea}
                onChange={e => setNewIdea(e.target.value)}
              />
              <input
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 outline-none focus:border-white/30 transition-all text-sm"
                placeholder="Contexto opcional (¿de dónde viene esta idea?)"
                value={newIdeaContext}
                onChange={e => setNewIdeaContext(e.target.value)}
              />
              <button type="submit" className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
                GUARDAR IDEA
              </button>
            </form>
            <div className="space-y-3">
              {ideas.length === 0 && <p className="text-zinc-600 text-center py-10 text-sm">Sin ideas guardadas aún.</p>}
              {ideas.map(idea => (
                <div key={idea.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-grow">
                      <p className="text-sm leading-relaxed">{idea.raw_idea}</p>
                      {idea.context && <p className="text-zinc-500 text-xs italic">↳ {idea.context}</p>}
                      <p className="text-zinc-700 text-xs">{new Date(idea.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {/* Delete idea with confirm */}
                    {confirmIdeaId === idea.id ? (
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <button onClick={() => deleteIdea(idea.id)} className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors">Sí</button>
                        <span className="text-zinc-700 text-xs">/</span>
                        <button onClick={() => setConfirmIdeaId(null)} className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmIdeaId(idea.id)} className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl pointer-events-none transition-all
          ${toast.ok ? 'bg-white text-black' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Keyboard hint */}
      {view === 'execution' && activeProject && !showCreateProject && (
        <div className="fixed bottom-6 left-6 text-zinc-800 text-xs font-mono hidden sm:block">
          <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-white/5 rounded text-zinc-700">N</kbd> nueva tarea
        </div>
      )}
    </div>
  );
}

function format(date: Date, _formatStr: string) {
  const d = date;
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default App;
