// Run this from your backend folder: node test-concurrency.js
// This simulates two students trying to book the LAST seat at the exact same time

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Replace with two REAL student tokens (login as 2 different students first to get these)
const STUDENT_1_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMzNjMGJmODA1Y2M4NTQ1OTdhMjA1MCIsImlhdCI6MTc4MTc3NjU3NSwiZXhwIjoxNzg0MzY4NTc1fQ.2Am2JeAcJK0a5oue2w8awiFSFwWpP6yYOQbzwdpW6KI';
const STUDENT_2_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMzNjMDk3ODA1Y2M4NTQ1OTdhMjAzYSIsImlhdCI6MTc4MTc3NjcxNywiZXhwIjoxNzg0MzY4NzE3fQ.6n2bHyN-m-F2Tk4ZaTYleMj4BA69lAQ-OkpGNLbMezk';

// Replace with a bus ID that has only 1 seat available (set totalSeats=1 temporarily to test easily)
const BUS_ID = '6a33c070805cc854597a202d';
const BOOKING_DATE = '2026-06-22'; // pick a valid operating day for that bus

async function attemptBooking(token, label) {
  try {
    const response = await axios.post(
      `${API_URL}/bookings`,
      { busId: BUS_ID, bookingDate: BOOKING_DATE },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ ${label} SUCCEEDED - Seat #${response.data.seatNumber}`);
  } catch (error) {
    console.log(`❌ ${label} FAILED - ${error.response?.data?.message || error.message}`);
  }
}

async function runTest() {
  console.log('🧪 Firing 2 simultaneous booking requests for the SAME last seat...\n');

  // Promise.all fires both requests at virtually the same instant
  await Promise.all([
    attemptBooking(STUDENT_1_TOKEN, 'Student 1'),
    attemptBooking(STUDENT_2_TOKEN, 'Student 2')
  ]);

  console.log('\n📋 Expected result: ONE should succeed, ONE should fail with "No seats available"');
  console.log('❌ If BOTH succeed, the transaction is not working correctly');
}

runTest();