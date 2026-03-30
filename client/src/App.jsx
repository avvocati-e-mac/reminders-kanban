import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Topbar from './components/Topbar';
import KanbanBoard from './components/KanbanBoard';
import { useTasks } from './hooks/useTasks';

export default function App() {
  const [selectedList, setSelectedList] = useState('');
  const qc = useQueryClient();
  const { data: tasks, isLoading, error } = useTasks(selectedList);

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ['tasks', selectedList] });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar
        selectedList={selectedList}
        onSelectList={setSelectedList}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <main className="flex-1 p-4 overflow-hidden">
        {!selectedList && (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Seleziona una lista Reminders dalla barra in alto.
          </div>
        )}

        {selectedList && isLoading && (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Caricamento task da Reminders…
          </div>
        )}

        {selectedList && error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              Errore: {error.response?.data?.error || error.message}
            </div>
          </div>
        )}

        {selectedList && tasks && !isLoading && (
          <KanbanBoard tasks={tasks} listName={selectedList} />
        )}
      </main>
    </div>
  );
}
