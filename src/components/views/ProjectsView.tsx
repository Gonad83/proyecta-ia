import React from 'react';
import { Play, Archive, Trophy } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectsViewProps {
  allProjects: Project[];
  updateProjectStatus: (id: string, status: string) => void;
}

const statusColor: Record<string, string> = {
  'En Desarrollo': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Lanzado':       'text-green-400 bg-green-400/10 border-green-400/20',
  'Archivado':     'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
  'Bloqueado':     'text-red-400 bg-red-400/10 border-red-400/20',
  'Idea':          'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'Definiendo':    'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({ allProjects, updateProjectStatus }) => {
  const launchedCount = allProjects.filter(p => p.status === 'Lanzado').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          <div key={project.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:bg-zinc-900/80">
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
  );
};
