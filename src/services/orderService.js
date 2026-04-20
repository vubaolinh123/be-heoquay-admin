const mongoose = require('mongoose');
const calioService = require('./calioService');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const OrderStatus = require('../models/OrderStatus');
const Order = require('../models/Order');

/**
 * Search customers from Calio and sync to own DB
 */
const searchCustomers = async (params) => {
  const calioData = await calioService.searchCustomers(params);

  // Sync customers to own DB
  if (calioData.docs && calioData.docs.length > 0) {
    const bulkOps = calioData.docs.map((doc) => ({
      updateOne: {
        filter: { calioId: doc._id },
        update: {
          $set: {
            calioId: doc._id,
            name: doc.name,
            phone: doc.additionPhones?.[0] || doc.user?.phone || null,
            email: doc.additionEmails?.[0] || doc.user?.email || null,
            address: doc.address,
            province: doc.province,
            district: doc.district,
            ward: doc.ward,
            code: doc.code,
            facebookId: doc.facebookId,
            facebookName: doc.facebookName,
            zaloId: doc.zaloId,
            gender: doc.gender,
            avatar: doc.avatar,
            source: doc.source,
            anonymous: doc.anonymous,
            tags: doc.tags || [],
            rawData: doc,
          },
        },
        upsert: true,
      },
    }));

    await Customer.bulkWrite(bulkOps);
  }

  return calioData;
};

/**
 * Search products from Calio and sync to own DB
 */
const searchProducts = async (params) => {
  const calioData = await calioService.searchProducts(params);

  // Sync products to own DB
  if (calioData.docs && calioData.docs.length > 0) {
    const bulkOps = calioData.docs.map((doc) => ({
      updateOne: {
        filter: { calioId: doc._id },
        update: {
          $set: {
            calioId: doc._id,
            name: doc.name,
            sku: doc.sku,
            type: doc.type,
            unit: doc.unit,
            importPrice: doc.importPrice,
            sellPrice: doc.sellPrice,
            desc: doc.desc,
            active: doc.active,
            categories: doc.categories || [],
            warehouses: doc.warehouses || [],
            inventories: doc.inventories || [],
            totalQuantity: doc.totalQuantity,
            remainQuantity: doc.remainQuantity,
            hasChild: doc.hasChild,
            source: doc.source,
            rawData: doc,
          },
        },
        upsert: true,
      },
    }));

    await Product.bulkWrite(bulkOps);
  }

  return calioData;
};

/**
 * Get order statuses from Calio and sync to own DB
 */
const getOrderStatuses = async (params) => {
  const calioData = await calioService.getOrderStatuses(params);

  // Sync statuses to own DB
  if (calioData.docs && calioData.docs.length > 0) {
    const bulkOps = calioData.docs.map((doc) => ({
      updateOne: {
        filter: { calioId: doc._id },
        update: {
          $set: {
            calioId: doc._id,
            key: doc.key,
            label: doc.label,
            color: doc.color,
            showInList: doc.showInList,
            disableAdd: doc.disableAdd,
            active: doc.active,
            position: doc.position,
            type: doc.type,
            rawData: doc,
          },
        },
        upsert: true,
      },
    }));

    await OrderStatus.bulkWrite(bulkOps);
  }

  return calioData;
};

/**
 * Helper: map Calio order data to our DB schema fields
 */
