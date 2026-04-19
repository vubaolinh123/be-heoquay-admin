const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const fileController = require('../controllers/fileController');

/**
 * @route   POST /api/files/upload
 * @desc    Upload file (PDF/DOC/DOCX)
 * @access  Public
 */
router.post('/upload', upload.single('file'), fileController.uploadFile);

/**
 * @route   GET /api/files
 * @desc    Lấy danh sách file (phân trang, tìm kiếm)
 * @access  Public
 * @query   page, limit, search
 */
router.get('/', fileController.getFiles);

/**
 * @route   GET /api/files/download/:filename
 * @desc    Tải file về
 * @access  Public
 */
router.get('/download/:filename', fileController.downloadFile);

/**
 * @route   GET /api/files/:id
 * @desc    Lấy chi tiết 1 file
 * @access  Public
 */
router.get('/:id', fileController.getFileById);

/**
 * @route   PUT /api/files/:id
 * @desc    Cập nhật metadata file
 * @access  Public
 */
router.put('/:id', fileController.updateFile);

/**
 * @route   DELETE /api/files/:id
 * @desc    Xóa file (DB + file vật lý)
 * @access  Public
 */
router.delete('/:id', fileController.deleteFile);

module.exports = router;