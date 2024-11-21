const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bookingsRoutes = require('./routes/bookingsRoutes');

// Import routes for orders (if you have a separate routes file)
const ordersRoutes = require('./routes/ordersRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use('/api/bookings', bookingsRoutes);

app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.originalUrl}`);
  next();
});// This will parse incoming requests with JSON payloads

// ** MongoDB Connection ** 
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// ** Models **

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
});

const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  orderedItems: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: { type: Number, required: true },
  }],
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: { type: Number, required: true },
  tableId: { type: Number, required: true },
  area: { type: String, required: true },
  orderedItems: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: { type: Number, required: true },
  }],
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// ** Routes **

// Use external routes for orders if needed
app.use('/api', ordersRoutes);

// API endpoint to fetch all menu items
app.get('/api/menuitems', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to add a new menu item
app.post('/api/menuitems', async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const menuItem = new MenuItem({ name, price, description });
  await menuItem.save();
  res.status(201).json(menuItem);
});

// API endpoint to update a menu item
app.put('/api/menuitems/:id', async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price, description },
      { new: true }
    );

    if (!updatedMenuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.status(200).json(updatedMenuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to delete a menu item
app.delete('/api/menuitems/:id', async (req, res) => {
  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!deletedMenuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to create a booking
app.post('/api/book-table', async (req, res) => {
  const { name, members, tableId, area } = req.body;

  if (!name || !members || !tableId || !area) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const booking = new Booking({ name, members, tableId, area });
  await booking.save();
  res.status(201).json(booking);
});

// API endpoint to fetch all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to create an order
app.post('/api/orders', async (req, res) => {
  const { orderedItems } = req.body;

  if (!orderedItems) {
    return res.status(400).json({ error: 'Ordered items are required' });
  }

  try {
    const order = new Order({ orderedItems });
    await order.save();
    res.status(201).json({ orderId: order._id, orderedItems });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to fetch all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('orderedItems.itemId');
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check if an ObjectId is valid
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// API endpoint to update a booking with an order
app.post('/api/bookings/orders', async (req, res) => {
  const { tableId, orders } = req.body;

  if (!orders || orders.length === 0) {
    return res.status(400).json({ error: 'Orders are required' });
  }

  for (let order of orders) {
    if (!isValidObjectId(order.itemId)) {
      return res.status(400).json({ error: `Invalid itemId: ${order.itemId}` });
    }
  }

  // Proceed to save if all itemId values are valid
  try {
    const booking = await Booking.findOne({ tableId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Push orders to existing booking
    booking.orderedItems.push(...orders);
    console.log("Inserted order:", booking);
    await booking.save();
    res.status(200).json({ message: 'Order successfully added' });
  } catch (error) {
    console.error('Error updating booking with order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Existing code (unchanged) for express, mongoose, and other routes...

// ** Additional Route for Marking Table as Completed **
// API endpoint to mark a table as completed by deleting the booking entry
// API endpoint to unoccupy a table (this is assuming you want to mark a table as unoccupied)
// Define the route to mark the table as unoccupied
app.post('/api/bookings/:tableId/unoccupy', async (req, res) => {
  const { tableId } = req.params;

  if (!tableId) {
    return res.status(400).json({ error: 'Table ID is required' });
  }

  try {
    const booking = await Booking.findOne({ tableId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Mark the table as unoccupied (you could update the booking or delete it)
    await Booking.updateOne({ tableId }, { $set: { status: 'unoccupied' } });

    res.status(200).json({ message: 'Table marked as unoccupied' });
  } catch (error) {
    console.error('Error marking table as unoccupied:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
