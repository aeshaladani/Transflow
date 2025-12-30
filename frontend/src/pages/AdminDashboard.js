import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { busAPI, bookingAPI, complaintAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Bus, Users, Calendar, MessageSquare, Plus, Edit2, 
  Trash2, LogOut, X, CheckCircle, AlertTriangle 
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [buses, setBuses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBusModal, setShowBusModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [busForm, setBusForm] = useState({
  busNumber: '',
  route: '',
  from: '',
  to: '',
  departureTime: '',
  totalSeats: 40,
  daysOfOperation: [],
  driver: '' // Add this
});
  const [complaintResponse, setComplaintResponse] = useState({
    status: 'in_progress',
    adminResponse: ''
  });
  const [editingBus, setEditingBus] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
  try {
    const [busesRes, bookingsRes, complaintsRes, driversRes] = await Promise.all([
      busAPI.getAllBuses(),
      bookingAPI.getAllBookings(),
      complaintAPI.getAllComplaints(),
      busAPI.getDriversList()
    ]);

    setBuses(busesRes.data);
    setBookings(bookingsRes.data);
    setComplaints(complaintsRes.data);
    setDrivers(driversRes.data);
  } catch (error) {
    toast.error('Failed to fetch data');
  }
};

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBus) {
        await busAPI.updateBus(editingBus._id, busForm);
        toast.success('Bus updated successfully');
      } else {
        await busAPI.createBus(busForm);
        toast.success('Bus added successfully');
      }
      setShowBusModal(false);
      setBusForm({
        busNumber: '',
        route: '',
        from: '',
        to: '',
        departureTime: '',
        totalSeats: 40,
        daysOfOperation: []
      });
      setEditingBus(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteBus = async (busId) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await busAPI.deleteBus(busId);
        toast.success('Bus deleted successfully');
        fetchAllData();
      } catch (error) {
        toast.error('Failed to delete bus');
      }
    }
  };

  const handleEditBus = (bus) => {
  setEditingBus(bus);
  setBusForm({
    busNumber: bus.busNumber,
    route: bus.route,
    from: bus.from,
    to: bus.to,
    departureTime: bus.departureTime,
    totalSeats: bus.totalSeats,
    daysOfOperation: bus.daysOfOperation || [],
    driver: bus.driver?._id || '' // Add this
  });
  setShowBusModal(true);
};
  const handleComplaintUpdate = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.updateComplaint(selectedComplaint._id, complaintResponse);
      toast.success('Complaint updated successfully');
      setShowComplaintModal(false);
      setSelectedComplaint(null);
      setComplaintResponse({ status: 'in_progress', adminResponse: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update complaint');
    }
  };

  const toggleDay = (day) => {
    setBusForm(prev => ({
      ...prev,
      daysOfOperation: prev.daysOfOperation.includes(day)
        ? prev.daysOfOperation.filter(d => d !== day)
        : [...prev.daysOfOperation, day]
    }));
  };

  const stats = {
    totalBuses: buses.length,
    totalStudents: [...new Set(bookings.map(b => b.student?._id))].length,
    todayBookings: bookings.filter(b => 
      new Date(b.bookingDate).toDateString() === new Date().toDateString() && 
      b.status === 'confirmed'
    ).length,
    pendingComplaints: complaints.filter(c => c.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span className="font-bold text-lg">Admin Portal</span>
            <span className="text-sm opacity-75 ml-4">Welcome, {user?.name}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 hover:bg-purple-700 px-4 py-2 rounded transition"
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
            <Bus className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-center">{stats.totalBuses}</p>
            <p className="text-gray-600 text-center">Total Buses</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Users className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-center">{stats.totalStudents}</p>
            <p className="text-gray-600 text-center">Students</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <Calendar className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-center">{stats.todayBookings}</p>
            <p className="text-gray-600 text-center">Today's Bookings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <MessageSquare className="w-10 h-10 text-orange-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-center">{stats.pendingComplaints}</p>
            <p className="text-gray-600 text-center">Pending Complaints</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('buses')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'buses' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Manage Buses
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'bookings' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              All Bookings
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'complaints' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Complaints
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
                  <p className="text-purple-100">
                    Manage buses, bookings, and handle student complaints efficiently
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowBusModal(true)}
                        className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Bus
                      </button>
                      <button
                        onClick={() => setActiveTab('complaints')}
                        className="w-full bg-orange-600 text-white py-3 rounded hover:bg-orange-700"
                      >
                        Handle Complaints
                      </button>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
                      >
                        View All Bookings
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map(booking => (
                        <div key={booking._id} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                          <p className="font-medium">{booking.student?.name}</p>
                          <p className="text-gray-600">Booked {booking.bus?.route}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buses Tab */}
            {activeTab === 'buses' && (
              <div>
                <button
                  onClick={() => {
                    setEditingBus(null);
                    setBusForm({
                      busNumber: '',
                      route: '',
                      from: '',
                      to: '',
                      departureTime: '',
                      totalSeats: 40,
                      daysOfOperation: [],
                      driver: ''
                    });
                    setShowBusModal(true);
                  }}
                  className="mb-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add New Bus
                </button>

                <div className="space-y-4">
                  {buses.map(bus => (
                    <div key={bus._id} className="border rounded-lg p-4 hover:shadow-lg transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">Bus #{bus.busNumber}</h3>
                          <p className="text-gray-600">{bus.route}</p>
                          <div className="grid md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                            <span>From: {bus.from}</span>
                            <span>To: {bus.to}</span>
                            <span>Time: {bus.departureTime}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              Seats: {bus.availableSeats}/{bus.totalSeats} available
                            </span>
                            {bus.driver ? (
                              <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
                                👤 Driver: {bus.driverName}
                              </span>
                            ) : (
                              <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
                                ⚠️ No Driver Assigned
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBus(bus)}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBus(bus._id)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">All Bookings</h2>
                {bookings.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No bookings found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Student</th>
                          <th className="px-4 py-2 text-left">Bus</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Seat</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(booking => (
                          <tr key={booking._id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <p className="font-medium">{booking.student?.name}</p>
                              <p className="text-sm text-gray-600">{booking.student?.email}</p>
                            </td>
                            <td className="px-4 py-2">
                              <p className="font-medium">#{booking.bus?.busNumber}</p>
                              <p className="text-sm text-gray-600">{booking.bus?.route}</p>
                            </td>
                            <td className="px-4 py-2">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2">{booking.seatNumber}</td>
                            <td className="px-4 py-2">
                              <span className={`px-3 py-1 rounded text-sm ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Complaints Management</h2>
                {complaints.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No complaints found</p>
                ) : (
                  complaints.map(complaint => (
                    <div key={complaint._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{complaint.subject}</h3>
                          <p className="text-sm text-gray-600">
                            By: {complaint.student?.name} ({complaint.student?.email})
                          </p>
                          <p className="text-sm text-gray-600">
                            Category: {complaint.category} | {new Date(complaint.createdAt).toLocaleDateString()}
                            </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{complaint.description}</p>
                  {complaint.bus && (
                    <p className="text-sm text-gray-600 mb-3">
                      Bus: #{complaint.bus.busNumber} - {complaint.bus.route}
                    </p>
                  )}
                  {complaint.adminResponse && (
                    <div className="bg-green-50 p-3 rounded mb-3">
                      <p className="text-sm font-medium text-green-800">Admin Response:</p>
                      <p className="text-sm text-gray-700">{complaint.adminResponse}</p>
                    </div>
                  )}
                  {complaint.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setComplaintResponse({
                          status: complaint.status,
                          adminResponse: complaint.adminResponse || ''
                        });
                        setShowComplaintModal(true);
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  </div>

{/* Bus Modal */}
      {showBusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h2>
              <button onClick={() => {
                setShowBusModal(false);
                setEditingBus(null);
              }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleBusSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Number
                  </label>
                  <input
                    type="text"
                    value={busForm.busNumber}
                    onChange={(e) => setBusForm({...busForm, busNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={busForm.route}
                    onChange={(e) => setBusForm({...busForm, route: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Hostel to Institute"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <input
                    type="text"
                    value={busForm.from}
                    onChange={(e) => setBusForm({...busForm, from: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <input
                    type="text"
                    value={busForm.to}
                    onChange={(e) => setBusForm({...busForm, to: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={busForm.departureTime}
                    onChange={(e) => setBusForm({...busForm, departureTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    value={busForm.totalSeats}
                    onChange={(e) => setBusForm({...busForm, totalSeats: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Driver Assignment - NEW */}
              <div>
                <label className="block text-sm font-medium text -gray-700 mb-2">
Assign Driver (Optional)
</label>
<select
value={busForm.driver}
onChange={(e) => setBusForm({...busForm, driver: e.target.value})}
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
>
<option value="">-- No Driver Assigned --</option>
{drivers.map(driver => (
<option key={driver._id} value={driver._id}>
{driver.name} - {driver.phone} (License: {driver.licenseNo})
</option>
))}
</select>
<p className="text-xs text-gray-500 mt-1">
Select a driver to assign them to this bus
</p>
</div>

<div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days of Operation
            </label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded transition ${
                    busForm.daysOfOperation.includes(day)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
          >
            {editingBus ? 'Update Bus' : 'Add Bus'}
          </button>
        </form>
      </div>
    </div>
  )}

  {/* Complaint Response Modal */}
  {showComplaintModal && selectedComplaint && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Update Complaint</h2>
          <button onClick={() => setShowComplaintModal(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleComplaintUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={complaintResponse.status}
              onChange={(e) => setComplaintResponse({...complaintResponse, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Response
            </label>
            <textarea
              value={complaintResponse.adminResponse}
              onChange={(e) => setComplaintResponse({...complaintResponse, adminResponse: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="4"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700"
          >
            Update Complaint
          </button>
        </form>
      </div>
    </div>
  )}
</div>
);
};
export default AdminDashboard;