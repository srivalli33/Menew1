const express = require('express');
const router = express.Router();
const bookingsController = require('../Controllers/bookingsController');

// Route to create a booking
router.post('/book-table', bookingsController.createBooking);

// Route to get all bookings
router.get('/bookings', bookingsController.getBookings);

// Route to add orders to a booking
router.post('/bookings/orders', bookingsController.addOrdersToBooking);

// ** New Route to unoccupy a table **
router.post('/unoccupy/:tableId', bookingsController.unoccupyTable);

router.post('/complete', bookingsController.completeBooking);

module.exports = router;
