const API_BASE = '/api';

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

export const registerUser = async ({ name, email, password, phone }) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ name, email, password, phone })
  });
  return response.json();
};

export const fetchVenues = async (search) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const response = await fetch(`${API_BASE}/venues?${params.toString()}`);
  return response.json();
};

export const fetchVenueDetails = async (id) => {
  const response = await fetch(`${API_BASE}/venues/${id}`);
  return response.json();
};

export const fetchGrounds = async ({ search, sport_id, city, status } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (sport_id) params.set('sport_id', sport_id);
  if (city) params.set('city', city);
  if (status) params.set('status', status);
  const response = await fetch(`${API_BASE}/grounds?${params.toString()}`);
  return response.json();
};

export const fetchGroundDetails = async (id) => {
  const response = await fetch(`${API_BASE}/grounds/${id}`);
  return response.json();
};

export const createGround = async (token, payload) => {
  const response = await fetch(`${API_BASE}/grounds`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const updateGround = async (token, id, payload) => {
  const response = await fetch(`${API_BASE}/grounds/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const deleteGround = async (token, id) => {
  const response = await fetch(`${API_BASE}/grounds/${id}`, {
    method: 'DELETE',
    headers: jsonHeaders(token)
  });
  return response.json();
};

export const fetchSlots = async ({ ground_id, date, status } = {}) => {
  const params = new URLSearchParams();
  if (ground_id) params.set('ground_id', ground_id);
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const response = await fetch(`${API_BASE}/slots?${params.toString()}`);
  return response.json();
};

export const fetchSlotDetails = async (id) => {
  const response = await fetch(`${API_BASE}/slots/${id}`);
  return response.json();
};

export const createSlot = async (token, payload) => {
  const response = await fetch(`${API_BASE}/slots`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const updateSlot = async (token, id, payload) => {
  const response = await fetch(`${API_BASE}/slots/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const deleteSlot = async (token, id) => {
  const response = await fetch(`${API_BASE}/slots/${id}`, {
    method: 'DELETE',
    headers: jsonHeaders(token)
  });
  return response.json();
};

export const createBooking = async (token, payload) => {
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const fetchBookings = async (token) => {
  const response = await fetch(`${API_BASE}/bookings`, {
    headers: jsonHeaders(token)
  });
  return response.json();
};

export const fetchMyProfile = async (token) => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: jsonHeaders(token)
  });
  return response.json();
};

export const updateMyProfile = async (token, payload) => {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const changeMyPassword = async (token, payload) => {
  const response = await fetch(`${API_BASE}/users/me/password`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const fetchEquipment = async (token) => (await fetch(`${API_BASE}/equipment`, { headers: jsonHeaders(token) })).json();
export const fetchEquipmentReservations = async (token) => (await fetch(`${API_BASE}/equipment/reservations`, { headers: jsonHeaders(token) })).json();
export const reserveEquipment = async (token, payload) => (await fetch(`${API_BASE}/equipment/reservations`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload) })).json();
export const cancelEquipmentReservation = async (token, id) => (await fetch(`${API_BASE}/equipment/reservations/${id}/cancel`, { method: 'PUT', headers: jsonHeaders(token) })).json();

export const fetchInventory = async (token) => (await fetch(`${API_BASE}/inventory`, { headers: jsonHeaders(token) })).json();
export const createInventoryEntry = async (token, payload) => (await fetch(`${API_BASE}/inventory`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload) })).json();

export const fetchNotifications = async (token) => (await fetch(`${API_BASE}/notifications`, { headers: jsonHeaders(token) })).json();
export const markNotificationRead = async (token, id) => (await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: jsonHeaders(token) })).json();
export const markAllNotificationsRead = async (token) => (await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: jsonHeaders(token) })).json();
export const fetchSettings = async (token) => (await fetch(`${API_BASE}/settings`, { headers: jsonHeaders(token) })).json();
export const saveSettings = async (token, payload) => (await fetch(`${API_BASE}/settings`, { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(payload) })).json();

export const verifyEmail = async (token) => {
  const response = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ token })
  });
  return response.json();
};
