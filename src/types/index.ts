export interface Project {
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

export interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  due_date?: string | null;
  sort_order?: number | null;
  project_id?: string;
  priority?: 'high' | 'medium' | 'low' | null;
}

export interface Idea {
  id: string;
  raw_idea: string;
  context: string;
  created_at: string;
}

export type View = 'execution' | 'ideas' | 'all-projects';

export const PRIORITY = {
  high:   { color: 'bg-red-500',    label: 'Alta',  next: 'medium' as const },
  medium: { color: 'bg-yellow-400', label: 'Media', next: 'low'    as const },
  low:    { color: 'bg-zinc-600',   label: 'Baja',  next: 'high'   as const },
};
