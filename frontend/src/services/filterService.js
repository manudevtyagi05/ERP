import apiClient from './apiClient';

export async function listFilters(params = {}) {
  const { data } = await apiClient.get('/filters', { params });
  return data.data || [];
}

export async function createFilter(payload) {
  const { data } = await apiClient.post('/filters', payload);
  return data.data;
}

export async function updateFilter(id, payload) {
  const { data } = await apiClient.put(`/filters/${id}`, payload);
  return data.data;
}

export async function toggleFavoriteFilter(id) {
  const { data } = await apiClient.post(`/filters/${id}/favorite`);
  return data.data;
}

export async function deleteFilter(id) {
  const { data } = await apiClient.delete(`/filters/${id}`);
  return data;
}
