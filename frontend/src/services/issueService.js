import apiClient from './apiClient';

export async function listIssues(params = {}) {
  const { data } = await apiClient.get('/issues', { params });
  return data.data || [];
}

export async function getIssue(idOrKey) {
  const { data } = await apiClient.get(`/issues/${idOrKey}`);
  return data.data;
}

export async function getIssueStats(params = {}) {
  const { data } = await apiClient.get('/issues/stats', { params });
  return data.data;
}

export async function createIssue(payload) {
  const { data } = await apiClient.post('/issues', payload);
  return data.data;
}

export async function updateIssue(id, payload) {
  const { data } = await apiClient.put(`/issues/${id}`, payload);
  return data.data;
}

export async function assignIssue(id, assigneeId) {
  const { data } = await apiClient.post(`/issues/${id}/assign`, { assigneeId });
  return data.data;
}

export async function moveIssueStatus(id, status) {
  const { data } = await apiClient.post(`/issues/${id}/status`, { status });
  return data.data;
}

export async function deleteIssue(id) {
  const { data } = await apiClient.delete(`/issues/${id}`);
  return data;
}

export async function addComment(id, content) {
  const { data } = await apiClient.post(`/issues/${id}/comments`, { content });
  return data.data;
}

export async function addReaction(id, commentId, emoji) {
  const { data } = await apiClient.post(`/issues/${id}/comments/reaction`, { commentId, emoji });
  return data.data;
}

export async function logWork(id, payload) {
  const { data } = await apiClient.post(`/issues/${id}/worklog`, payload);
  return data.data;
}

export async function linkIssue(id, payload) {
  const { data } = await apiClient.post(`/issues/${id}/links`, payload);
  return data.data;
}

export async function deleteLink(id, linkId) {
  const { data } = await apiClient.delete(`/issues/${id}/links/${linkId}`);
  return data.data;
}

export async function toggleWatcher(id) {
  const { data } = await apiClient.post(`/issues/${id}/watchers`);
  return data.data;
}

export async function toggleVote(id) {
  const { data } = await apiClient.post(`/issues/${id}/votes`);
  return data.data;
}

export async function addSubtask(id, payload) {
  const { data } = await apiClient.post(`/issues/${id}/subtasks`, payload);
  return data.data;
}

export async function toggleSubtask(id, subtaskId) {
  const { data } = await apiClient.post(`/issues/${id}/subtasks/${subtaskId}/toggle`);
  return data.data;
}

export async function deleteSubtask(id, subtaskId) {
  const { data } = await apiClient.delete(`/issues/${id}/subtasks/${subtaskId}`);
  return data.data;
}

export async function getIssueActivity(id) {
  const { data } = await apiClient.get(`/issues/${id}/activity`);
  return data.data;
}
