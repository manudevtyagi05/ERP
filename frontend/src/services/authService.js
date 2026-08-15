import apiClient from './apiClient';

export async function loginRequest({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data.user;
}

export async function logoutRequest() {
  const { data } = await apiClient.post('/auth/logout');
  return data;
}

export async function changePasswordRequest({ currentPassword, newPassword }) {
  const { data } = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}

export async function updateNotificationPreferencesRequest(preferences) {
  const { data } = await apiClient.patch('/auth/me/notification-preferences', preferences);
  return data.data.user;
}

export async function updateProfileRequest(profileData) {
  const { data } = await apiClient.patch('/auth/me/profile', profileData);
  return data.data.user;
}
