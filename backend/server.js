const express = require('express');
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
    'https://trans-flow.vercel.app',
    'https://trans-flow-frontend.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buses', require('./routes/bus'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/complaints', require('./routes/complaint'));
app.use('/api/notifications', require('./routes/notification'));

// Start notification service
scheduleNotifications();

// Management committee contacts
app.get('/api/contacts', (req, res) => {
  res.json([
    { role: 'Transport Head', name: 'Dr. Rajesh Kumar', phone: '+91 98765 43210', email: 'transport@iiitvadodara.ac.in' },
    { role: 'Dean Student Affairs', name: 'Dr. Priya Sharma', phone: '+91 98765 43211', email: 'dean.sa@iiitvadodara.ac.in' },
    { role: 'Emergency Contact', name: 'Security Office', phone: '+91 98765 43212', email: 'security@iiitvadodara.ac.in' }
  ]);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});