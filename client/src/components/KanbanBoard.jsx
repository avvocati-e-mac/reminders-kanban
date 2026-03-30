import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { useMoveTask } from '../hooks/useTasks';

function groupBySection(tasks) {
  const groups = {};
  for (const task of tasks) {
    const section = task.section || 'Senza sezione';
    if (!groups[section]) groups[section] = [];
    groups[section].push(task);
  }
  return groups;
}

export default function KanbanBoard({ tasks, listName }) {
  const [activeTask, setActiveTask] = useState(null);
  const moveTask = useMoveTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const groups = groupBySection(tasks);
  const sections = Object.keys(groups);

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    // over.id può essere l'ID di una colonna (sezione) o di un task
    let targetSection = null;
    if (sections.includes(over.id)) {
      // Droppato su una colonna vuota
      targetSection = over.id;
    } else {
      // Droppato su un task: trova la sua sezione
      const targetTask = tasks.find(t => t.id === over.id);
      if (targetTask) targetSection = targetTask.section || 'Senza sezione';
    }

    if (!targetSection || targetSection === (draggedTask.section || 'Senza sezione')) return;
    moveTask.mutate({ id: draggedTask.id, section: targetSection });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sections.map(section => (
          <KanbanColumn
            key={section}
            title={section}
            tasks={groups[section]}
            listName={listName}
          />
        ))}

        {sections.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-20">
            Nessun task trovato in questa lista.
          </div>
        )}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
