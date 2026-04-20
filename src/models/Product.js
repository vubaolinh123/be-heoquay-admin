const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  calioId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, default: null },
  type: { type: String, default: null },
  unit: { type: String, default: null },
  importPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  desc: { type: String, default: null },
  active: { type: Boolean, default: true },
  categories: [{ type: String }],
  warehouses: [{ type: Schema.Types.Mixed }],
  inventories: [{ type: Schema.Types.Mixed }],
  totalQuantity: { type: Number, default: 0 },
  remainQuantity: { type: Number, default: 0 },
  hasChild: { type: Boolean, default: false },
  source: { type: String, default: null },
  rawData: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 1 });

module.exports = mongoose.model('Product', productSchema);