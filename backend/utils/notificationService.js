const cron = require('node-cron');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Send departure notifications 5 minutes before - ONLY to today's passengers
const scheduleNotifications = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Find buses departing in next 5 minutes
      const buses = await Bus.find({ status: 'active' });
      
      for (const bus of buses) {
        const [busHour, busMinute] = bus.departureTime.split(':').map(Number);
        const departureTime = new Date(now);
        departureTime.setHours(busHour, busMinute, 0, 0);
        
        const timeDiff = (departureTime - now) / 1000 / 60; // in minutes
        
        // Check if departure is between 4 and 5 minutes away
        if (timeDiff > 4 && timeDiff <= 5) {
          // Get TODAY's date range
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Find bookings ONLY for today
          const bookings = await Booking.find({
            bus: bus._id,
            bookingDate: { 
              $gte: today,
              $lt: tomorrow
            },
            status: 'confirmed'
          });
          
          if (bookings.length > 0) {
            const userIds = bookings.map(b => b.student);
            
            // Check if notification was already sent today for this bus
            const existingNotification = await Notification.findOne({
              bus: bus._id,
              type: 'departure',
              createdAt: { $gte: today }
            });
            
            // Only send if not already sent today
            if (!existingNotification) {
              await Notification.create({
                users: userIds,
                bus: bus._id,
                message: `🚌 AUTOMATIC ALERT: Bus ${bus.busNumber} (${bus.route}) will depart in 5 minutes from ${bus.from}. Please be ready!`,
                type: 'departure'
              });
              
              console.log(`Sent automatic departure notification for bus ${bus.busNumber} to ${userIds.length} passengers for today`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in notification service:', error);
    }
  });
  
  console.log('Notification service started - Will notify only today\'s passengers');
};

module.exports = { scheduleNotifications };