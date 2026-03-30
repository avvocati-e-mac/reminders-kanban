'use strict';

const { execFile } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '../../bin/reminders-kit');

/**
 * Esegue il binario Swift reminders-kit con gli argomenti forniti.
 * @param {string[]} args
 * @returns {Promise<any>} Output JSON parsato
 */
async function runCLI(args) {
  return new Promise((resolve, reject) => {
    execFile(CLI_PATH, args, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      const output = stdout.trim();
      if (!output) {
        return reject(new Error('CLI ha restituito output vuoto'));
      }
      try {
        resolve(JSON.parse(output));
      } catch (e) {
        reject(new Error(`Output CLI non è JSON valido: ${output.substring(0, 200)}`));
      }
    });
  });
}

/** @returns {Promise<Array<{id: string, title: string}>>} */
async function getLists() {
  return runCLI(['list-lists']);
}

/**
 * @param {string} listName
 * @returns {Promise<Array>} task con subtasks
 */
async function getTasks(listName) {
  return runCLI(['list-tasks', '--list', listName]);
}

/**
 * @param {string} id
 * @returns {Promise<Object>}
 */
async function getTask(id) {
  return runCLI(['get-task', '--id', id]);
}

/**
 * @param {Object} params
 * @param {string} params.list
 * @param {string} params.title
 * @param {string} [params.note]
 * @param {string} [params.due] ISO8601
 * @param {string} [params.section]
 * @returns {Promise<Object>}
 */
async function createTask({ list, title, note, due, section }) {
  const args = ['create-task', '--list', list, '--title', title];
  if (note) args.push('--note', note);
  if (due) args.push('--due', due);
  if (section) args.push('--section', section);
  return runCLI(args);
}

/**
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateTask(id, { title, completed, due, note } = {}) {
  const args = ['update-task', '--id', id];
  if (title !== undefined) args.push('--title', title);
  if (completed !== undefined) args.push('--completed', String(completed));
  if (due !== undefined) args.push('--due', due);
  if (note !== undefined) args.push('--note', note);
  return runCLI(args);
}

/**
 * @param {string} parentId
 * @param {string} title
 * @param {string} [due] ISO8601
 * @returns {Promise<Object>}
 */
async function createSubtask(parentId, title, due) {
  const args = ['create-subtask', '--parent', parentId, '--title', title];
  if (due) args.push('--due', due);
  return runCLI(args);
}

/**
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateSubtask(id, { title, completed, due } = {}) {
  const args = ['update-subtask', '--id', id];
  if (title !== undefined) args.push('--title', title);
  if (completed !== undefined) args.push('--completed', String(completed));
  if (due !== undefined) args.push('--due', due);
  return runCLI(args);
}

/**
 * @param {string} id
 * @param {string} section
 * @returns {Promise<Object>}
 */
async function moveTask(id, section) {
  return runCLI(['move-task', '--id', id, '--section', section]);
}

module.exports = {
  getLists,
  getTasks,
  getTask,
  createTask,
  updateTask,
  createSubtask,
  updateSubtask,
  moveTask,
};
