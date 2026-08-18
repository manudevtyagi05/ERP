import apiClient from './apiClient';

export async function listComponents(params = {}) {
  const { data } = await apiClient.get('/components', { params });
  return data.data || [];
}

export async function createComponent(payload) {
  const { data } = await apiClient.post('/components', payload);
  return data.data;
}

export async function updateComponent(id, payload) {
  const { data } = await apiClient.put(`/components/${id}`, payload);
  return data.data;
}

export async function deleteComponent(id) {
  const { data } = await apiClient.delete(`/components/${id}`);
  return data;
}
