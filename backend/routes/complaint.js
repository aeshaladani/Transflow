const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');

// Get user complaints
router.get('/my-complaints', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .populate('bus', 'busNumber route')
      .sort('-createdAt');
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create complaint
router.post('/', protect, async (req, res) => {
  try {
    const complaint = await Complaint.create({
      ...req.body,
      student: req.user._id
    });
    
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all complaints (Admin)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('student', 'name email phone')
      .populate('bus', 'busNumber route')
      .sort('-createdAt');
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update complaint status (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminResponse,
        resolvedAt: status === 'resolved' ? new Date() : undefined
      },
      { new: true }
    );
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;