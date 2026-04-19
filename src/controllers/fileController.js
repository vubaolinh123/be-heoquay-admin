const path = require('path');
const fileService = require('../services/fileService');

/**
 * Upload file mới
 * POST /api/files/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để upload (chỉ chấp nhận PDF, DOC, DOCX)',
      });
    }

    // Thêm description từ form data nếu có
    const fileDoc = await fileService.createFileRecord(req.file);

    // Gán thêm description nếu gửi kèm
    if (req.body.description) {
      fileDoc.description = req.body.description;
      await fileDoc.save();
    }

    res.status(201).json({
      success: true,
      message: 'Upload file thành công',
      data: fileDoc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi upload file',
    });
  }
};

/**
 * Lấy danh sách file
 * GET /api/files?page=1&limit=10&search=keyword
 */
const getFiles = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await fileService.getAllFiles({ page, limit, search });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách file thành công',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách file',
    });
  }
};

/**
 * Lấy chi tiết 1 file
 * GET /api/files/:id
 */
const getFileById = async (req, res) => {
  try {
    const file = await fileService.getFileById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin file thành công',
      data: file,
    });
  } catch (error) {
    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin file',
    });
  }
};

/**
 * Cập nhật metadata file (description, uploadedBy)
 * PUT /api/files/:id
 */
const updateFile = async (req, res) => {
  try {
    const file = await fileService.updateFile(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Cập nhật file thành công',
      data: file,
    });
  } catch (error) {
    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật file',
    });
  }
};

/**
 * Xóa file (DB + file vật lý)
 * DELETE /api/files/:id
 */
const deleteFile = async (req, res) => {
  try {
    const result = await fileService.deleteFile(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa file',
    });
  }
};

/**
 * Download file theo stored filename
 * GET /api/files/download/:filename
 */
const downloadFile = async (req, res) => {
  try {
    const { physicalPath, originalName, mimeType } = await fileService.getDownloadInfo(
      req.params.filename
    );

    // Set header để force download với tên gốc
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Content-Type', mimeType);

    // Stream file về client
    const fileStream = require('fs').createReadStream(physicalPath);
    fileStream.pipe(res);
  } catch (error) {
    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file trong database',
      });
    }
    if (error.message === 'FILE_MISSING_ON_DISK') {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại trên server',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tải file',
    });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  downloadFile,
};