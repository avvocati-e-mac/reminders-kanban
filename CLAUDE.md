# CLAUDE.md — Guida per Claude Code

## Regole generali
- Commit semantici dopo ogni fase funzionante
- Formato commit: tipo(scope): descrizione (es. feat(cli), fix(server))
- Mai modificare il motore deadlineCalculator.js senza aggiornare CHANGELOG.md
- Tutti i template JSON devono essere validati con lo schema in /server/src/templates/schema.json

## Stack e path critici
- CLI binario: server/bin/reminders-kit (generato da scripts/build-cli.sh)
- Server porta: 3001
- Client porta: 5173
- Lista di test: "demo-app"
- Liste produzione: "Pratiche", "Compendium"

## Fasi di sviluppo
- ✅ FASE 0 — Scaffold, documentazione, repo GitHub
- 🚧 FASE 1 — CLI Swift con EventKit
- ❌ FASE 2 — Server Node.js Express
- ❌ FASE 3 — Template processuali JSON
- ❌ FASE 4 — Frontend React Kanban
- ❌ FASE 5 — Test end-to-end con lista "demo-app"
- ❌ FASE 6 — Script di avvio e DX

## Decisioni architetturali prese
- IPC tra server e CLI tramite child_process.execFile() (non socket, non stdin/stdout streaming)
- Il binario Swift viene compilato con `swift build -c release` e copiato in server/bin/
- Nessun dato hardcoded: i nomi delle liste vengono sempre letti da Reminders via CLI

## Problemi noti e workaround
- Prima esecuzione del binario Swift richiede autorizzazione macOS per accesso Reminders
- Node.js 25 (versione installata) è sperimentale ma compatibile con Express 4
