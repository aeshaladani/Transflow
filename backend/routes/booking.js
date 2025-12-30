const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const { protect } = require('../middleware/auth');

// Get user bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      student: req.user._id,
      status: { $ne: 'cancelled' }
    })
    .populate('bus')
    .sort('-bookingDate');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking
router.post('/', protect, async (req, res) => {
  try {
    const { busId, bookingDate } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.availableSeats <= 0) {
      return res.status(400).json({ message: 'No seats available' });
    }

    // Check if user already has booking
    const existingBooking = await Booking.findOne({
      student: req.user._id,
      bus: busId,
      bookingDate: new Date(bookingDate),
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking for this bus' });
    }

    // Find next available seat
    const bookedSeats = await Booking.find({
      bus: busId,
      bookingDate: new Date(bookingDate),
      status: 'confirmed'
    }).select('seatNumber');

    const bookedSeatNumbers = bookedSeats.map(b => b.seatNumber);
    let seatNumber = 1;
    while (bookedSeatNumbers.includes(seatNumber)) {
      seatNumber++;
    }

    const booking = await Booking.create({
      student: req.user._id,
      bus: busId,
      bookingDate: new Date(bookingDate),
      seatNumber
    });

    // Update available seats
    bus.availableSeats -= 1;
    await bus.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel booking
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Update available seats
    const bus = await Bus.findById(booking.bus);
    bus.availableSeats += 1;
    await bus.save();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all bookings (Admin)
router.get('/all', protect, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('student', 'name email enrollmentNo')
      .populate('bus')
      .sort('-createdAt');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;