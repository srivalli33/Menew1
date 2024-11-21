const Order = require('../models/Order'); // Ensure the Order model is imported

// Controller to mark an order as completed
const completeOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Find the order by orderId and update its status to 'completed'
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'completed' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order completed successfully', order });
  } catch (error) {
    console.error("Error completing order:", error);
    res.status(500).json({ error: 'Error completing order' });
  }
};

// Controller to add items to the order
const addItemsToOrder = async (req, res) => {
  const { orderId } = req.params;
  const { orderedItems } = req.body;

  try {
    // Validate if orderedItems exists and is not empty
    if (!orderedItems || orderedItems.length === 0) {
      return res.status(400).json({ error: 'No items provided to add' });
    }

    // Find the order by orderId and push the new items into orderedItems
    const order = await Order.findById(orderId); // Find the order by ID

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add the ordered items to the order
    order.orderedItems.push(...orderedItems);

    // Save the updated order
    await order.save();

    res.status(200).json({ message: 'Items added to order successfully', order });
  } catch (error) {
    console.error("Error adding items:", error);
    res.status(500).json({ error: 'Error adding items to order' });
  }
};

module.exports = { completeOrder, addItemsToOrder };
