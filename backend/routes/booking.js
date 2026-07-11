const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const { protect } = require('../middleware/auth');
const redis = require('../utils/redisClient');

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

// Create booking - CONCURRENCY-SAFE + DATE-NORMALIZED
router.post('/', protect, async (req, res) => {
  const { busId, bookingDate } = req.body;

  if (!bookingDate) {
    return res.status(400).json({ message: 'Booking date is required' });
  }

  // Normalize to UTC midnight regardless of how the date string arrives.
  // This guarantees "2026-06-18" always means the SAME exact Date object
  // every time, no matter what timezone the frontend or backend server
  // is running in. This is what prevents two different calendar days
  // from accidentally being treated as the same booking.
  const normalizedDate = new Date(bookingDate);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const session = await mongoose.startSession();

  try {
    let createdBooking;

    await session.withTransaction(async () => {
      const bus = await Bus.findById(busId).session(session);
      
      if (!bus) {
        throw new Error('Bus not found');
      }

      // Duplicate check uses the SAME normalizedDate
      const existingBooking = await Booking.findOne({
        student: req.user._id,
        bus: busId,
        bookingDate: normalizedDate,
        status: 'confirmed'
      }).session(session);

      if (existingBooking) {
        throw new Error('You already have a booking for this bus on this date');
      }

      // Seat availability is calculated PER DATE, not as a stale global
      // counter on the bus document. This is what allows the same bus
      // to be fully booked on one date while completely open on another.
      const bookedSeats = await Booking.find({
        bus: busId,
        bookingDate: normalizedDate,
        status: 'confirmed'
      }).select('seatNumber').session(session);

      if (bookedSeats.length >= bus.totalSeats) {
        throw new Error('No seats available for this date');
      }

      const bookedSeatNumbers = bookedSeats.map(b => b.seatNumber);
      let seatNumber = 1;
      while (bookedSeatNumbers.includes(seatNumber)) {
        seatNumber++;
      }

      const booking = new Booking({
        student: req.user._id,
        bus: busId,
        bookingDate: normalizedDate,
        seatNumber
      });
      await booking.save({ session });

      createdBooking = booking;
    });
    // If we reach here, the transaction committed successfully
    await redis.del('buses:active'); // seat count changed, invalidate cache
    res.status(201).json(createdBooking);
   
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

// Cancel booking
router.delete('/:id', protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.student.toString() !== req.user._id.toString()) {
        throw new Error('Not authorized');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking already cancelled');
      }

      booking.status = 'cancelled';
      await booking.save({ session });

      result = { message: 'Booking cancelled successfully' };
    });

    await redis.del('buses:active'); // seat count changed, invalidate cache
    res.json(result);

  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    await session.endSession();
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