const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderStatusSchema = new Schema({
  calioId: { type: String, required: true, unique: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, default: '#6c757d' },
  showInList: { type: Boolean, default: true },
  disableAdd: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  position: { type: Number, default: 0 },
  type: { type: String, default: 'order' },
  rawData: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

orderStatusSchema.index({ key: 1 });

module.exports = mongoose.model('OrderStatus', orderStatusSchema);