'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

function runJXA(script) {
  return new Promise((resolve, reject) => {
    const tmpFile = `/tmp/rk-${Date.now()}-${Math.random().toString(36).slice(2)}.js`;
    fs.writeFileSync(tmpFile, script, 'utf8');
    execFile('osascript', ['-l', 'JavaScript', tmpFile], { timeout: 15000 }, (err, stdout, stderr) => {
      fs.unlink(tmpFile, () => {});
      if (err) return reject(new Error(stderr || stdout || err.message));
      const output = stdout.trim();
      if (!output) return resolve(null);
      try { resolve(JSON.parse(output)); } catch { resolve(output); }
    });
  });
}

async function getLists() {
  return runJXA(`
    const app = Application('Reminders');
    JSON.stringify(app.lists().map(l => ({ id: l.id(), title: l.name() })));
  `);
}

async function getTasks(listName) {
  return runJXA(`
    const app = Application('Reminders');
    const listObj = app.lists().find(l => l.name() === ${JSON.stringify(listName)});
    if (!listObj) throw new Error('Lista non trovata: ' + ${JSON.stringify(listName)});

    const subtaskMap = {};
    const parents = [];

    for (const r of listObj.reminders()) {
      if (r.completed()) continue;
      const notes = r.body() || '';
      const parentMatch = notes.match(/__parent:([^\\n]+)/);
      if (parentMatch) {
        const pid = parentMatch[1].trim();
        if (!subtaskMap[pid]) subtaskMap[pid] = [];
        const dd = r.dueDate();
        subtaskMap[pid].push({ id: r.id(), title: r.name(), isCompleted: r.completed(), dueDate: dd ? dd.toISOString() : null });
      } else {
        parents.push(r);
      }
    }

    JSON.stringify(parents.map(r => {
      const notes = r.body() || '';
      const sectionMatch = notes.match(/__section:([^\\n]+)/);
      const cleanNotes = notes.replace(/__section:[^\\n]+\\n?/g,'').replace(/__parent:[^\\n]+\\n?/g,'').trim();
      const rid = r.id();
      const dd = r.dueDate();
      return {
        id: rid, title: r.name(),
        notes: cleanNotes || null,
        isCompleted: r.completed(),
        dueDate: dd ? dd.toISOString() : null,
        section: sectionMatch ? sectionMatch[1].trim() : null,
        list: ${JSON.stringify(listName)},
        priority: r.priority(),
        subtasks: subtaskMap[rid] || []
      };
    }));
  `);
}

async function getTask(id) {
  return runJXA(`
    const app = Application('Reminders');
    let found = null;
    for (const l of app.lists()) {
      found = l.reminders().find(r => r.id() === ${JSON.stringify(id)});
      if (found) break;
    }
    if (!found) throw new Error('Task non trovato');
    const notes = found.body() || '';
    const sectionMatch = notes.match(/__section:([^\\n]+)/);
    const cleanNotes = notes.replace(/__section:[^\\n]+\\n?/g,'').replace(/__parent:[^\\n]+\\n?/g,'').trim();
    const dd = found.dueDate();
    JSON.stringify({
      id: found.id(), title: found.name(),
      notes: cleanNotes || null,
      isCompleted: found.completed(),
      dueDate: dd ? dd.toISOString() : null,
      section: sectionMatch ? sectionMatch[1].trim() : null,
      list: found.container().name(), priority: found.priority(), subtasks: []
    });
  `);
}

async function createTask({ list, title, note, due, section }) {
  return runJXA(`
    const app = Application('Reminders');
    const listObj = app.lists().find(l => l.name() === ${JSON.stringify(list)});
    if (!listObj) throw new Error('Lista non trovata');
    const lines = [];
    ${note ? `lines.push(${JSON.stringify(note)});` : ''}
    ${section ? `lines.push('__section:' + ${JSON.stringify(section)});` : ''}
    const props = { name: ${JSON.stringify(title)}, body: lines.join('\\n') };
    ${due ? `props.dueDate = new Date(${JSON.stringify(due)});` : ''}
    const r = app.Reminder(props);
    listObj.reminders.push(r);
    const dd = r.dueDate();
    JSON.stringify({ id: r.id(), title: r.name(), notes: ${note ? JSON.stringify(note) : 'null'}, isCompleted: false, dueDate: dd ? dd.toISOString() : null, section: ${section ? JSON.stringify(section) : 'null'}, list: ${JSON.stringify(list)}, priority: 0, subtasks: [] });
  `);
}

