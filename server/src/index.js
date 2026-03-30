'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const listsRouter = require('./routes/lists');
const tasksRouter = require('./routes/tasks');
const subtasksRouter = require('./routes/subtasks');
const templatesRouter = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logging minimale in dev
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/lists', listsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/subtasks', subtasksRouter);
app.use('/api/templates', templatesRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '0.1.0' }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Endpoint non trovato' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Errore non gestito:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RemindersKanban server avviato su http://0.0.0.0:${PORT}`);
});
