const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { scheduleNotifications } = require('./utils/notificationService');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://transflow-three.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server (needed for Socket.io to attach to)
const server = http.createServer(app);

// Attach Socket.io to the same server
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://trans-flow.vercel.app'
    ],
    credentials: true
  }
});

// When a client connects, let them join a "room" named after their userId
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register', (userId) => {
    socket.join(userId); // each user has their own private room
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Make io accessible inside route files via req.app.get('io')
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buses', require('./routes/bus'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/complaints', require('./routes/complaint'));
app.use('/api/notifications', require('./routes/notification'));

// Pass io into the cron-based notification service too
scheduleNotifications(io);

// Management committee contacts
app.get('/api/contacts', (req, res) => {
  res.json([
    { role: 'Transport Head', name: 'Dr. Rajesh Kumar', phone: '+91 98765 43210', email: 'transport@iiitvadodara.ac.in' },
    { role: 'Dean Student Affairs', name: 'Dr. Priya Sharma', phone: '+91 98765 43211', email: 'dean.sa@iiitvadodara.ac.in' },
    { role: 'Emergency Contact', name: 'Security Office', phone: '+91 98765 43212', email: 'security@iiitvadodara.ac.in' }
  ]);
});

const PORT = process.env.PORT || 5000;

// IMPORTANT: listen on `server`, not `app`, so both Express and Socket.io work
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});