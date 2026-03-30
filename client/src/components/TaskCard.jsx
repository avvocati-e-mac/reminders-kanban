import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SubtaskList from './SubtaskList';
import TemplateModal from './TemplateModal';

const SECTION_COLORS = {
  'Da fare': 'border-l-gray-400',
  'In corso': 'border-l-blue-500',
  'Completato': 'border-l-green-500',
  'In attesa': 'border-l-yellow-500',
  'Urgente': 'border-l-red-500',
};

function getColor(section) {
  return SECTION_COLORS[section] || 'border-l-purple-400';
}

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const completatiSubtask = task.subtasks?.filter(s => s.isCompleted).length ?? 0;
  const totaleSubtask = task.subtasks?.length ?? 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg border border-gray-200 border-l-4 ${getColor(task.section)} shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing`}
      >
        <div className="p-3" {...attributes} {...listeners}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</h3>
          </div>

          {task.notes && (
            <p className="text-xs text-gray-500 mt-1 truncate">{task.notes}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.dueDate && (
              <span className="text-xs text-gray-400">{formatDate(task.dueDate)}</span>
            )}
            {totaleSubtask > 0 && (
              <span className="text-xs text-gray-400">{completatiSubtask}/{totaleSubtask} attività</span>
            )}
          </div>
        </div>

        <div className="px-3 pb-2 flex items-center gap-2">
          {totaleSubtask > 0 && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {expanded ? 'Nascondi attività' : 'Mostra attività'}
            </button>
          )}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setShowTemplate(true); }}
            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer ml-auto"
          >
            + Template
          </button>
        </div>

        {expanded && task.subtasks?.length > 0 && (
          <div className="px-3 pb-3" onPointerDown={e => e.stopPropagation()}>
            <SubtaskList subtasks={task.subtasks} />
          </div>
        )}
      </div>

      {showTemplate && (
        <TemplateModal task={task} onClose={() => setShowTemplate(false)} />
      )}
    </>
  );
}
