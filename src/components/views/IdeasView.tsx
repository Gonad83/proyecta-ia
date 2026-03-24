import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useIdeas } from '../../hooks/useIdeas';

interface IdeasViewProps {
  showToast: (msg: string, ok?: boolean) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ showToast }) => {
  const { ideas, fetchIdeas, addIdea, deleteIdea } = useIdeas(showToast);
  const [newIdea, setNewIdea] = useState('');
  const [newIdeaContext, setNewIdeaContext] = useState('');
  const [confirmIdeaId, setConfirmIdeaId] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addIdea(newIdea, newIdeaContext);
    if (success) {
      setNewIdea('');
      setNewIdeaContext('');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteIdea(id);
    setConfirmIdeaId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">RINCÓN DE IDEAS</h1>
        <p className="text-zinc-500 text-sm mt-1">Captura ideas sin filtro. Vuelve a ellas cuando tengas tiempo.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-5 sm:p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
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
        <button type="submit" className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors active:scale-[0.98]">
          GUARDAR IDEA
        </button>
      </form>
      <div className="space-y-3">
        {ideas.length === 0 && <p className="text-zinc-600 text-center py-10 text-sm">Sin ideas guardadas aún.</p>}
        {ideas.map(idea => (
          <div key={idea.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-white/5 group hover:border-white/10 transition-all hover:bg-zinc-900/80">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-grow">
                <p className="text-sm leading-relaxed">{idea.raw_idea}</p>
                {idea.context && <p className="text-zinc-500 text-xs italic">↳ {idea.context}</p>}
                <p className="text-zinc-700 text-xs">{new Date(idea.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              {confirmIdeaId === idea.id ? (
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <button onClick={() => handleDelete(idea.id)} className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors">Sí</button>
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
  );
};
