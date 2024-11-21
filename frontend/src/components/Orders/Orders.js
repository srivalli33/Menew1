import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [completedOrders, setCompletedOrders] = useState(new Set());

  // Fetch bookings and menu items
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/bookings');
        const initialOrders = response.data.map(booking => ({
          tableId: booking.tableId,
          bookingId: booking._id,
          name: booking.name,
          members: booking.members,
          orderedItems: booking.orderedItems || [],
          status: booking.status || 'pending',
        }));
        setOrders(initialOrders);

        // Initialize completed orders set
        const completedOrderIds = new Set(
          initialOrders.filter(order => order.status === 'completed').map(order => order.bookingId)
        );
        setCompletedOrders(completedOrderIds);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    const fetchMenuItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/menuitems');
        setMenuItems(response.data);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };

    fetchBookings();
    fetchMenuItems();
  }, []);

  // Send order to kitchen
  const handleSendToKitchen = (index) => {
    const orderDetails = {
      ...orders[index],
      orderType: 'table',
    };
    navigate('/kitchen', { state: { orderDetails } });
  };

  // Generate bill
  const handleGenerateBill = (order) => {
    if (order.orderedItems.length > 0) {
      const totalAmount = order.orderedItems.reduce((total, orderedItem) => {
        const item = menuItems.find(item => item._id === orderedItem.itemId);
        const itemTotal = item ? item.price * orderedItem.quantity : 0;
        return total + itemTotal;
      }, 0);

      const paymentQRCode = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`Payment for Table ${order.tableId}: $${totalAmount}`)}&size=150x150`;

      const fullOrderedItems = order.orderedItems.map(orderedItem => {
        const menuItem = menuItems.find(item => item._id === orderedItem.itemId);
        return {
          ...orderedItem,
          name: menuItem ? menuItem.name : 'Unknown Item',
          price: menuItem ? menuItem.price : 0,
          total: menuItem ? menuItem.price * orderedItem.quantity : 0
        };
      });

      navigate('/payment', {
        state: {
          orderDetails: {
            bookingId: order.bookingId,
            tableId: order.tableId,
            name: order.name,
            orderedItems: fullOrderedItems,
            totalAmount: totalAmount,
            paymentQRCode: paymentQRCode
          }
        }
      });
    } else {
      alert("Please add at least one menu item to generate the bill.");
    }
  };

  // Add items to order
  const handleAddItems = async (orderId) => {
    const newItems = [
      {
        itemId: 'some_item_id', // Replace with actual item ID
        quantity: 1,
      },
    ];

    try {
      await axios.post(`/api/orders/${orderId}/addItems`, { orderedItems: newItems });

      const response = await axios.get(`/api/orders/${orderId}`);
      setOrders((prevOrders) => 
        prevOrders.map((order) => 
          order.bookingId === orderId ? response.data : order
        )
      );
      alert("Order successfully updated!");
    } catch (error) {
      console.error("Error adding items to the order:", error);
      alert("Error updating the order!");
    }
  };

  // Mark order as completed by deleting the booking
  const handleOrderCompleted = async (orderId, tableId) => {
    try {
      // Ensure that the order ID and table ID are passed correctly
      console.log('Order ID:', orderId, 'Table ID:', tableId);
  
      if (!tableId || typeof tableId !== 'number') {
        console.error('Invalid Table ID format:', tableId);
        alert('Invalid Table ID format.');
        return;
      }
  
      // Make the API call to mark the table as completed
      const response = await axios.post(`http://localhost:5000/api/bookings/complete`, { tableId });
      console.log(`Calling unoccupy API for tableId ${tableId}`);
  
      if (response.status === 200) {
        // Update the frontend state by removing the completed order
        setOrders((prevOrders) => prevOrders.filter(order => order.bookingId !== orderId));
  
        // Update the completed orders set
        setCompletedOrders((prev) => new Set(prev.add(orderId)));
  
        // Make the API call to mark the table as unoccupied
        const unoccupyResponse = await axios.post(`http://localhost:5000/api/bookings/${tableId}/unoccupy`);
  
        if (unoccupyResponse.status === 200) {
          console.log('Table marked as unoccupied successfully');
        } else {
          console.error('Failed to mark table as unoccupied:', unoccupyResponse);
        }
      } else {
        console.error('Failed to mark order as completed:', response);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('There was an issue marking the order as completed. Please try again.');
    }
  };
  
  return (
    <div className="order-container">
      <h2>Your Orders</h2>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={index} className="order-card">
            <h4>Table ID: {order.tableId}</h4>
            <p><strong>Booking ID:</strong> {order.bookingId}</p>
            <p><strong>Booked By:</strong> {order.name}</p>
            <p><strong>Members:</strong> {order.members}</p>

            <div>
              <strong>Ordered Items:</strong>
              {order.orderedItems.length > 0 ? (
                <ul>
                  {order.orderedItems.map((orderedItem, idx) => {
                    const menuItem = menuItems.find(item => item._id === orderedItem.itemId);
                    return (
                      <li key={idx}>
                        {menuItem ? (
                          <>
                            <span>{menuItem.name} (Quantity: {orderedItem.quantity})</span>
                            <span> - ${menuItem.price * orderedItem.quantity}</span>
                          </>
                        ) : 'Unknown Item'}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No items ordered yet.</p>
              )}
            </div>

            <div className="order-actions">
              <Link to='/menu' state={{ tableId: order.tableId }}>
                <button>View Menu</button>
              </Link>
              <button onClick={() => handleSendToKitchen(index)}>Send to Kitchen</button>
              <button onClick={() => handleGenerateBill(order)}>Generate Bill</button>

              {/* Show 'Mark as Completed' button if the order is not completed yet */}
              {order.status !== 'completed' && (
                <button onClick={() => handleOrderCompleted(order.bookingId, order.tableId)}>
                  Mark as Completed
                </button>
              )}

              {/* Show "Payment Done" button only for completed orders */}
              {completedOrders.has(order.bookingId) && (
                <button disabled>Payment Done</button>
              )}

              {/* Add Items button */}
              <button onClick={() => handleAddItems(order.bookingId)}>Add Items</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
