import apiClient from './apiClient';

export async function listSprints(params = {}) {
  const { data } = await apiClient.get('/sprints', { params });
  return data.data || [];
}

export async function createSprint(payload) {
  const { data } = await apiClient.post('/sprints', payload);
  return data.data;
}

export async function updateSprint(id, payload) {
  const { data } = await apiClient.put(`/sprints/${id}`, payload);
  return data.data;
}

export async function startSprint(id, payload) {
  const { data } = await apiClient.post(`/sprints/${id}/start`, payload);
  return data.data;
}

export async function completeSprint(id, payload) {
  const { data } = await apiClient.post(`/sprints/${id}/complete`, payload);
  return data.data;
}

export async function deleteSprint(id) {
  const { data } = await apiClient.delete(`/sprints/${id}`);
  return data;
}
