const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['departure', 'cancellation', 'delay', 'general'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);