import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { PRIORITY } from '../types';

export function useTasks(projectId: string | undefined, showToast?: (msg: string, ok?: boolean) => void) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from('pi_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data) setTasks(data);
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al cargar tareas', false);
    }
  }, [projectId, showToast]);

  const addTask = async (title: string, dueDate: string) => {
    if (!title.trim() || !projectId) return false;
    try {
      let result = await supabase.from('pi_tasks').insert([{
        project_id: projectId,
        title,
        due_date: dueDate || null,
        sort_order: tasks.length,
        priority: 'medium',
      }]).select().single();
      
      if (result.error) {
        // Fallback in case columns like priority/sort_order don't exist in older schema
        result = await supabase.from('pi_tasks').insert([{
          project_id: projectId,
          title,
        }]).select().single();
      }
      
      if (result.data) {
        setTasks([...tasks, result.data]);
        if (showToast) showToast('Tarea agregada');
        return true;
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al agregar tarea', false);
    }
    return false;
  };

  const toggleTask = async (task: Task) => {
    const newVal = !task.is_completed;
    try {
      const { error } = await supabase.from('pi_tasks').update({ is_completed: newVal }).eq('id', task.id);
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: newVal } : t));
      if (newVal) {
        setJustCompletedId(task.id);
        if (showToast) showToast('Tarea completada');
        setTimeout(() => setJustCompletedId(null), 500);
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al cambiar de estado', false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('pi_tasks').delete().eq('id', id);
      if (error) throw error;
      
      setTasks(tasks.filter(t => t.id !== id));
      if (showToast) showToast('Tarea eliminada');
      return true;
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al eliminar tarea', false);
    }
    return false;
  };

  const cyclePriority = async (task: Task) => {
    const current = (task.priority || 'medium') as 'high' | 'medium' | 'low';
    const next = PRIORITY[current].next;
    try {
      const { error } = await supabase.from('pi_tasks').update({ priority: next }).eq('id', task.id);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: next } : t));
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al cambiar prioridad', false);
    }
  };

  const reorderTasks = async (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      await Promise.all(newTasks.map((task, i) => 
        supabase.from('pi_tasks').update({ sort_order: i }).eq('id', task.id)
      ));
      if (showToast) showToast('Orden guardado');
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al guardar el orden', false);
    }
  };

  return {
    tasks,
    justCompletedId,
    fetchTasks,
    addTask,
    toggleTask,
    deleteTask,
    cyclePriority,
    reorderTasks,
  };
}
