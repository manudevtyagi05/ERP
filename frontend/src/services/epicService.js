import apiClient from './apiClient';

export async function listEpics(params = {}) {
  const { data } = await apiClient.get('/epics', { params });
  return data.data || [];
}

export async function createEpic(payload) {
  const { data } = await apiClient.post('/epics', payload);
  return data.data;
}

export async function updateEpic(id, payload) {
  const { data } = await apiClient.put(`/epics/${id}`, payload);
  return data.data;
}

export async function deleteEpic(id) {
  const { data } = await apiClient.delete(`/epics/${id}`);
  return data;
}
