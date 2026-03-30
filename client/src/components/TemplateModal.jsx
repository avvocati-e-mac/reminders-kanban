import { useState } from 'react';
import { useTemplates } from '../hooks/useTemplates';
import { useApplyTemplate } from '../hooks/useTasks';

export default function TemplateModal({ task, onClose }) {
  const { data: templates, isLoading } = useTemplates();
  const [selected, setSelected] = useState(null);
  const [triggerDate, setTriggerDate] = useState('');
  const [result, setResult] = useState(null);
  const applyTemplate = useApplyTemplate();

  function handleApply() {
    if (!selected || !triggerDate) return;
    applyTemplate.mutate(
      { taskId: task.id, templateId: selected.id, triggerDate: new Date(triggerDate).toISOString() },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => alert('Errore: ' + (err.response?.data?.error || err.message)),
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Applica template processuale</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{task.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {result ? (
            <div>
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <span className="text-lg">✓</span>
                <span className="font-medium">{result.created} subtask creati</span>
              </div>
              {result.subtasks.map((s, i) => (
                <div key={i} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                  {s.title}
                </div>
              ))}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  Errori: {result.errors.map(e => e.subtask).join(', ')}
                </div>
              )}
              <button onClick={onClose} className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Chiudi
              </button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <p className="text-sm text-gray-500">Caricamento template...</p>
              ) : (
                <div className="space-y-2">
                  {templates?.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selected?.id === t.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{t.nome}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.descrizione}</div>
                      <div className="text-xs text-blue-600 mt-1">{t.subtaskCount} scadenze</div>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {selected.triggerLabel}
                  </label>
                  <input
                    type="date"
                    value={triggerDate}
                    onChange={e => setTriggerDate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {!result && (
          <div className="p-4 border-t flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Annulla
            </button>
            <button
              onClick={handleApply}
              disabled={!selected || !triggerDate || applyTemplate.isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applyTemplate.isPending ? 'Creazione...' : 'Crea subtask'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
