import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const createApiClient = (token?: string | null) =>
  axios.create({
    baseURL: apiBaseUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
