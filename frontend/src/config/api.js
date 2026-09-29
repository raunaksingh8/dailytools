export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return await response.json();
  } catch (error) {
    console.error('Failed to check backend health:', error);
    return { status: 'error' };
  }
};
