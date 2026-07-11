const cron = require('node-cron');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const scheduleNotifications = (io) => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const buses = await Bus.find({ status: 'active' });

      for (const bus of buses) {
        const [busHour, busMinute] = bus.departureTime.split(':').map(Number);
        const departureTime = new Date(now);
        departureTime.setHours(busHour, busMinute, 0, 0);

        const timeDiff = (departureTime - now) / 1000 / 60;

        if (timeDiff > 4 && timeDiff <= 5) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const bookings = await Booking.find({
            bus: bus._id,
            bookingDate: { $gte: today, $lt: tomorrow },
            status: 'confirmed'
          });

          if (bookings.length > 0) {
            const userIds = bookings.map(b => b.student);

            const existingNotification = await Notification.findOne({
              bus: bus._id,
              type: 'departure',
              createdAt: { $gte: today }
            });

            if (!existingNotification) {
              const notification = await Notification.create({
                users: userIds,
                bus: bus._id,
                message: `🚌 AUTOMATIC ALERT: Bus ${bus.busNumber} (${bus.route}) will depart in 5 minutes from ${bus.from}. Please be ready!`,
                type: 'departure'
              });

              // NEW: push this instantly to every connected passenger
              if (io) {
                userIds.forEach(userId => {
                  io.to(userId.toString()).emit('newNotification', notification);
                });
              }

              console.log(`Sent automatic departure notification for bus ${bus.busNumber} to ${userIds.length} passengers`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in notification service:', error);
    }
  });

  console.log('Notification service started with Socket.io support');
};

module.exports = { scheduleNotifications };