const express = require('express');
const router = express.Router();
const ordersController = require('../Controllers/ordersController');

// Route to create a new order
router.post('/orders/:orderId/complete', async (req, res) => {
    const { orderId } = req.params;
  
    try {
      const order = await Order.findByIdAndUpdate(orderId, { status: 'completed' }, { new: true });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.status(200).json({ message: 'Order completed successfully', order });
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ error: 'Error completing order' });
    }
  });
  
module.exports = router;
