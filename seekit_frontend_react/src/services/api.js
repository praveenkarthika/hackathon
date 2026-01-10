const API_BASE_URL = 'http://172.32.4.92:8000/api';

// Helper to get token
const getToken = () => localStorage.getItem('token');

// Generic fetch wrapper to handle auth headers
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // Handle 401 Unauthorized (token expired/invalid)
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const loginUser = async (user_email, password) => {
  const formData = new FormData();
  formData.append('user_email', user_email);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
};

export const fetchDashboardData = async () => {
  return apiRequest('/dashboard_summary');
};

export const fetchTickets = async () => {
  return apiRequest('/get_ticket');
};

export const createTicketApi = async (ticketData) => {
  return apiRequest('/create_ticket', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  });
};

export const updateTicketApi = async (ticketData) => {
  return apiRequest('/update_ticket', {
    method: 'PUT',
    body: JSON.stringify(ticketData),
  });
};

export const resolveTicketApi = async (ticketId, status, comment) => {
  return apiRequest('/resolve_ticket', {
    method: 'POST',
    body: JSON.stringify({ ticket_id: ticketId, status, comment }),
  });
};

export const fetchUsers = async () => {
  return apiRequest('/get_users');
};

export default apiRequest;
