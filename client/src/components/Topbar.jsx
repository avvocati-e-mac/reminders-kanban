import { useQuery } from '@tanstack/react-query';
import { getLists } from '../services/api';

export default function Topbar({ selectedList, onSelectList, onRefresh, isLoading }) {
  const { data: lists } = useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
    staleTime: 30000,
  });

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
      <h1 className="text-base font-bold text-gray-900 tracking-tight">RemindersKanban</h1>

      <div className="w-px h-5 bg-gray-200" />

      <select
        value={selectedList || ''}
        onChange={e => onSelectList(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40"
      >
        <option value="" disabled>Seleziona lista…</option>
        {lists?.map(l => (
          <option key={l.id} value={l.title}>{l.title}</option>
        ))}
      </select>

      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="ml-auto text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        title="Aggiorna da Reminders"
      >
        {isLoading ? '↻ Aggiornamento…' : '↻ Aggiorna'}
      </button>
    </header>
  );
}