async function updateTask(id, { title, completed, due, note } = {}) {
  return runJXA(`
    const app = Application('Reminders');
    let r = null;
    for (const l of app.lists()) {
      r = l.reminders().find(rem => rem.id() === ${JSON.stringify(id)});
      if (r) break;
    }
    if (!r) throw new Error('Task non trovato');
    ${title !== undefined ? `r.name = ${JSON.stringify(title)};` : ''}
    ${completed !== undefined ? `r.completed = ${completed};` : ''}
    ${due && due !== 'null' ? `r.dueDate = new Date(${JSON.stringify(due)});` : ''}
    ${due === 'null' ? `r.dueDate = null;` : ''}
    const notes = r.body() || '';
    const sectionMatch = notes.match(/__section:([^\\n]+)/);
    const cleanNotes = notes.replace(/__section:[^\\n]+\\n?/g,'').replace(/__parent:[^\\n]+\\n?/g,'').trim();
    const dd = r.dueDate();
    JSON.stringify({ id: r.id(), title: r.name(), notes: cleanNotes || null, isCompleted: r.completed(), dueDate: dd ? dd.toISOString() : null, section: sectionMatch ? sectionMatch[1].trim() : null, list: r.container().name(), priority: r.priority(), subtasks: [] });
  `);
}

async function createSubtask(parentId, title, due) {
  return runJXA(`
    const app = Application('Reminders');
    let parent = null; let targetList = null;
    for (const l of app.lists()) {
      parent = l.reminders().find(r => r.id() === ${JSON.stringify(parentId)});
      if (parent) { targetList = l; break; }
    }
    if (!parent) throw new Error('Task padre non trovato');
    const props = { name: ${JSON.stringify(title)}, body: '__parent:' + ${JSON.stringify(parentId)} };
    ${due ? `props.dueDate = new Date(${JSON.stringify(due)});` : ''}
    const sub = app.Reminder(props);
    targetList.reminders.push(sub);
    const dd = sub.dueDate();
    JSON.stringify({ id: sub.id(), title: sub.name(), isCompleted: false, dueDate: dd ? dd.toISOString() : null });
  `);
}

async function updateSubtask(id, { title, completed, due } = {}) {
  return runJXA(`
    const app = Application('Reminders');
    let r = null;
    for (const l of app.lists()) {
      r = l.reminders().find(rem => rem.id() === ${JSON.stringify(id)});
      if (r) break;
    }
    if (!r) throw new Error('Subtask non trovato');
    ${title !== undefined ? `r.name = ${JSON.stringify(title)};` : ''}
    ${completed !== undefined ? `r.completed = ${completed};` : ''}
    ${due && due !== 'null' ? `r.dueDate = new Date(${JSON.stringify(due)});` : ''}
    ${due === 'null' ? `r.dueDate = null;` : ''}
    const dd = r.dueDate();
    JSON.stringify({ id: r.id(), title: r.name(), isCompleted: r.completed(), dueDate: dd ? dd.toISOString() : null });
  `);
}

async function moveTask(id, section) {
  return runJXA(`
    const app = Application('Reminders');
    let r = null;
    for (const l of app.lists()) {
      r = l.reminders().find(rem => rem.id() === ${JSON.stringify(id)});
      if (r) break;
    }
    if (!r) throw new Error('Task non trovato');
    const lines = (r.body() || '').split('\\n').filter(l => !l.startsWith('__section:'));
    lines.push('__section:' + ${JSON.stringify(section)});
    r.body = lines.join('\\n');
    const dd = r.dueDate();
    JSON.stringify({ id: r.id(), title: r.name(), notes: (r.body()||'').replace(/__section:[^\\n]+\\n?/g,'').replace(/__parent:[^\\n]+\\n?/g,'').trim()||null, isCompleted: r.completed(), dueDate: dd ? dd.toISOString() : null, section: ${JSON.stringify(section)}, list: r.container().name(), priority: r.priority(), subtasks: [] });
  `);
}

module.exports = { getLists, getTasks, getTask, createTask, updateTask, createSubtask, updateSubtask, moveTask };
