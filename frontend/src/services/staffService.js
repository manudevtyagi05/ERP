import apiClient from './apiClient';

export async function listStaff({ page, limit, role, isActive, search } = {}) {
  const { data } = await apiClient.get('/staff', {
    params: { page, limit, role, isActive, search },
  });
  return { items: data.data, meta: data.meta };
}

export async function getStaff(id) {
  const { data } = await apiClient.get(`/staff/${id}`);
  return data.data;
}

export async function createStaff(payload) {
  const { data } = await apiClient.post('/staff', payload);
  return data.data;
}

export async function updateStaff(id, payload) {
  const { data } = await apiClient.patch(`/staff/${id}`, payload);
  return data.data;
}

export async function activateStaff(id) {
  const { data } = await apiClient.patch(`/staff/${id}/activate`);
  return data.data;
}

export async function deactivateStaff(id) {
  const { data } = await apiClient.patch(`/staff/${id}/deactivate`);
  return data.data;
}

export async function deleteStaff(id) {
  const { data } = await apiClient.delete(`/staff/${id}`);
  return data;
}

export async function resetStaffPassword(id, newPassword) {
  const { data } = await apiClient.post(`/staff/${id}/reset-password`, { newPassword });
  return data;
}

export async function changeStaffRole(id, role) {
  const { data } = await apiClient.patch(`/staff/${id}/role`, { role });
  return data.data;
}
