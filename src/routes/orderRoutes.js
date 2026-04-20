const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Search customers (proxied from Calio)
router.get('/customers', orderController.searchCustomers);

// Search products (proxied from Calio)
router.get('/products', orderController.searchProducts);

// Get order statuses (proxied from Calio)
router.get('/statuses', orderController.getOrderStatuses);

// List orders from own DB
router.get('/', orderController.listOrders);

// Get single order (local DB only)
router.get('/:orderId', orderController.getOrder);

// Get order detail (from Calio, synced to DB)
router.get('/:orderId/detail', orderController.getOrderDetail);

// Create order (Calio + own DB)
router.post('/', orderController.createOrder);

// Update order (Calio + own DB)
router.put('/:orderId', orderController.updateOrder);

// Delete order (Calio + own DB)
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;