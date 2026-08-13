import apiClient from './apiClient';

export async function listMilestones(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/milestones`);
  return data.data;
}

export async function createMilestone(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/milestones`, payload);
  return data.data;
}

export async function updateMilestone(projectId, milestoneId, payload) {
  const { data } = await apiClient.patch(`/projects/${projectId}/milestones/${milestoneId}`, payload);
  return data.data;
}

export async function deleteMilestone(projectId, milestoneId) {
  const { data } = await apiClient.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  return data;
}
