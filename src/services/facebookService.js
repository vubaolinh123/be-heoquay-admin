const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';
const FB_TOKEN = process.env.FB_TOKEN;

/**
 * Get Facebook Page ID from access token
 * @returns {Promise<string>} Page ID
 */
const getPageId = async () => {
  const response = await axios.get(`${FB_GRAPH_URL}/me`, {
    params: { access_token: FB_TOKEN },
  });
  return response.data.id;
};

/**
 * Publish a text-only post to Facebook Page
 * @param {string} message - The post content
 * @returns {Promise<object>} Facebook post response { id, ... }
 */
const publishTextPost = async (message) => {
  const pageId = await getPageId();
  const response = await axios.post(`${FB_GRAPH_URL}/${pageId}/feed`, {
    message,
    access_token: FB_TOKEN,
  });
  return response.data;
};

/**
 * Publish a post with photos to Facebook Page
 * @param {string} message - The post content/caption
 * @param {string[]} imagePaths - Array of file paths to upload
 * @returns {Promise<object>} Facebook post response { id, ... }
 */
const publishPostWithPhotos = async (message, imagePaths) => {
  const pageId = await getPageId();

  if (!imagePaths || imagePaths.length === 0) {
    return publishTextPost(message);
  }

  // Step 1: Upload photos as unpublished staged photos
  const photoIds = [];

  for (const imagePath of imagePaths) {
    const formData = new FormData();
    formData.append('source', fs.createReadStream(imagePath));

    const uploadResponse = await axios.post(
      `${FB_GRAPH_URL}/${pageId}/photos`,
      formData,
      {
        params: {
          access_token: FB_TOKEN,
          published: 'false', // Don't publish yet, attach to post later
        },
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    photoIds.push(uploadResponse.data.id);
  }

  // Step 2: Create the post with attached photos
  const postData = {
    message,
    access_token: FB_TOKEN,
  };

  // Attach photos using object_attachment or media_fbid
  photoIds.forEach((id, index) => {
    postData[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
  });

  const response = await axios.post(`${FB_GRAPH_URL}/${pageId}/feed`, postData);
  return response.data;
};

/**
 * Delete a Facebook post
 * @param {string} postId - The Facebook post ID
 * @returns {Promise<object>}
 */
const deletePost = async (postId) => {
  const response = await axios.delete(`${FB_GRAPH_URL}/${postId}`, {
    params: { access_token: FB_TOKEN },
  });
  return response.data;
};

/**
 * Get Facebook Page info (for verification)
 * @returns {Promise<object>}
 */
const getPageInfo = async () => {
  const response = await axios.get(`${FB_GRAPH_URL}/me`, {
    params: {
      access_token: FB_TOKEN,
      fields: 'id,name,link,picture',
    },
  });
  return response.data;
};

module.exports = {
  publishTextPost,
  publishPostWithPhotos,
  deletePost,
  getPageInfo,
};