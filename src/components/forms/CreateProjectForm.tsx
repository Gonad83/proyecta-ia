import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Project } from '../../types';
import { formatDateTimeLocal, addDays } from '../../lib/dateUtils';

interface CreateProjectFormProps {
  onCancel?: () => void;
  onSubmit: (data: Partial<Project>) => void;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    problem_solved: '',
    mvp_definition: '',
    deadline: formatDateTimeLocal(addDays(new Date(), 7)),
    personal_commitment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {onCancel && (
        <button onClick={onCancel} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={14} /> Volver
        </button>
      )}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">¿QUÉ VAS A LANZAR?</h1>
        <p className="text-zinc-500 text-sm">Define tu próximo MVP. Solo puedes tener uno activo.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
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
        <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black text-lg hover:bg-zinc-200 transition-colors active:scale-95 duration-200">
          INICIAR EJECUCIÓN
        </button>
      </form>
    </div>
  );
};
