const API_URL = 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('typing_odyssey_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
};

export const api = {
  setToken: (token) => {
    localStorage.setItem('typing_odyssey_token', token);
  },

  clearToken: () => {
    localStorage.removeItem('typing_odyssey_token');
  },

  getToken: () => {
    return localStorage.getItem('typing_odyssey_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('typing_odyssey_token');
  },

  register: async (username, password) => {
    const res = await fetch(`${API_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.non_field_errors?.[0] || err.username?.[0] || 'Registration failed');
    }
    const data = await res.json();
    api.setToken(data.token);
    return data.user;
  },

  login: async (username, password) => {
    const res = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.non_field_errors?.[0] || 'Invalid username or password');
    }
    const data = await res.json();
    api.setToken(data.token);
    return data.user;
  },

  getProfile: async () => {
    const res = await fetch(`${API_URL}/profile/`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) api.clearToken();
      throw new Error('Failed to fetch profile');
    }
    return await res.json();
  },

  updateProfile: async (preferences) => {
    const res = await fetch(`${API_URL}/profile/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(preferences),
    });
    if (!res.ok) {
      throw new Error('Failed to update preferences');
    }
    return await res.json();
  },

  submitSession: async (sessionData) => {
    const res = await fetch(`${API_URL}/session/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) {
      throw new Error('Failed to submit session history');
    }
    return await res.json();
  },

  purchaseCosmetic: async (itemId, price) => {
    const res = await fetch(`${API_URL}/purchase/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ item_id: itemId, price }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to purchase item');
    }
    return await res.json();
  },

  getLeaderboard: async () => {
    const res = await fetch(`${API_URL}/leaderboard/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await res.json();
  },
};
