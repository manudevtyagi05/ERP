import apiClient from './apiClient';

export async function listReleases(params = {}) {
  const { data } = await apiClient.get('/releases', { params });
  return data.data || [];
}

export async function createRelease(payload) {
  const { data } = await apiClient.post('/releases', payload);
  return data.data;
}

export async function updateRelease(id, payload) {
  const { data } = await apiClient.put(`/releases/${id}`, payload);
  return data.data;
}

export async function deleteRelease(id) {
  const { data } = await apiClient.delete(`/releases/${id}`);
  return data;
}
