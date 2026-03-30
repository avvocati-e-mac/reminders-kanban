'use strict';

const express = require('express');
const router = express.Router();
const reminders = require('../services/remindersService');

// PUT /api/subtasks/:id
router.put('/:id', async (req, res) => {
  const { title, completed, due } = req.body;
  try {
    const subtask = await reminders.updateSubtask(req.params.id, { title, completed, due });
    res.json(subtask);
  } catch (err) {
    if (err.message.includes('non trovato')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
