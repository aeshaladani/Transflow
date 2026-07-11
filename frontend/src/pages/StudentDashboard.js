import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { busAPI, bookingAPI, complaintAPI, notificationAPI, contactAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Bus, Calendar, Users, Bell, MessageSquare, Phone, 
  Clock, LogOut, MapPin, X, Mail 
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [buses, setBuses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('buses');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [seatInfo, setSeatInfo] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [complaintForm, setComplaintForm] = useState({
    busId: '',
    subject: '',
    description: '',
    category: 'other'
  });

  
  useEffect(() => {
  const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');

  socket.on('connect', () => {
    socket.emit('register', user._id);
  });

  socket.on('newNotification', (notification) => {
    setNotifications(prev => [notification, ...prev]);
    toast.info(notification.message, { autoClose: 8000 });
  });

  return () => {
    socket.disconnect();
  };
}, [user._id]);

  useEffect(() => {
      fetchData();
    }, []);
    useEffect(() => {
    if (selectedBus && bookingDate) {
      busAPI.checkSeatsForDate(selectedBus._id, bookingDate)
        .then(res => setSeatInfo(res.data))
        .catch(() => setSeatInfo(null));
    } else {
      setSeatInfo(null);
    }
  }, [selectedBus, bookingDate]); 

  const fetchData = async () => {
    try {
      const [busesRes, bookingsRes, notificationsRes, complaintsRes, contactsRes] = await Promise.all([
        busAPI.getAllBuses(),
        bookingAPI.getMyBookings(),
        notificationAPI.getMyNotifications(),
        complaintAPI.getMyComplaints(),
        contactAPI.getContacts()
      ]);

      setBuses(busesRes.data);
      setBookings(bookingsRes.data);
      setNotifications(notificationsRes.data);
      setComplaints(complaintsRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  // Get next 30 days that match bus operating days
  const getAvailableDatesForBus = (bus) => {
    if (!bus.daysOfOperation || bus.daysOfOperation.length === 0) {
      return [];
    }

    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to local midnight

    for (let i = 0; i < 60; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (bus.daysOfOperation.includes(dayName)) {
        // Build YYYY-MM-DD manually from LOCAL components - avoids UTC shift bugs
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
    }

    return dates;
  };

  const handleBookSeat = async () => {
    if (!bookingDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      await bookingAPI.createBooking({
        busId: selectedBus._id,
        bookingDate
      });
      toast.success('Seat booked successfully!');
      setShowBookingModal(false);
      setBookingDate('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancelBooking(bookingId);
        toast.success('Booking cancelled successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.createComplaint(complaintForm);
      toast.success('Complaint submitted successfully');
      setShowComplaintModal(false);
      setComplaintForm({ busId: '', subject: '', description: '', category: 'other' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit complaint');
    }
  };

  const openBookingModal = (bus) => {
    setSelectedBus(bus);
    const dates = getAvailableDatesForBus(bus);
    setAvailableDates(dates);
    setBookingDate('');
    setShowBookingModal(true);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6" />
            <span className="font-bold text-lg">Student Portal</span>
            <span className="text-sm opacity-75 ml-4">Welcome, {user?.name}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 hover:bg-indigo-700 px-4 py-2 rounded transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Bell className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="font-bold text-lg">Notifications</h3>
            <p className="text-3xl font-bold text-indigo-600">{notifications.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Calendar className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-bold text-lg">My Bookings</h3>
            <p className="text-3xl font-bold text-green-600">{bookings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Bus className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-bold text-lg">Available Buses</h3>
            <p className="text-3xl font-bold text-blue-600">{buses.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <MessageSquare className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-bold text-lg">Complaints</h3>
            <p className="text-3xl font-bold text-orange-600">{complaints.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('buses')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'buses' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Available Buses
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'bookings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'notifications' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'complaints' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Complaints
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'contacts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
            >
              Contacts
            </button>
          </div>

          <div className="p-6">
            {/* Buses Tab */}
            {activeTab === 'buses' && (
              <div className="space-y-4">
                {buses.map(bus => (
                  <div key={bus._id} className="border rounded-lg p-4 hover:border-indigo-600 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{bus.route}</h3>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {bus.from} → {bus.to}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {bus.departureTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bus className="w-4 h-4" />
                            Bus #{bus.busNumber}
                          </span>
                          <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Capacity: {bus.totalSeats} seats
              </span>
            </div>
            
            {/* Operating Days */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Operating Days:</p>
              <div className="flex flex-wrap gap-1">
                {bus.daysOfOperation && bus.daysOfOperation.length > 0 ? (
                  bus.daysOfOperation.map(day => (
                    <span key={day} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                      {day}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-red-600">No operating days set</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => openBookingModal(bus)}
            disabled={!bus.daysOfOperation || bus.daysOfOperation.length === 0}
            className="ml-4 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {(!bus.daysOfOperation || bus.daysOfOperation.length === 0) ? 'Not Available' : 'Book Seat'}
          </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No bookings yet</p>
                ) : (
                  bookings.map(booking => (
                    <div key={booking._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{booking.bus?.route}</h3>
                          <p className="text-gray-600">Bus #{booking.bus?.busNumber}</p>
                          <p className="text-sm text-gray-600 mt-2">
                            Date: {new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600">Seat: {booking.seatNumber}</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded text-sm ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No notifications</p>
                ) : (
                  notifications.map(notification => (
                    <div key={notification._id} className="border-l-4 border-indigo-600 pl-4 py-3 bg-indigo-50">
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="mb-4 bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
                >
                  File New Complaint
                </button>
                <div className="space-y-4">
                  {complaints.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No complaints filed</p>
                  ) : (
                    complaints.map(complaint => (
                      <div key={complaint._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold">{complaint.subject}</h3>
                          <span className={`px-3 py-1 rounded text-sm ${
                            complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{complaint.description}</p>
                        <p className="text-xs text-gray-500">
                          Category: {complaint.category} | {new Date(complaint.createdAt).toLocaleDateString()}
                        </p>
                        {complaint.adminResponse && (
                          <div className="mt-3 p-3 bg-green-50 rounded">
                            <p className="text-sm font-medium text-green-800">Admin Response:</p>
                            <p className="text-sm text-gray-700">{complaint.adminResponse}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="grid md:grid-cols-2 gap-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition">
                    <h3 className="font-bold text-lg mb-2">{contact.role}</h3>
                    <p className="text-gray-700">{contact.name}</p>
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </p>
                      <p className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal - UPDATED */}
      {showBookingModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Book Seat</h2>
              <button onClick={() => setShowBookingModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <p className="font-bold text-lg">{selectedBus.route}</p>
              <p className="text-gray-600">Bus #{selectedBus.busNumber}</p>
              <p className="text-gray-600">Departure: {selectedBus.departureTime}</p>
              <p className="text-gray-600">From: {selectedBus.from} → To: {selectedBus.to}</p>
            </div>

            {/* Operating Days Info */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-2">🚌 Bus Operates On:</p>
              <div className="flex flex-wrap gap-2">
                {selectedBus.daysOfOperation.map(day => (
                  <span key={day} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date (Only available on operating days)
              </label>
              <select
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">-- Select a date --</option>
                {availableDates.length === 0 ? (
                  <option disabled>No available dates</option>
                ) : (
                  availableDates.map(dateStr => {
                    const date = new Date(dateStr + 'T00:00:00');
                    return (
                      <option key={dateStr} value={dateStr}>
                        {date.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </option>
                    );
                  })
                )}
              </select>
                {availableDates.length === 0 && (
            <p className="text-xs text-red-600 mt-1">
              No dates available. Bus operating days may not be set.
            </p>
          )}
        </div>

        {seatInfo && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-800">
              🪑 {seatInfo.availableSeats} / {seatInfo.totalSeats} seats available on this date
            </p>
          </div>
        )}

        <button
          onClick={handleBookSeat}
          disabled={!bookingDate || !seatInfo || seatInfo.availableSeats <= 0}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {seatInfo && seatInfo.availableSeats <= 0 ? 'Full for this date' : 'Confirm Booking'}
        </button>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">File Complaint</h2>
              <button onClick={() => setShowComplaintModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus (Optional)
                </label>
                <select
                  value={complaintForm.busId}
                  onChange={(e) => setComplaintForm({...complaintForm, busId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a bus</option>
                  {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      Bus #{bus.busNumber} - {bus.route}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({...complaintForm, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="cleanliness">Cleanliness</option>
                  <option value="driver_behavior">Driver Behavior</option>
                  <option value="timing">Timing Issues</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
              >
                Submit Complaint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;