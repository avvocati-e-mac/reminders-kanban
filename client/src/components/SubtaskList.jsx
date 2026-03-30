import SubtaskItem from './SubtaskItem';

export default function SubtaskList({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;

  const completati = subtasks.filter(s => s.isCompleted).length;

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="text-xs text-gray-400 mb-1">{completati}/{subtasks.length} completati</div>
      {subtasks.map(subtask => (
        <SubtaskItem key={subtask.id} subtask={subtask} />
      ))}
    </div>
  );
}
