import apiClient from './apiClient';

export async function listIssues(params = {}) {
  const { data } = await apiClient.get('/issues', { params });
  return data.data;
}

export async function getIssueStats(params = {}) {
  const { data } = await apiClient.get('/issues/stats', { params });
  return data.data;
}

export async function getIssue(idOrKey) {
  const { data } = await apiClient.get(`/issues/${idOrKey}`);
  return data.data;
}

export async function getIssueActivity(id) {
  const { data } = await apiClient.get(`/issues/${id}/activity`);
  return data.data;
}

export async function createIssue(payload) {
  const { data } = await apiClient.post('/issues', payload);
  return data.data;
}

export async function updateIssue(id, payload) {
  const { data } = await apiClient.patch(`/issues/${id}`, payload);
  return data.data;
}

export async function assignIssue(id, assigneeId) {
  const { data } = await apiClient.patch(`/issues/${id}/assign`, { assigneeId });
  return data.data;
}

export async function moveIssueStatus(id, status) {
  const { data } = await apiClient.patch(`/issues/${id}/status`, { status });
  return data.data;
}

export async function deleteIssue(id) {
  const { data } = await apiClient.delete(`/issues/${id}`);
  return data.data;
}

export async function addComment(id, content) {
  const { data } = await apiClient.post(`/issues/${id}/comments`, { content });
  return data.data;
}

export async function toggleSubtask(id, subtaskId) {
  const { data } = await apiClient.patch(`/issues/${id}/subtasks/${subtaskId}/toggle`);
  return data.data;
}
