const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableId: { type: Number, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  orderedItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true },
      name: { type: String, required: true }
    }
  ],
  status: { type: String, default: 'pending' }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
