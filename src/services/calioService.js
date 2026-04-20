const axios = require('axios');

const BASE_URL = 'https://clientapi.phonenet.io';
const TOKEN = process.env.TOKEN;

const calioClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Token: TOKEN,
    'Content-Type': 'application/json',
  },
});

// Response interceptor for logging
calioClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(`[Calio API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${status}`, data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Search customers from Calio
 */
const searchCustomers = async ({ keyword = '', status = 0, page = 1, pageSize = 50 }) => {
  const response = await calioClient.get('/customer', {
    params: { keyword, status, page, pageSize },
  });
  return response.data;
};

/**
 * Search products from Calio
 */
const searchProducts = async ({ keyword = '', warehouse = '66c5a66fb6d90a09096dd52b', type = 'store,service', includeParent = true, status = 1, hasChild = 2, page = 1, pageSize = 50 }) => {
  const response = await calioClient.get('/product', {
    params: { keyword, warehouse, type, includeParent, status, hasChild, page, pageSize },
  });
  return response.data;
};

/**
 * Get order statuses from Calio
 */
const getOrderStatuses = async ({ keyword = '', active = 1, page = 1, pageSize = 50 }) => {
  const response = await calioClient.get('/client-custom-status/order', {
    params: { keyword, active, page, pageSize },
  });
  return response.data;
};

/**
 * Create an order on Calio
 */
const createOrder = async (orderData) => {
  const response = await calioClient.post('/product-order', orderData);
  return response.data;
};

/**
 * Delete an order on Calio
 */
const deleteOrder = async (orderId) => {
  const response = await calioClient.delete(`/product-order/${orderId}`);
  return response.data;
};

/**
 * Get order detail from Calio
 */
const getOrderDetail = async (orderId) => {
  const response = await calioClient.get(`/product-order/${orderId}`);
  return response.data;
};

/**
 * Update an order on Calio
 */
const updateOrder = async (orderId, orderData) => {
  const response = await calioClient.put(`/product-order/${orderId}`, orderData);
  return response.data;
};

module.exports = {
  searchCustomers,
  searchProducts,
  getOrderStatuses,
  createOrder,
  deleteOrder,
  getOrderDetail,
  updateOrder,
};