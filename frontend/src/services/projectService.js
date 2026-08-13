import apiClient from './apiClient';

export async function listProjects(params = {}) {
  const { data } = await apiClient.get('/projects', { params });
  return data.data;
}

export async function getProject(idOrKey) {
  const { data } = await apiClient.get(`/projects/${idOrKey}`);
  return data.data;
}

export async function createProject(payload) {
  const { data } = await apiClient.post('/projects', payload);
  return data.data;
}

export async function updateProject(id, payload) {
  const { data } = await apiClient.patch(`/projects/${id}`, payload);
  return data.data;
}

export async function toggleProjectStar(id) {
  const { data } = await apiClient.patch(`/projects/${id}/star`);
  return data.data;
}

export async function deleteProject(id) {
  const { data } = await apiClient.delete(`/projects/${id}`);
  return data.data;
}
