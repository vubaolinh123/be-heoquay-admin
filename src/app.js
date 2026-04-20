const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static file từ uploads folder (nếu cần xem trực tiếp)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const fileRoutes = require('./routes/fileRoutes');
const orderRoutes = require('./routes/orderRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/api/files', fileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/posts', postRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handler cho Multer
app.use((err, req, res, _next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 10MB',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`,
    });
  }

  if (err.message === 'Chỉ chấp nhận file PDF, DOC, DOCX') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi server nội bộ',
  });
});

module.exports = app;