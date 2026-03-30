'use strict';

const express = require('express');
const router = express.Router();
const reminders = require('../services/remindersService');

// GET /api/lists
router.get('/', async (req, res) => {
  try {
    const lists = await reminders.getLists();
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lists/:listName/tasks
router.get('/:listName/tasks', async (req, res) => {
  try {
    const tasks = await reminders.getTasks(req.params.listName);
    res.json(tasks);
  } catch (err) {
    if (err.message.includes('Lista non trovata')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
