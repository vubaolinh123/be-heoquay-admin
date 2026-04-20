const mongoose = require('mongoose');
const { Schema } = mongoose;

const productItemSchema = new Schema({
  code: { type: String, default: null },
  product: { type: String, required: true }, // calio product id
  sku: { type: String, default: null },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  discount: { type: Number, default: 0 },
  unit: { type: String, default: null },
  desc: { type: String, default: null },
  parent: { type: String, default: null },
  autoPriceEnabled: { type: Boolean, default: false },
  attributes: [{ type: Schema.Types.Mixed }],
  modifiers: [{ type: Schema.Types.Mixed }],
  index: { type: Number, default: 0 },
  missingQuantity: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  taxCode: { type: String, default: null },
  isPriceIncludesVAT: { type: Boolean, default: false },
  commissionUser: { type: String, default: null },
  commissionRate: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  kitchenStatus: { type: String, default: 'pending' },
}, { _id: false });

const orderSchema = new Schema({
  calioId: { type: String, required: true, unique: true },
  code: { type: String, default: null },
  status: { type: String, default: null },
  // Customer info
  customer: { type: String, default: null }, // calio customer id
  customerName: { type: String, default: null },
  customerPhone: { type: String, default: null },
  customerEmail: { type: String, default: null },
  customerAddress: { type: String, default: null },
  customerCity: { type: String, default: null },
  customerDistrict: { type: String, default: null },
  customerWard: { type: String, default: null },
  // Warehouse & User
  warehouse: { type: String, default: null },
  user: { type: String, default: null },
  users: [{ type: String }],
  // Products
  products: [productItemSchema],
  // Financial
  totalAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  discountPercent: { type: Schema.Types.Mixed, default: null },
  taxAmount: { type: Number, default: 0 },
  taxCode: { type: String, default: null },
  taxPercent: { type: Schema.Types.Mixed, default: null },
  depositAmount: { type: Number, default: 0 },
  transferAmount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },
  pointAmount: { type: Number, default: 0 },
  paymentPoints: { type: Number, default: 0 },
  paymentType: { type: String, default: null },
  isPayment: { type: Boolean, default: false },
  isPaymentPoint: { type: Boolean, default: false },
  // Shipping
  shipFee: { type: Number, default: 0 },
  customerShipFee: { type: Number, default: 0 },
  returnFee: { type: Schema.Types.Mixed, default: null },
  shippingEnabled: { type: Boolean, default: false },
  shippingName: { type: String, default: null },
  shippingPhone: { type: String, default: null },
  shippingAddress: { type: String, default: null },
  shippingProvince: { type: String, default: null },
  shippingDistrict: { type: String, default: null },
  shippingWard: { type: String, default: null },
  // Other
  source: { type: String, default: null },
  tags: [{ type: String }],
  desc: { type: String, default: null },
  note: { type: String, default: null },
  deliveryTime: { type: Number, default: 0 },
  expireTime: { type: Number, default: 0 },
  codAmount: { type: Number, default: 0 },
  cod: { type: Boolean, default: false },
  createShipping: { type: Boolean, default: false },
  autoCreateCustomer: { type: Boolean, default: false },
  createDebt: { type: Boolean, default: false },
  createExpense: { type: Boolean, default: false },
  // Raw data from Calio for full reference
  rawData: { type: Schema.Types.Mixed, default: {} },
  // Sync status
  syncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

orderSchema.index({ code: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('Order', orderSchema);