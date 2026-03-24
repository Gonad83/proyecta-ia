import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

export function useProjects(showToast?: (msg: string, ok?: boolean) => void) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveProject = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pi_projects')
        .select('*')
        .eq('status', 'En Desarrollo')
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      setActiveProject(data || null);
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al cargar proyecto activo', false);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchAllProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pi_projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setAllProjects(data);
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al cargar proyectos', false);
    }
  }, [showToast]);

  const createProject = async (formData: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('pi_projects')
        .insert([{ ...formData, status: 'En Desarrollo' }])
        .select()
        .single();
        
      if (error) throw error;
      if (data) {
        setActiveProject(data);
        fetchAllProjects();
        if (showToast) showToast('Proyecto creado');
        return true;
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al crear proyecto', false);
    }
    return false;
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('pi_projects')
        .update({ status })
        .eq('id', projectId);
        
      if (error) throw error;
      await fetchAllProjects();
      await fetchActiveProject();
      if (showToast) showToast(`Proyecto marcado como ${status}`);
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(`Error al actualizar estado`, false);
    }
  };

  const updateProjectLiveUrl = async (projectId: string, url: string) => {
    try {
      const { error } = await supabase
        .from('pi_projects')
        .update({ live_url: url })
        .eq('id', projectId);
        
      if (error) throw error;
      if (activeProject && activeProject.id === projectId) {
        setActiveProject({ ...activeProject, live_url: url });
      }
      if (showToast) showToast('Link guardado');
      return true;
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al guardar link', false);
    }
    return false;
  };

  const updateProjectNotes = async (projectId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('pi_projects')
        .update({ notes })
        .eq('id', projectId);
        
      if (error) throw error;
      if (activeProject && activeProject.id === projectId) {
        setActiveProject({ ...activeProject, notes });
      }
      if (showToast) showToast('Notas guardadas');
      return true;
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al guardar notas', false);
    }
    return false;
  };

  useEffect(() => {
    fetchActiveProject();
    fetchAllProjects();
  }, [fetchActiveProject, fetchAllProjects]);

  return {
    activeProject,
    allProjects,
    loading,
    createProject,
    updateProjectStatus,
    updateProjectLiveUrl,
    updateProjectNotes,
  };
}
