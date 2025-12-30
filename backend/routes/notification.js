const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// Get user notifications
router.get('/my-notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      users: req.user._id 
    })
    .populate('bus', 'busNumber route')
    .sort('-createdAt')
    .limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send departure notification - UPDATED to only send to today's passengers
router.post('/departure', protect, authorize('driver', 'admin'), async (req, res) => {
  try {
    const { busId } = req.body;
    
    if (!busId) {
      return res.status(400).json({ message: 'Bus ID is required' });
    }

    // Get TODAY's date (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find bookings ONLY for today for this specific bus
    const bookings = await Booking.find({
      bus: busId,
      bookingDate: { 
        $gte: today,
        $lt: tomorrow
      },
      status: 'confirmed'
    })
    .populate('bus')
    .populate('student', 'name email phone');
    
    if (bookings.length === 0) {
      return res.status(404).json({ 
        message: 'No passengers booked for today on this bus',
        recipientCount: 0
      });
    }

    const userIds = bookings.map(b => b.student._id);
    const bus = bookings[0].bus;
    
    // Create notification only for today's passengers
    const notification = await Notification.create({
      users: userIds,
      bus: busId,
      message: `🚌 DEPARTURE ALERT: Bus ${bus.busNumber} (${bus.route}) will depart in 5 minutes from ${bus.from}. Please be ready!`,
      type: 'departure'
    });
    
    res.status(201).json({
      message: 'Notification sent successfully',
      recipientCount: userIds.length,
      recipients: bookings.map(b => ({
        name: b.student.name,
        email: b.student.email,
        seatNumber: b.seatNumber
      })),
      date: today.toDateString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;