import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getLists = () => api.get('/lists').then(r => r.data);
export const getTasks = (listName) => api.get(`/lists/${encodeURIComponent(listName)}/tasks`).then(r => r.data);
export const getTask = (id) => api.get(`/tasks/${encodeURIComponent(id)}`).then(r => r.data);
export const createTask = (data) => api.post('/tasks', data).then(r => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${encodeURIComponent(id)}`, data).then(r => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${encodeURIComponent(id)}`).then(r => r.data);
export const moveTask = (id, section) => api.post(`/tasks/${encodeURIComponent(id)}/move`, { section }).then(r => r.data);
export const createSubtask = (taskId, data) => api.post(`/tasks/${encodeURIComponent(taskId)}/subtasks`, data).then(r => r.data);
export const updateSubtask = (id, data) => api.put(`/subtasks/${encodeURIComponent(id)}`, data).then(r => r.data);
export const getTemplates = () => api.get('/templates').then(r => r.data);
export const getTemplate = (id) => api.get(`/templates/${id}`).then(r => r.data);
export const applyTemplate = (taskId, templateId, triggerDate) =>
  api.post(`/tasks/${encodeURIComponent(taskId)}/apply-template`, { templateId, triggerDate }).then(r => r.data);
