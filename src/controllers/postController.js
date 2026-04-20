const geminiService = require('../services/geminiService');
const facebookService = require('../services/facebookService');
const fs = require('fs');
const path = require('path');

// In-memory store for generated captions ( keyed by a temporary ID )
// Not persisted to database - lost on server restart
const captionStore = new Map();

/**
 * Generate caption from keyword using Gemini
 * POST /api/posts/generate
 * Body: { keyword: "bánh hỏi" }
 */
const generateCaption = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa để tạo caption',
      });
    }

    const result = await geminiService.generateCaption(keyword.trim());

    // Generate a temporary ID so frontend can reference this caption
    const tempId = `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    captionStore.set(tempId, {
      keyword: keyword.trim(),
      title: result.title,
      content: result.content,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        id: tempId,
        keyword: keyword.trim(),
        title: result.title,
        content: result.content,
      },
    });
  } catch (error) {
    console.error('[PostController] generateCaption error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo caption',
      error: error.message,
    });
  }
};

/**
 * Regenerate caption (same keyword, new result)
 * POST /api/posts/regenerate
 * Body: { id: "caption_xxx" } or { keyword: "bánh hỏi" }
 */
const regenerateCaption = async (req, res) => {
  try {
    const { id, keyword } = req.body;

    // Use existing keyword from stored caption if id provided
    let actualKeyword = keyword;
    if (id && captionStore.has(id)) {
      actualKeyword = actualKeyword || captionStore.get(id).keyword;
    }

    if (!actualKeyword || actualKeyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa hoặc ID caption cũ',
      });
    }

    const result = await geminiService.regenerateCaption(actualKeyword.trim());

    // Replace old caption or create new one
    const newId = `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    captionStore.set(newId, {
      keyword: actualKeyword.trim(),
      title: result.title,
      content: result.content,
      createdAt: new Date(),
    });

    // Remove old caption from memory if it existed
    if (id && captionStore.has(id)) {
      captionStore.delete(id);
    }

    res.json({
      success: true,
      data: {
        id: newId,
        keyword: actualKeyword.trim(),
        title: result.title,
        content: result.content,
      },
    });
  } catch (error) {
    console.error('[PostController] regenerateCaption error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lại caption',
      error: error.message,
    });
  }
};

/**
 * Get a stored caption by ID
 * GET /api/posts/caption/:id
 */
const getCaption = async (req, res) => {
  try {
    const { id } = req.params;
    const caption = captionStore.get(id);

    if (!caption) {
      return res.status(404).json({
        success: false,
        message: 'Caption không tồn tại hoặc đã hết hạn',
      });
    }

    res.json({
      success: true,
      data: {
        id,
        ...caption,
      },
    });
  } catch (error) {
    console.error('[PostController] getCaption error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy caption',
      error: error.message,
    });
  }
};

/**
 * Upload images for a caption post (stored temporarily)
 * POST /api/posts/upload-images
 * FormData: images[] (files), captionId (text)
 */
const uploadImages = async (req, res) => {
  try {
    const { captionId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 ảnh',
      });
    }

    // Store image paths in the caption store
    const imagePaths = files.map((f) => f.path);
    const imageUrls = files.map((f) => `/uploads/facebook/${f.filename}`);

    if (captionId && captionStore.has(captionId)) {
      const caption = captionStore.get(captionId);
      caption.images = [...(caption.images || []), ...imagePaths];
      caption.imageUrls = [...(caption.imageUrls || []), ...imageUrls];
    } else if (captionId) {
      // Caption ID doesn't exist, create placeholder
      captionStore.set(captionId, {
        images: imagePaths,
        imageUrls,
        createdAt: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        captionId: captionId || null,
        images: imageUrls,
        count: files.length,
      },
    });
  } catch (error) {
    console.error('[PostController] uploadImages error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message,
    });
  }
};

/**
 * Publish post to Facebook
 * POST /api/posts/publish
 * Body: { captionId: "caption_xxx" } or { title: "...", content: "..." }
 */
const publishPost = async (req, res) => {
  try {
    const { captionId, title, content } = req.body;

    let postTitle = title;
    let postContent = content;
    let imagePaths = [];

    // Get from caption store if captionId provided
    if (captionId && captionStore.has(captionId)) {
      const caption = captionStore.get(captionId);
      postTitle = postTitle || caption.title;
      postContent = postContent || caption.content;
      imagePaths = caption.images || [];
    }

    if (!postContent || postContent.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bài viết không được để trống',
      });
    }

    // Combine title + content for the Facebook post message
    const message = postTitle
      ? `${postTitle}\n\n${postContent}`
      : postContent;

    let fbResult;
    if (imagePaths.length > 0) {
      // Filter only existing files
      const existingPaths = imagePaths.filter((p) => fs.existsSync(p));
      fbResult = await facebookService.publishPostWithPhotos(message, existingPaths);
    } else {
      fbResult = await facebookService.publishTextPost(message);
    }

    // Clean up: remove caption from memory and delete temporary image files
    if (captionId && captionStore.has(captionId)) {
      const caption = captionStore.get(captionId);
      // Delete temporary image files
      if (caption.images) {
        caption.images.forEach((imgPath) => {
          try {
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
            }
          } catch (e) {
            console.warn('[PostController] Failed to delete image:', imgPath, e.message);
          }
        });
      }
      captionStore.delete(captionId);
    }

    res.json({
      success: true,
      data: {
        postId: fbResult.id,
        message: 'Đăng bài lên Facebook thành công!',
      },
    });
  } catch (error) {
    console.error('[PostController] publishPost error:', error.message);
    const fbError = error.response?.data || error.message;
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Lỗi khi đăng bài lên Facebook',
      error: fbError,
    });
  }
};

/**
 * Cancel a caption (discard without publishing)
 * DELETE /api/posts/cancel/:id
 */
const cancelCaption = async (req, res) => {
  try {
    const { id } = req.params;

    if (!captionStore.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Caption không tồn tại hoặc đã bị hủy',
      });
    }

    const caption = captionStore.get(id);

    // Delete temporary image files
    if (caption.images) {
      caption.images.forEach((imgPath) => {
        try {
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        } catch (e) {
          console.warn('[PostController] Failed to delete image:', imgPath, e.message);
        }
      });
    }

    captionStore.delete(id);

    res.json({
      success: true,
      message: 'Caption đã được hủy và xóa',
    });
  } catch (error) {
    console.error('[PostController] cancelCaption error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy caption',
      error: error.message,
    });
  }
};

/**
 * Get Facebook Page info (for verification)
 * GET /api/posts/page-info
 */
const getPageInfo = async (req, res) => {
  try {
    const info = await facebookService.getPageInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    console.error('[PostController] getPageInfo error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin Facebook Page',
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  generateCaption,
  regenerateCaption,
  getCaption,
  uploadImages,
  publishPost,
  cancelCaption,
  getPageInfo,
};