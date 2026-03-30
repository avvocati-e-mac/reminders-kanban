'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// GET /api/templates
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json') && f !== 'schema.json');
    const templates = files.map(f => {
      const content = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8'));
      return {
        id: content.id,
        nome: content.nome,
        descrizione: content.descrizione,
        triggerLabel: content.triggerLabel,
        triggerKey: content.triggerKey,
        subtaskCount: content.subtasks?.length ?? 0,
      };
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:id
router.get('/:id', (req, res) => {
  const filePath = path.join(TEMPLATES_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Template "${req.params.id}" non trovato` });
  }
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
