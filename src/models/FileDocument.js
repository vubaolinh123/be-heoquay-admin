const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileDocumentSchema = new Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Tên file gốc là bắt buộc'],
      trim: true,
    },
    storedName: {
      type: String,
      required: [true, 'Tên file lưu trữ là bắt buộc'],
    },
    mimeType: {
      type: String,
      required: [true, 'Loại file là bắt buộc'],
    },
    size: {
      type: Number,
      required: [true, 'Kích thước file là bắt buộc'],
    },
    path: {
      type: String,
      required: [true, 'Đường dẫn file là bắt buộc'],
    },
    // Link tải file - đây là link frontend sẽ gọi để download
    downloadUrl: {
      type: String,
      required: [true, 'Link tải file là bắt buộc'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    // Liên kết nhà cung cấp
    supplierId: {
      type: String,
      default: '',
      trim: true,
    },
    supplierName: {
      type: String,
      default: '',
      trim: true,
    },
    // Có thể thêm các field mở rộng
    uploadedBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('FileDocument', FileDocumentSchema);