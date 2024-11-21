const Booking = require('../models/booking');


// Create a booking
const createBooking = async (req, res) => {
  const { name, members, tableId, area } = req.body;

  if (!name || !members || !tableId || !area) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const booking = new Booking({ name, members, tableId, area });
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add orders to an existing booking
const addOrdersToBooking = async (req, res) => {
  const { tableId, orders } = req.body;

  if (!orders || orders.length === 0) {
    return res.status(400).json({ error: 'Orders are required' });
  }

  try {
    const booking = await Booking.findOne({ tableId });

    if (booking) {
      orders.forEach(order => {
        booking.orderedItems.push(order);
      });
      await booking.save();
      res.status(200).json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found for this table' });
    }
  } catch (error) {
    console.error("Error updating booking with order:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const unoccupyTable = async (req, res) => {
  const { tableId } = req.params;
  console.log('Received request to unoccupy table with ID:', tableId);  // Extract tableId from the route parameters

  try {
    // Find the booking by the provided tableId
    const booking = await Booking.findOne({ tableId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found for this table' });
    }

    // Optionally, you could also change the status of the booking here
    // For example, marking it as unoccupied or removing any additional flags
    await Booking.deleteOne({ tableId });
    res.status(200).json({ message: 'Table marked as unoccupied' });
  } catch (error) {
    console.error('Error marking table as unoccupied:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Complete the booking (remove it or mark as completed)
const completeBooking = async (req, res) => {
  const { tableId } = req.body;

  if (!tableId) {
    return res.status(400).json({ error: 'Table ID is required' });
  }

  try {
    const booking = await Booking.findOne({ tableId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found for this table' });
    }

    // Remove the booking (mark as completed)
    await Booking.deleteOne({ tableId });

    res.status(200).json({ message: 'Table marked as completed and booking removed' });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  addOrdersToBooking,
  unoccupyTable,
  completeBooking,  
};
