import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import NewTaskModal from './NewTaskModal';

export default function KanbanColumn({ title, tasks, listName }) {
  const [showNew, setShowNew] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: title });

  return (
    <>
      <div className="flex flex-col min-w-72 w-72 flex-shrink-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-0.5 leading-none text-lg"
            title="Nuovo task"
          >
            +
          </button>
        </div>

        <div
          ref={setNodeRef}
          className={`flex-1 rounded-xl p-2 min-h-24 transition-colors ${
            isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : 'bg-gray-100'
          }`}
        >
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>

          {tasks.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-400">
              Trascina qui o usa +
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewTaskModal
          listName={listName}
          defaultSection={title}
          onClose={() => setShowNew(false)}
        />
      )}
    </>
  );
}
