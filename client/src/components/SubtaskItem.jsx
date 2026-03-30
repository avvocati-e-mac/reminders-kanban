import { useUpdateSubtask } from '../hooks/useTasks';

const COLORI_SCADENZA = {
  scaduta: 'text-red-600 font-semibold',
  urgente: 'text-orange-500',
  ok: 'text-gray-400',
};

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function colorScadenza(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const due = new Date(isoString);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return COLORI_SCADENZA.scaduta;
  if (diffDays <= 7) return COLORI_SCADENZA.urgente;
  return COLORI_SCADENZA.ok;
}

export default function SubtaskItem({ subtask }) {
  const updateSubtask = useUpdateSubtask();

  function toggleCompleted() {
    updateSubtask.mutate({ id: subtask.id, completed: !subtask.isCompleted });
  }

  return (
    <div className="flex items-start gap-2 py-1 group">
      <input
        type="checkbox"
        checked={subtask.isCompleted}
        onChange={toggleCompleted}
        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0"
        disabled={updateSubtask.isPending}
      />
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {subtask.title}
        </span>
        {subtask.dueDate && (
          <span className={`block text-xs ${colorScadenza(subtask.dueDate)}`}>
            {formatDate(subtask.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
