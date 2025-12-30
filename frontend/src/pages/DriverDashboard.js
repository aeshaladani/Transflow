import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { busAPI, bookingAPI, notificationAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Bus, Users, MapPin, Clock, Bell, LogOut, Calendar, Send } from 'lucide-react';

const DriverDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [assignedBus, setAssignedBus] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [stats, setStats] = useState({
    totalPassengers: 0,
    todayTrips: 0
  });
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      // Get driver's assigned bus
      const busRes = await busAPI.getDriverAssignedBus();
      const myBus = busRes.data;
      
      if (myBus) {
        setAssignedBus(myBus);
        
        // Get today's bookings for this bus
        const bookingsRes = await bookingAPI.getAllBookings();
        const today = new Date().toDateString();
        const myBusBookings = bookingsRes.data.filter(booking => 
          booking.bus?._id === myBus._id && 
          new Date(booking.bookingDate).toDateString() === today &&
          booking.status === 'confirmed'
        );
        
        setTodayBookings(myBusBookings);
        setStats({
          totalPassengers: myBusBookings.length,
          todayTrips: myBus.daysOfOperation?.length || 0
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setAssignedBus(null);
      } else {
        toast.error('Failed to fetch driver data');
      }
    }
  };

  // Find this section in the DriverDashboard component and update it:

  const sendDepartureNotification = async () => {
    if (!assignedBus) return;
    
    if (todayBookings.length === 0) {
      toast.info('No passengers booked for today');
      return;
    }

    setSendingNotification(true);
    try {
      const response = await notificationAPI.sendDepartureNotification(assignedBus._id);
      toast.success(`✅ Notification sent to ${response.data.recipientCount} passenger(s) booked for TODAY!`, {
        autoClose: 5000
      });
      
      // Optional: Show detailed info
      console.log('Notification Details:', response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No passengers booked for today');
      } else {
        toast.error('Failed to send notification');
      }
    } finally {
      setSendingNotification(false);
    }
  };

  if (!assignedBus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-green-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bus className="w-6 h-6" />
              <span className="font-bold text-lg">Driver Portal</span>
              <span className="text-sm opacity-75 ml-4">Welcome, {user?.name}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-2 hover:bg-green-700 px-4 py-2 rounded">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <Bus className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-3">No Bus Assigned Yet</h2>
            <p className="text-gray-600 text-lg mb-4">
              You haven't been assigned to any bus yet. Please contact the admin to get a bus assignment.
            </p>
            <div className="bg-white p-4 rounded-lg inline-block">
              <p className="text-sm text-gray-600 font-semibold mb-2">Contact Admin:</p>
              <p className="text-gray-700">Email: admin@iiitvadodara.ac.in</p>
              <p className="text-gray-700">Phone: +91 98765 43210</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6" />
            <span className="font-bold text-lg">Driver Portal</span>
            <span className="text-sm opacity-75 ml-4">Welcome, {user?.name}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 hover:bg-green-700 px-4 py-2 rounded transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Bus className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-bold text-lg">My Bus</h3>
            <p className="text-3xl font-bold text-green-600">#{assignedBus.busNumber}</p>
            <p className="text-gray-600 text-sm mt-1">{assignedBus.route}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-bold text-lg">Today's Passengers</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPassengers}</p>
            <p className="text-gray-600 text-sm mt-1">Confirmed bookings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Clock className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="font-bold text-lg">Departure Time</h3>
            <p className="text-3xl font-bold text-indigo-600">{assignedBus.departureTime}</p>
            <p className="text-gray-600 text-sm mt-1">{assignedBus.from} → {assignedBus.to}</p>
          </div>
        </div>

       {/* Send Notification Card - PROMINENT */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl shadow-2xl p-8 mb-6 animate-pulse-slow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-10 h-10" />
                <h2 className="text-3xl font-bold">Send Departure Alert</h2>
              </div>
              <p className="text-orange-50 text-lg mb-2">
                📅 Notify all {todayBookings.length} passenger{todayBookings.length !== 1 ? 's' : ''} booked for <strong>TODAY</strong>
              </p>
              <p className="text-orange-100 text-sm mb-1">
                ⚠️ Press this button 5 minutes before departure
              </p>
              <p className="text-orange-100 text-xs">
                ℹ️ Only passengers with bookings for {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })} will receive this notification
              </p>
            </div>
            <button
              onClick={sendDepartureNotification}
              disabled={sendingNotification || todayBookings.length === 0}
              className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition flex items-center gap-3 shadow-xl disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
            >
              <Send className="w-6 h-6" />
              {sendingNotification ? 'Sending...' : 'Send Notification Now'}
            </button>
          </div>
          {todayBookings.length === 0 && (
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <p className="text-sm">❌ No passengers booked for today - Notification disabled</p>
            </div>
          )}
        </div>

        {/* Bus Details Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Bus Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Route Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>From: {assignedBus.from}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>To: {assignedBus.to}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Departure: {assignedBus.departureTime}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Capacity</h3>
              <div className="space-y-2">
                <p className="text-gray-600">Total Seats: {assignedBus.totalSeats}</p>
                <p className="text-gray-600">Available: {assignedBus.availableSeats}</p>
                <p className="text-gray-600">Occupied: {assignedBus.totalSeats - assignedBus.availableSeats}</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all" 
                    style={{width: `${((assignedBus.totalSeats - assignedBus.availableSeats) / assignedBus.totalSeats) * 100}%`}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Passengers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Today's Passenger List
          </h2>
          
          {todayBookings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No passengers booked for today</p>
              <p className="text-gray-500 text-sm mt-2">Check back later or contact admin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking, index) => (
                <div key={booking._id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 text-green-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {booking.seatNumber}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{booking.student?.name}</p>
                        <p className="text-sm text-gray-600">{booking.student?.email}</p>
                        <p className="text-sm text-gray-600">
                          Enrollment: {booking.student?.enrollmentNo} | Phone: {booking.student?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                        ✓ Confirmed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-3">Operating Days</h3>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <span 
                  key={day}
                  className={`px-3 py-1 rounded text-sm ${
                    assignedBus.daysOfOperation?.includes(day) 
                      ? 'bg-green-100 text-green-800 font-medium' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-3">Bus Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  assignedBus.status === 'active' ? 'bg-green-100 text-green-800' :
                  assignedBus.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {assignedBus.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;