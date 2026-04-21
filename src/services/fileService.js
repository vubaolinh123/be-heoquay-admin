const fs = require('fs');
const path = require('path');
const FileDocument = require('../models/FileDocument');

class FileService {
  /**
   * Tạo record file mới sau khi upload thành công
   */
  async createFileRecord(fileData, extraFields = {}) {
    const { originalname, mimetype, size, filename } = fileData;
    const filePath = path.join('uploads', filename);
    const downloadUrl = `/api/files/download/${filename}`;

    const fileDoc = await FileDocument.create({
      originalName: originalname,
      storedName: filename,
      mimeType: mimetype,
      size: size,
      path: filePath,
      downloadUrl: downloadUrl,
      description: extraFields.description || '',
      uploadedBy: extraFields.uploadedBy || '',
      supplierId: extraFields.supplierId || '',
      supplierName: extraFields.supplierName || '',
    });

    return fileDoc;
  }

  /**
   * Lấy danh sách tất cả file (có phân trang)
   */
  async getAllFiles({ page = 1, limit = 10, search = '', supplierId = '' } = {}) {
    const query = {};
    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }
    if (supplierId) {
      query.supplierId = supplierId;
    }

    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      FileDocument.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      FileDocument.countDocuments(query),
    ]);

    return {
      files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết 1 file theo ID
   */
  async getFileById(id) {
    const file = await FileDocument.findById(id);
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }
    return file;
  }

  /**
   * Cập nhật thông tin file (chỉ cập nhật metadata, không đổi file vật lý)
   */
  async updateFile(id, updateData) {
    const file = await FileDocument.findById(id);
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }

    // Chỉ cho phép cập nhật description, uploadedBy, supplierId, supplierName
    const allowedFields = ['description', 'uploadedBy', 'supplierId', 'supplierName'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        file[field] = updateData[field];
      }
    }

    await file.save();
    return file;
  }

  /**
   * Xóa file: xóa record DB + xóa file vật lý trên disk
   */
  async deleteFile(id) {
    const file = await FileDocument.findById(id);
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }

    // Xóa file vật lý
    const physicalPath = path.join(__dirname, '../../', file.path);
    if (fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
    }

    // Xóa record DB
    await FileDocument.findByIdAndDelete(id);
    return { message: 'File đã được xóa thành công' };
  }

  /**
   * Tải file: trả về đường dẫn vật lý + thông tin để controller stream file
   */
  async getDownloadInfo(filename) {
    const file = await FileDocument.findOne({ storedName: filename });
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }

    const physicalPath = path.join(__dirname, '../../', file.path);
    if (!fs.existsSync(physicalPath)) {
      throw new Error('FILE_MISSING_ON_DISK');
    }

    return {
      physicalPath,
      originalName: file.originalName,
      mimeType: file.mimeType,
    };
  }
}

module.exports = new FileService();