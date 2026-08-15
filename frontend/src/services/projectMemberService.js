import apiClient from './apiClient';

export async function listProjectMembers(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/members`);
  return data.data;
}

/**
 * Add a member to a project.
 * Payload: { userId: string, projectRoles: string[] }
 * Backward compat: { userId, projectRole: string } also accepted by the backend.
 */
export async function addProjectMember(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/members`, payload);
  return data.data;
}

/**
 * Update the project roles for an existing member.
 * Payload: { projectRoles: string[] }
 */
export async function updateProjectMemberRoles(projectId, memberId, projectRoles) {
  const { data } = await apiClient.patch(`/projects/${projectId}/members/${memberId}`, {
    projectRoles,
  });
  return data.data;
}

/**
 * Legacy alias — still works, sends projectRoles as a one-element array.
 * @deprecated Use updateProjectMemberRoles instead.
 */
export async function updateProjectMemberRole(projectId, memberId, projectRole) {
  return updateProjectMemberRoles(projectId, memberId, [projectRole]);
}

export async function removeProjectMember(projectId, memberId) {
  const { data } = await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  return data;
}
