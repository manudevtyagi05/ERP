import apiClient from './apiClient';

export async function listSprints(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/sprints`);
  return data.data;
}

export async function getBacklog(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/backlog`);
  return data.data;
}

export async function createSprint(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/sprints`, payload);
  return data.data;
}

export async function updateSprint(projectId, sprintId, payload) {
  const { data } = await apiClient.patch(`/projects/${projectId}/sprints/${sprintId}`, payload);
  return data.data;
}

export async function deleteSprint(projectId, sprintId) {
  const { data } = await apiClient.delete(`/projects/${projectId}/sprints/${sprintId}`);
  return data;
}

export async function startSprint(projectId, sprintId, payload = {}) {
  const { data } = await apiClient.patch(`/projects/${projectId}/sprints/${sprintId}/start`, payload);
  return data.data;
}

export async function completeSprint(projectId, sprintId, payload = {}) {
  const { data } = await apiClient.patch(`/projects/${projectId}/sprints/${sprintId}/complete`, payload);
  return data.data;
}