const mapCalioOrderToDb = (calioOrder, extraData = {}) => ({
  calioId: calioOrder._id || calioOrder.id,
  code: calioOrder.code,
  status: calioOrder.status,
  customer: calioOrder.customer,
  customerName: calioOrder.customerName,
  customerPhone: calioOrder.customerPhone,
  customerEmail: calioOrder.customerEmail,
  customerAddress: calioOrder.customerAddress || calioOrder.shippingAddress,
  customerCity: calioOrder.customerCity,
  customerDistrict: calioOrder.customerDistrict || calioOrder.shippingDistrict,
  customerWard: calioOrder.customerWard || calioOrder.shippingWard,
  warehouse: calioOrder.warehouse,
  user: calioOrder.user?._id || calioOrder.user || calioOrder.createdBy,
  users: calioOrder.users || [],
  products: (calioOrder.products || []).map((p) => ({
    code: p.code,
    product: p.product,
    sku: p.sku,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    discount: p.discount,
    unit: p.unit,
    desc: p.desc,
    parent: p.parent,
    autoPriceEnabled: p.autoPriceEnabled,
    attributes: p.attributes || [],
    modifiers: p.modifiers || [],
    index: p.index,
    missingQuantity: p.missingQuantity || 0,
    pointsEarned: p.pointsEarned || 0,
    taxCode: p.taxCode,
    isPriceIncludesVAT: p.isPriceIncludesVAT || false,
    commissionUser: p.commissionUser,
    commissionRate: p.commissionRate || 0,
    commissionAmount: p.commissionAmount || 0,
    kitchenStatus: p.kitchenStatus || 'pending',
  })),
  totalAmount: calioOrder.totalAmount,
  discountAmount: calioOrder.discountAmount,
  discountPercent: calioOrder.discountPercent,
  taxAmount: calioOrder.taxAmount,
  taxCode: calioOrder.taxCode,
  taxPercent: calioOrder.taxPercent,
  depositAmount: calioOrder.depositAmount,
  transferAmount: calioOrder.transferAmount,
  receivedAmount: calioOrder.receivedAmount,
  pointAmount: calioOrder.pointAmount,
  paymentPoints: calioOrder.paymentPoints,
  paymentType: calioOrder.paymentType || extraData.paymentType,
  isPayment: calioOrder.isPayment,
  isPaymentPoint: calioOrder.isPaymentPoint,
  shipFee: calioOrder.shipFee,
  customerShipFee: calioOrder.customerShipFee,
  returnFee: calioOrder.returnFee,
  shippingEnabled: calioOrder.shippingEnabled,
  shippingName: calioOrder.shippingName,
  shippingPhone: calioOrder.shippingPhone,
  shippingAddress: calioOrder.shippingAddress,
  shippingProvince: calioOrder.shippingProvince,
  shippingDistrict: calioOrder.shippingDistrict,
  shippingWard: calioOrder.shippingWard,
  source: calioOrder.source,
  tags: calioOrder.tags || [],
  desc: calioOrder.desc,
  note: calioOrder.note,
  deliveryTime: calioOrder.deliveryTime,
  expireTime: calioOrder.expireTime,
  codAmount: calioOrder.codAmount,
  cod: calioOrder.cod,
  rawData: calioOrder,
  syncedAt: new Date(),
});

/**
 * Helper: save/update order in our DB from Calio data
 */
const upsertOrderToDb = async (calioOrder, extraData = {}) => {
  return Order.findOneAndUpdate(
    { calioId: calioOrder._id || calioOrder.id },
    { $set: mapCalioOrderToDb(calioOrder, extraData) },
    { upsert: true, new: true }
  );
};

/**
 * Create order: call Calio API, then save to own DB
 */
const createOrder = async (orderData) => {
  // 1. Create order on Calio
  const calioOrder = await calioService.createOrder(orderData);

  // 2. Save to own DB
  const localOrder = await upsertOrderToDb(calioOrder, orderData);

  return { calioOrder, localOrder };
};

/**
 * Delete order: delete from both Calio and own DB
 */
const deleteOrder = async (orderId) => {
  // Try to delete from Calio (orderId could be calioId or local _id)
  let calioId = orderId;

  // If it looks like a MongoDB ObjectId, check if it's a local _id or calioId
  const localOrder = await Order.findOne({
    $or: [{ _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }, { calioId: orderId }],
  });

  if (localOrder) {
    calioId = localOrder.calioId;
  }

  // Delete from Calio
  let calioResult = null;
  try {
    calioResult = await calioService.deleteOrder(calioId);
  } catch (err) {
    console.warn(`[OrderService] Could not delete from Calio: ${err.message}`);
  }

  // Delete from own DB
  const dbResult = await Order.findOneAndDelete({ calioId });

  return { calioResult, dbResult, calioId };
};

/**
 * List all orders from own DB
 */
const listOrders = async ({ page = 1, pageSize = 50, status, customerPhone } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (customerPhone) filter.customerPhone = customerPhone;

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    docs,
    totalDocs: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get a single order by ID
 */
const getOrder = async (orderId) => {
  return Order.findOne({
    $or: [{ calioId: orderId }, { _id: mongoose.Types.ObjectId.isValid(orderId) ? orderId : null }],
  }).lean();
};

/**
 * Get order detail from Calio and sync to own DB
 */
const getOrderDetail = async (orderId) => {
  let calioId = orderId;

  // Resolve local orderId to calioId if needed
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    const localOrder = await Order.findOne({
      $or: [{ _id: orderId }, { calioId: orderId }],
    });
    if (localOrder) {
      calioId = localOrder.calioId;
    }
  }

  // Fetch from Calio
  const calioOrder = await calioService.getOrderDetail(calioId);

  // Sync to own DB
  const localOrder = await upsertOrderToDb(calioOrder);

  return { calioOrder, localOrder };
};

/**
 * Update an order: call Calio PUT API, then sync to own DB
 */
const updateOrder = async (orderId, updateData) => {
  let calioId = orderId;

  // Resolve local orderId to calioId if needed
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    const existingOrder = await Order.findOne({
      $or: [{ _id: orderId }, { calioId: orderId }],
    });
    if (existingOrder) {
      calioId = existingOrder.calioId;
    }
  }

  // Update on Calio
  const calioOrder = await calioService.updateOrder(calioId, updateData);

  // Sync updated data to own DB
  const localOrder = await upsertOrderToDb(calioOrder, updateData);

  return { calioOrder, localOrder };
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