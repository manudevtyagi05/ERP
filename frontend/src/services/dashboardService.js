import apiClient from './apiClient';

export async function listDashboards(params = {}) {
  const { data } = await apiClient.get('/dashboards', { params });
  return data.data || [];
}

export async function createDashboard(payload) {
  const { data } = await apiClient.post('/dashboards', payload);
  return data.data;
}

export async function updateDashboard(id, payload) {
  const { data } = await apiClient.put(`/dashboards/${id}`, payload);
  return data.data;
}

export async function deleteDashboard(id) {
  const { data } = await apiClient.delete(`/dashboards/${id}`);
  return data;
}
