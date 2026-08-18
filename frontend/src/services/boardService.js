import apiClient from './apiClient';

export async function getBoard(projectId) {
  const { data } = await apiClient.get(`/boards/project/${projectId}`);
  return data.data;
}

export async function updateBoard(projectId, payload) {
  const { data } = await apiClient.put(`/boards/project/${projectId}`, payload);
  return data.data;
}
