import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Bus APIs
export const busAPI = {
  getAllBuses: () => api.get('/buses'),
  getBusById: (id) => api.get(`/buses/${id}`),
  getDriversList: () => api.get('/buses/drivers/list'),
  getDriverAssignedBus: () => api.get('/buses/driver/assigned'),
  createBus: (busData) => api.post('/buses', busData),
  updateBus: (id, busData) => api.put(`/buses/${id}`, busData),
  deleteBus: (id) => api.delete(`/buses/${id}`),
  checkDemand: (route, date) => api.get('/buses/demand/check', { params: { route, date } }),
};

// Booking APIs
export const bookingAPI = {
  getMyBookings: () => api.get('/bookings/my-bookings'),
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  getAllBookings: () => api.get('/bookings/all'),
};

// Complaint APIs
export const complaintAPI = {
  getMyComplaints: () => api.get('/complaints/my-complaints'),
  createComplaint: (complaintData) => api.post('/complaints', complaintData),
  getAllComplaints: () => api.get('/complaints/all'),
  updateComplaint: (id, data) => api.put(`/complaints/${id}`, data),
};

// Notification APIs
export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications/my-notifications'),
  sendDepartureNotification: (busId) => api.post('/notifications/departure', { busId }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Contact APIs
export const contactAPI = {
  getContacts: () => api.get('/contacts'),
};

export default api;