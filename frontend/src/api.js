const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function request(method, path, body) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      (data && data.detail) || response.statusText || 'Request failed',
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export default request;
