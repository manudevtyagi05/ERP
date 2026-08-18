import apiClient from './apiClient';

export async function listAutomationRules(params = {}) {
  const { data } = await apiClient.get('/automation', { params });
  return data.data || [];
}

export async function createAutomationRule(payload) {
  const { data } = await apiClient.post('/automation', payload);
  return data.data;
}

export async function updateAutomationRule(id, payload) {
  const { data } = await apiClient.put(`/automation/${id}`, payload);
  return data.data;
}

export async function toggleAutomationRule(id) {
  const { data } = await apiClient.post(`/automation/${id}/toggle`);
  return data.data;
}

export async function testExecuteAutomationRule(id, payload = {}) {
  const { data } = await apiClient.post(`/automation/${id}/test`, payload);
  return data;
}

export async function deleteAutomationRule(id) {
  const { data } = await apiClient.delete(`/automation/${id}`);
  return data;
}
