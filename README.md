# RemindersKanban

Interfaccia Kanban bidirezionale per Apple Reminders su macOS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Swift](https://img.shields.io/badge/Swift-6.3-orange.svg)
![Node](https://img.shields.io/badge/Node.js-20+-green.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)

## Funzionalità

- Visualizzazione Kanban delle liste Apple Reminders con sezioni come colonne
- Drag & drop per spostare task tra sezioni (sincronizzato con Reminders.app)
- Gestione subtask con checkbox e date di scadenza colorate
- 10 template processuali con calcolo automatico termini (art. 155 c.p.c.)
- Calcolo sospensione feriale (1-31 agosto) e festività italiane
- Creazione rapida di task e subtask
- Sincronizzazione bidirezionale in tempo reale

## Requisiti

- macOS 13 o superiore
- Xcode Command Line Tools (`xcode-select --install`)
- Node.js 20+
- Swift 5.9+

## Installazione rapida

```bash
git clone https://github.com/avvocati-e-mac/reminders-kanban.git
cd reminders-kanban
npm run setup
npm run start
```

Al primo avvio macOS chiederà il permesso per accedere ad Apple Reminders: concedilo.

Poi apri: http://localhost:5173

## Come funziona

```
Apple Reminders
      ↕ EventKit (framework nativo)
CLI Swift (reminders-kit)
      ↕ child_process.execFile() via JSON stdout
Server Node.js (porta 3001)
      ↕ REST API JSON
Client React (porta 5173)
```

1. Il client React chiama le API REST del server Node.js
2. Il server esegue il binario Swift `reminders-kit` come sottoprocesso
3. Il binario Swift usa EventKit per leggere/scrivere Apple Reminders
4. Le modifiche appaiono immediatamente sia nella Kanban che in Reminders.app

## Template processuali inclusi

| Template | Norma |
|----------|-------|
| Comparsa di risposta (rito civile ordinario) | Art. 166 c.p.c. |
| Memorie istruttorie (Riforma Cartabia) | Art. 171-ter c.p.c. |
| Note conclusive civile | Art. 189/190 c.p.c. |
| Comparsa di risposta (rito lavoro) | Art. 416 c.p.c. |
| Memorie rito lavoro | Art. 420 c.p.c. |
| Esecuzione mobiliare | Art. 513 ss. c.p.c. |
| Esecuzione presso terzi | Art. 543 ss. c.p.c. |
| Esecuzione immobiliare | Art. 555 ss. c.p.c. |
| Precetto | Art. 480 c.p.c. |
| Perenzione | Art. 497 e 630 c.p.c. |

## Sviluppo futuro (roadmap)

- [ ] Notifiche macOS per scadenze imminenti
- [ ] Sincronizzazione automatica via polling
- [ ] Export PDF del fascicolo
- [ ] Supporto iCloud per sincronizzazione multi-device
- [ ] Widget macOS

## Contribuire

Progetto personale. Pull request non accettate.

## Licenza

MIT — vedi [LICENSE](LICENSE)
