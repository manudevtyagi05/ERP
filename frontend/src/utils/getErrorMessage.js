export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  return error.response.data?.message || fallback;
}
