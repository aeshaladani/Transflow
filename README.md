# 🚌 Bus Management System

A comprehensive MERN stack application for managing bus transportation services at the institution level. This system streamlines bus bookings, driver assignments, route management, and real-time notifications.

## ✨ Features

### For Students
- 📅 **Smart Booking System**: Book bus seats only on operating days
- 🔔 **Real-time Notifications**: Receive departure alerts 5 minutes before bus leaves
- 📝 **Complaint Management**: File and track complaints with admin responses
- 📊 **Booking History**: View all past and upcoming bookings
- 📞 **Contact Management Committee**: Quick access to transport team contacts

### For Drivers
- 🚍 **Assigned Bus Dashboard**: View assigned bus details and route information
- 👥 **Passenger List**: See today's passenger list with seat numbers
- 📢 **Send Notifications**: Manually send departure alerts to today's passengers
- 📈 **Daily Statistics**: Track daily passenger count and occupancy

### For Admins
- ➕ **Bus Management**: Add, edit, and delete buses
- 👨‍✈️ **Driver Assignment**: Assign drivers to specific buses
- 📆 **Operating Days Configuration**: Set which days each bus operates
- 📊 **Booking Overview**: View all student bookings across all buses
- 🎫 **Complaint Handling**: Review and respond to student complaints
- 📈 **Demand Analysis**: Auto-suggestion for additional buses when demand exceeds 85%

### Automated Features
- ⏰ **Auto-notifications**: Automatic departure alerts 5 minutes before scheduled time
- 📅 **Date Filtering**: Students can only book on bus operating days
- 🎯 **Targeted Notifications**: Only today's passengers receive departure notifications

## 🛠 Tech Stack

### Frontend
- **React** 18.2.0 - UI framework
- **React Router** 6.20.0 - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt.js** - Password hashing
- **Node-cron** - Scheduled tasks

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **MongoDB** (v4.4 or higher) 
- **npm** or **yarn** - Comes with Node.js
- **Git** -
- 
## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Bus-management-system.git
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev nodemon
```

### 3. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

