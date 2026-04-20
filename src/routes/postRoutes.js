const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const uploadImage = require('../config/multerImage');

/**
 * @route   POST /api/posts/generate
 * @desc    Generate caption from keyword using Gemini AI
 * @body    { keyword: string }
 */
router.post('/generate', postController.generateCaption);

/**
 * @route   POST /api/posts/regenerate
 * @desc    Regenerate caption (same or new keyword)
 * @body    { id?: string, keyword?: string }
 */
router.post('/regenerate', postController.regenerateCaption);

/**
 * @route   GET /api/posts/caption/:id
 * @desc    Get a stored caption by ID
 */
router.get('/caption/:id', postController.getCaption);

/**
 * @route   POST /api/posts/upload-images
 * @desc    Upload images for a post (max 5 images)
 * @body    FormData: images[] (files), captionId (optional text)
 */
router.post('/upload-images', uploadImage.array('images', 5), postController.uploadImages);

/**
 * @route   POST /api/posts/publish
 * @desc    Publish post to Facebook Page
 * @body    { captionId?: string, title?: string, content?: string }
 */
router.post('/publish', postController.publishPost);

/**
 * @route   DELETE /api/posts/cancel/:id
 * @desc    Cancel and discard a caption + delete uploaded images
 */
router.delete('/cancel/:id', postController.cancelCaption);

/**
 * @route   GET /api/posts/page-info
 * @desc    Get Facebook Page info (for verification)
 */
router.get('/page-info', postController.getPageInfo);

module.exports = router;