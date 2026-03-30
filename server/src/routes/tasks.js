'use strict';

const express = require('express');
const router = express.Router();
const reminders = require('../services/remindersService');
const { calcolaTermine } = require('../services/deadlineCalculator');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await reminders.getTask(req.params.id);
    res.json(task);
  } catch (err) {
    if (err.message.includes('non trovato')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const { list, title, section, note, due } = req.body;
  if (!list) return res.status(400).json({ error: 'Campo "list" obbligatorio' });
  if (!title) return res.status(400).json({ error: 'Campo "title" obbligatorio' });
  try {
    const task = await reminders.createTask({ list, title, note, due, section });
    // Se è specificata una sezione, applica subito il move
    if (section) {
      await reminders.moveTask(task.id, section);
    }
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const { title, completed, due, note } = req.body;
  try {
    const task = await reminders.updateTask(req.params.id, { title, completed, due, note });
    res.json(task);
  } catch (err) {
    if (err.message.includes('non trovato')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id — completa il task
router.delete('/:id', async (req, res) => {
  try {
    const task = await reminders.updateTask(req.params.id, { completed: true });
    res.json(task);
  } catch (err) {
    if (err.message.includes('non trovato')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/subtasks
router.post('/:id/subtasks', async (req, res) => {
  const { title, due } = req.body;
  if (!title) return res.status(400).json({ error: 'Campo "title" obbligatorio' });
  try {
    const subtask = await reminders.createSubtask(req.params.id, title, due);
    res.status(201).json(subtask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/move
router.post('/:id/move', async (req, res) => {
  const { section } = req.body;
  if (!section) return res.status(400).json({ error: 'Campo "section" obbligatorio' });
  try {
    const task = await reminders.moveTask(req.params.id, section);
    res.json(task);
  } catch (err) {
    if (err.message.includes('non trovato')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/apply-template
router.post('/:id/apply-template', async (req, res) => {
  const { templateId, triggerDate } = req.body;
  if (!templateId) return res.status(400).json({ error: 'Campo "templateId" obbligatorio' });
  if (!triggerDate) return res.status(400).json({ error: 'Campo "triggerDate" obbligatorio' });

  const templatePath = path.join(TEMPLATES_DIR, `${templateId}.json`);
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({ error: `Template "${templateId}" non trovato` });
  }

  let template;
  try {
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  } catch (e) {
    return res.status(500).json({ error: 'Errore lettura template' });
  }

  const ancora = new Date(triggerDate);
  if (isNaN(ancora.getTime())) {
    return res.status(400).json({ error: 'triggerDate non è una data valida (ISO8601)' });
  }

  const createdSubtasks = [];
  const errors = [];

  for (const subtaskDef of template.subtasks) {
    try {
      const dataScadenza = calcolaTermine(
        new Date(), // non usato per termini negativi con ancora
        subtaskDef.giorni,
        subtaskDef.tipo || 'processuale',
        ancora
      );
      const subtask = await reminders.createSubtask(
        req.params.id,
        subtaskDef.titolo,
        dataScadenza.toISOString()
      );
      createdSubtasks.push(subtask);
    } catch (err) {
      errors.push({ subtask: subtaskDef.titolo, error: err.message });
    }
  }

  res.json({
    created: createdSubtasks.length,
    subtasks: createdSubtasks,
    errors: errors.length > 0 ? errors : undefined,
  });
});

module.exports = router;
