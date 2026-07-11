const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const redis = require('../utils/redisClient');

// Get all buses - WITH REDIS CACHING
router.get('/', protect, async (req, res) => {
  try {
    const cacheKey = 'buses:active';

    // 1. Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('✅ CACHE HIT - served from Redis');
      return res.json(cached);
    }
    console.log('❌ CACHE MISS - querying MongoDB');
    // 2. Cache miss - query MongoDB
    const buses = await Bus.find({ status: 'active' }).populate('driver', 'name phone');

    // 3. Store in cache for 30 seconds
    await redis.set(cacheKey, buses, { ex: 30 });

    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all drivers (for admin dropdown)
router.get('/drivers/list', protect, authorize('admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('name phone email licenseNo');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bus by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('driver', 'name phone email');
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Check seat availability for a specific bus on a specific date
router.get('/:id/seats', protect, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const bookedCount = await Booking.countDocuments({
      bus: req.params.id,
      bookingDate: normalizedDate,
      status: 'confirmed'
    });

    res.json({
      totalSeats: bus.totalSeats,
      bookedSeats: bookedCount,
      availableSeats: bus.totalSeats - bookedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get driver's assigned bus
router.get('/driver/assigned', protect, authorize('driver'), async (req, res) => {
  try {
    const bus = await Bus.findOne({ driver: req.user._id }).populate('driver', 'name phone email');
    if (!bus) {
      return res.status(404).json({ message: 'No bus assigned' });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new bus (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const busData = {
      ...req.body,
      availableSeats: req.body.totalSeats
    };

    if (req.body.driver) {
      const driver = await User.findById(req.body.driver);
      if (driver) {
        busData.driverName = driver.name;
        busData.driverPhone = driver.phone;
      }
    }

    const bus = await Bus.create(busData);

    // Invalidate cache so next fetch reflects the new bus
    await redis.del('buses:active');

    res.status(201).json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update bus (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.driver) {
      const driver = await User.findById(req.body.driver);
      if (driver) {
        updateData.driverName = driver.name;
        updateData.driverPhone = driver.phone;
      }
    } else if (req.body.driver === null) {
      updateData.driverName = null;
      updateData.driverPhone = null;
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('driver', 'name phone email');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Invalidate cache so edits show up immediately
    await redis.del('buses:active');

    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Invalidate cache
    await redis.del('buses:active');

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if additional bus needed
router.get('/demand/check', protect, authorize('admin'), async (req, res) => {
  try {
    const { route, date } = req.query;
    
    const buses = await Bus.find({ route, status: 'active' });
    const totalCapacity = buses.reduce((sum, bus) => sum + bus.totalSeats, 0);
    
    const bookings = await Booking.countDocuments({
      bus: { $in: buses.map(b => b._id) },
      bookingDate: new Date(date),
      status: 'confirmed'
    });
    
    const demandPercentage = (bookings / totalCapacity) * 100;
    
    res.json({
      route,
      totalCapacity,
      currentBookings: bookings,
      demandPercentage,
      needsAdditionalBus: demandPercentage > 85
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;