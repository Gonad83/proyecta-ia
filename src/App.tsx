import { useState } from 'react';
import type { View } from './types';
import { useProjects } from './hooks/useProjects';
import { useToast } from './hooks/useToast';

import { Navbar } from './components/ui/Navbar';
import { Toast } from './components/ui/Toast';
import { CreateProjectForm } from './components/forms/CreateProjectForm';

import { ExecutionView } from './components/views/ExecutionView';
import { ProjectsView } from './components/views/ProjectsView';
import { IdeasView } from './components/views/IdeasView';

function App() {
  const [view, setView] = useState<View>('execution');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [isFailedGlobal, setIsFailedGlobal] = useState(false);
  
  const { toast, showToast } = useToast();
  
  const { 
    activeProject, allProjects, loading, 
    createProject, updateProjectStatus, updateProjectLiveUrl, updateProjectNotes 
  } = useProjects(showToast);

  const launchedCount = allProjects.filter(p => p.status === 'Lanzado').length;

  if (loading) return (
    <div className="bg-[#0a0a0a] min-h-screen text-zinc-100 flex flex-col">
      <nav className="border-b border-white/5 px-6 py-4 flex justify-between items-center bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold rounded-sm text-sm">PI</div>
          <span className="font-bold tracking-tighter text-xl uppercase">Proyecta IA</span>
        </div>
      </nav>
      <main className="flex-grow max-w-5xl mx-auto px-6 py-12 space-y-8 w-full animate-pulse">
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
    <div className={`min-h-screen transition-colors duration-1000 ${isFailedGlobal && view === 'execution' ? 'bg-red-950/20' : 'bg-[#0a0a0a]'} text-zinc-100`}>
      
      <Navbar 
        view={view} 
        setView={setView} 
        setShowCreateProject={setShowCreateProject} 
        launchedCount={launchedCount} 
        totalProjectsCount={allProjects.length} 
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {view === 'execution' && (
          <>
            {!activeProject || showCreateProject ? (
              <CreateProjectForm 
                onCancel={(showCreateProject && activeProject) ? () => setShowCreateProject(false) : undefined}
                onSubmit={async (data) => {
                  const success = await createProject(data);
                  if (success) setShowCreateProject(false);
                }} 
              />
            ) : (
              <ExecutionView 
                project={activeProject}
                updateProjectStatus={updateProjectStatus}
                updateProjectLiveUrl={updateProjectLiveUrl}
                updateProjectNotes={updateProjectNotes}
                onOpenCreate={() => setShowCreateProject(true)}
                showToast={showToast}
                setIsFailedGlobal={setIsFailedGlobal}
              />
            )}
          </>
        )}

        {view === 'all-projects' && (
          <ProjectsView 
            allProjects={allProjects} 
            updateProjectStatus={updateProjectStatus} 
          />
        )}

        {view === 'ideas' && (
          <IdeasView showToast={showToast} />
        )}
      </main>

      <Toast toast={toast} />
    </div>
  );
}

export default App;
