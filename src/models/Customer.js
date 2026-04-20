const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema({
  calioId: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  address: { type: String, default: null },
  province: { type: String, default: null },
  district: { type: String, default: null },
  ward: { type: String, default: null },
  code: { type: String, default: null },
  facebookId: { type: String, default: null },
  facebookName: { type: String, default: null },
  zaloId: { type: String, default: null },
  gender: { type: String, default: null },
  avatar: { type: String, default: null },
  source: { type: String, default: null },
  anonymous: { type: Boolean, default: false },
  tags: [{ type: String }],
  rawData: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

customerSchema.index({ phone: 1 });
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);