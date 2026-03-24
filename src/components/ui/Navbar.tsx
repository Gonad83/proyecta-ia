import React from 'react';
import { Play, List, Lightbulb, Zap } from 'lucide-react';
import type { View } from '../../types';

interface NavbarProps {
  view: View;
  setView: (v: View) => void;
  setShowCreateProject: (v: boolean) => void;
  launchedCount: number;
  totalProjectsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ view, setView, setShowCreateProject, launchedCount, totalProjectsCount }) => {
  return (
    <nav className="border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/40 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold rounded-sm text-sm shrink-0">PI</div>
        <span className="font-bold tracking-tighter text-lg sm:text-xl uppercase">Proyecta IA</span>
      </div>
      
      {totalProjectsCount > 0 && (
        <span className="hidden sm:flex items-center gap-1.5 text-zinc-600 text-xs font-mono">
          <Zap size={11} className="text-yellow-500" />
          {launchedCount} lanzado{launchedCount !== 1 ? 's' : ''} · {totalProjectsCount} proyectos
        </span>
      )}
      
      <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-zinc-400">
        <button 
          onClick={() => { setView('execution'); setShowCreateProject(false); }} 
          className={`hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors ${view === 'execution' ? 'text-white' : ''}`}
        >
          <Play size={13} /> <span className="hidden sm:inline">Ejecución</span>
        </button>
        <button 
          onClick={() => setView('all-projects')} 
          className={`hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors ${view === 'all-projects' ? 'text-white' : ''}`}
        >
          <List size={13} /> <span className="hidden sm:inline">Proyectos</span>
        </button>
        <button 
          onClick={() => setView('ideas')} 
          className={`hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors ${view === 'ideas' ? 'text-white' : ''}`}
        >
          <Lightbulb size={13} /> <span className="hidden sm:inline">Ideas</span>
        </button>
      </div>
    </nav>
  );
};
