# Architettura RemindersKanban

## Schema generale

```
┌─────────────────────────────────────────────────────────────┐
│                     macOS / Apple Reminders                  │
│                    (database nativo EKReminder)              │
└───────────────────────────┬─────────────────────────────────┘
                            │ EventKit Framework (read/write)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              CLI Swift — reminders-kit                        │
│         Sources/RemindersKit/                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  list-lists │  │  list-tasks  │  │  create/update... │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
│  Output: JSON su stdout, errori su stderr                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ child_process.execFile() + JSON parse
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Server Node.js — porta 3001                      │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │  remindersService  │  │    deadlineCalculator         │   │
│  │  (IPC con CLI)     │  │  (art. 155 c.p.c. + feriale)  │   │
│  └────────────────────┘  └──────────────────────────────┘   │
│  REST API: GET/POST/PUT/DELETE /api/*                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/JSON (proxy Vite in dev)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Client React — porta 5173                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Topbar   │  │ KanbanBoard  │  │   TemplateModal       │   │
│  └──────────┘  └──────┬───────┘  └──────────────────────┘   │
│              ┌─────────▼────────┐                            │
│              │  KanbanColumn    │ (una per sezione Reminders) │
│              └─────────┬────────┘                            │
│              ┌─────────▼────────┐                            │
│              │    TaskCard      │ (drag source, dnd-kit)      │
│              └─────────┬────────┘                            │
│              ┌─────────▼────────┐                            │
│              │   SubtaskList    │ (checkbox + date colorate)  │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: CLI Swift + EventKit

Il binario `reminders-kit` è l'unico punto di accesso nativo ad Apple Reminders.
Viene compilato con `swift build -c release` e copiato in `server/bin/`.

**Perché CLI e non un addon Node nativo?**
EventKit è un framework Objective-C/Swift esclusivo Apple. Non esiste binding
Node.js stabile. La CLI Swift è l'approccio più robusto e manutenibile.

**Gestione permessi**: la prima esecuzione mostra il dialog macOS per l'accesso
ai Reminders. I permessi vengono poi mantenuti dal sistema operativo.

## Layer 2: Server Node.js

Express 4 su porta 3001. Ogni richiesta API che necessita dati da Reminders
esegue il binario Swift via `child_process.execFile()` con timeout 10s.

**remindersService.js**: incapsula tutta la comunicazione con la CLI.
**deadlineCalculator.js**: motore puro JS per calcolo termini processuali.

## Layer 3: Client React

React 18 con Vite. Stato server gestito con TanStack Query (react-query v4).
Drag & drop con dnd-kit. Stili con TailwindCSS.

In sviluppo, Vite fa da proxy per `/api` → `localhost:3001` (nessun CORS).

## Flusso di una operazione (esempio: spostare una card)

1. Utente trascina TaskCard dalla colonna "Da fare" a "In corso"
2. `KanbanBoard.onDragEnd()` intercetta l'evento dnd-kit
3. Chiama `POST /api/tasks/:id/move` con body `{section: "In corso"}`
4. Server chiama `remindersService.moveTask(id, "In corso")`
5. remindersService esegue: `execFile('reminders-kit', ['move-task', '--id', id, '--section', 'In corso'])`
6. Il binario Swift chiama `EKEventStore.save(reminder)` con la nuova sezione
7. Reminders.app riflette immediatamente il cambiamento
8. Server risponde `200 OK` con il task aggiornato
9. React Query invalida la cache e ricarica i task della lista

## Calcolo termini processuali (regole art. 155 c.p.c.)

```
Input: dataInizio, giorni, tipo ("libero"|"processuale"), ancora (opzionale)

1. dies a quo non si conta (si parte da dataInizio + 1)
2. Si aggiungono N giorni
3. Se tipo = "processuale" e il periodo attraversa agosto:
   → si aggiungono 31 giorni (sospensione feriale 1-31 agosto)
4. Se la data risultante cade in festivo o weekend:
   → si sposta al primo giorno lavorativo successivo
5. Festività fisse: 1/1, 6/1, 25/4, 1/5, 2/6, 15/8, 1/11, 8/12, 25/12, 26/12
6. Festività variabile: Pasqua + Pasquetta (algoritmo di Gauss)
```

## Struttura dati JSON (task completo)

```json
{
  "id": "x-apple-reminder://...",
  "title": "Rossi c. Bianchi",
  "notes": "Tribunale di Milano, R.G. 1234/2026",
  "isCompleted": false,
  "dueDate": "2026-04-15T09:00:00Z",
  "section": "In corso",
  "list": "Pratiche",
  "priority": 1,
  "subtasks": [
    {
      "id": "x-apple-reminder://...",
      "title": "Deposito comparsa di risposta",
      "isCompleted": false,
      "dueDate": "2026-03-25T09:00:00Z"
    }
  ]
}
```

## Decisioni architetturali e motivazioni

| Decisione | Motivazione |
|-----------|-------------|
| CLI Swift anziché addon nativo | EventKit non ha binding Node.js stabili |
| execFile() anziché spawn() streaming | I comandi sono brevi e atomici, non serve streaming |
| JSON su stdout della CLI | Parsing semplice, debug facile con `./reminders-kit list-lists` |
| React Query per stato server | Cache automatica, invalidazione selettiva, zero boilerplate |
| dnd-kit anziché react-beautiful-dnd | Manutenuto attivamente, supporto React 18 |
| TailwindCSS | Sviluppo rapido, nessun file CSS separato da gestire |
