const orderService = require('../services/orderService');

/**
 * Search customers (proxied from Calio, synced to own DB)
 * GET /api/orders/customers?keyword=&status=0&page=1&pageSize=50
 */
const searchCustomers = async (req, res) => {
  try {
    const { keyword = '', status, page = 1, pageSize = 50 } = req.query;
    const data = await orderService.searchCustomers({ keyword, status: status ? Number(status) : 0, page: Number(page), pageSize: Number(pageSize) });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[OrderController] searchCustomers error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm khách hàng', error: error.message });
  }
};

/**
 * Search products (proxied from Calio, synced to own DB)
 * GET /api/orders/products?keyword=&warehouse=...&type=store,service&includeParent=true&status=1&hasChild=2&page=1&pageSize=50
 */
const searchProducts = async (req, res) => {
  try {
    const {
      keyword = '',
      warehouse = '66c5a66fb6d90a09096dd52b',
      type = 'store,service',
      includeParent = 'true',
      status = '1',
      hasChild = '2',
      page = '1',
      pageSize = '50',
    } = req.query;
    const data = await orderService.searchProducts({
      keyword,
      warehouse,
      type,
      includeParent: includeParent === 'true',
      status: Number(status),
      hasChild: Number(hasChild),
      page: Number(page),
      pageSize: Number(pageSize),
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[OrderController] searchProducts error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm sản phẩm', error: error.message });
  }
};

/**
 * Get order statuses (proxied from Calio, synced to own DB)
 * GET /api/orders/statuses?keyword=&active=1&page=1&pageSize=50
 */
const getOrderStatuses = async (req, res) => {
  try {
    const { keyword = '', active = '1', page = '1', pageSize = '50' } = req.query;
    const data = await orderService.getOrderStatuses({ keyword, active: Number(active), page: Number(page), pageSize: Number(pageSize) });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[OrderController] getOrderStatuses error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách trạng thái', error: error.message });
  }
};

/**
 * Create an order (calls Calio API + saves to own DB)
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const result = await orderService.createOrder(orderData);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[OrderController] createOrder error:', error.message);
    const status = error.response?.status || 500;
    const calioMessage = error.response?.data || error.message;
    res.status(status).json({ success: false, message: 'Lỗi khi tạo đơn hàng', error: calioMessage });
  }
};

/**
 * Delete an order (deletes from both Calio and own DB)
 * DELETE /api/orders/:orderId
 */
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await orderService.deleteOrder(orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[OrderController] deleteOrder error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa đơn hàng', error: error.message });
  }
};

/**
 * List orders from own DB
 * GET /api/orders?page=1&pageSize=50&status=&customerPhone=
 */
const listOrders = async (req, res) => {
  try {
    const { page = '1', pageSize = '50', status, customerPhone } = req.query;
    const data = await orderService.listOrders({
      page: Number(page),
      pageSize: Number(pageSize),
      status,
      customerPhone,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[OrderController] listOrders error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn hàng', error: error.message });
  }
};

/**
 * Get a single order
 * GET /api/orders/:orderId
 */
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await orderService.getOrder(orderId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('[OrderController] getOrder error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin đơn hàng', error: error.message });
  }
};

/**
 * Get order detail from Calio (proxied + synced to own DB)
 * GET /api/orders/:orderId/detail
 */
const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await orderService.getOrderDetail(orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[OrderController] getOrderDetail error:', error.message);
    const status = error.response?.status || 500;
    const calioMessage = error.response?.data || error.message;
    res.status(status).json({ success: false, message: 'Lỗi khi lấy chi tiết đơn hàng', error: calioMessage });
  }
};

/**
 * Update an order (calls Calio API + syncs to own DB)
 * PUT /api/orders/:orderId
 */
const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;
    const result = await orderService.updateOrder(orderId, updateData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[OrderController] updateOrder error:', error.message);
    const status = error.response?.status || 500;
    const calioMessage = error.response?.data || error.message;
    res.status(status).json({ success: false, message: 'Lỗi khi cập nhật đơn hàng', error: calioMessage });
  }
};

module.exports = {
  searchCustomers,
  searchProducts,
  getOrderStatuses,
  createOrder,
  deleteOrder,
  listOrders,
  getOrder,
  getOrderDetail,
  updateOrder,
};