import apiClient from './apiClient';

export async function listProjectMembers(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/members`);
  return data.data;
}

export async function addProjectMember(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/members`, payload);
  return data.data;
}

export async function updateProjectMemberRole(projectId, memberId, projectRole) {
  const { data } = await apiClient.patch(`/projects/${projectId}/members/${memberId}`, { projectRole });
  return data.data;
}

export async function removeProjectMember(projectId, memberId) {
  const { data } = await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  return data;
}
