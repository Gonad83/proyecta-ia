import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Idea } from '../types';

export function useIdeas(showToast?: (msg: string, ok?: boolean) => void) {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const fetchIdeas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pi_idea_brainstorm')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setIdeas(data);
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al cargar ideas', false);
    }
  }, [showToast]);

  const addIdea = async (newIdea: string, newIdeaContext: string) => {
    if (!newIdea.trim()) return false;
    try {
      const { data, error } = await supabase
        .from('pi_idea_brainstorm')
        .insert([{ raw_idea: newIdea, context: newIdeaContext }])
        .select()
        .single();
        
      if (error) throw error;
      if (data) {
        setIdeas([data, ...ideas]);
        if (showToast) showToast('Idea guardada');
        return true;
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al guardar idea', false);
    }
    return false;
  };

  const deleteIdea = async (id: string) => {
    try {
      const { error } = await supabase.from('pi_idea_brainstorm').delete().eq('id', id);
      if (error) throw error;
      
      setIdeas(ideas.filter(i => i.id !== id));
      if (showToast) showToast('Idea eliminada');
      return true;
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('Error al eliminar idea', false);
    }
    return false;
  };

  return {
    ideas,
    fetchIdeas,
    addIdea,
    deleteIdea,
  };
}
