const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Get the FB access token for a given page key.
 * @param {string} pageKey - "page1" or "page2"
 * @returns {string} The FB Page Access Token
 */
const getToken = (pageKey) => {
  if (pageKey === 'page2') {
    return process.env.FB_TOKEN_PAGE_2;
  }
  // Default to page1
  return process.env.FB_TOKEN_PAGE_1;
};

/**
 * Get Facebook Page ID from access token
 * @param {string} pageKey - "page1" or "page2"
 * @returns {Promise<string>} Page ID
 */
const getPageId = async (pageKey = 'page1') => {
  const token = getToken(pageKey);
  if (!token) {
    throw new Error(`FB_TOKEN_PAGE_${pageKey === 'page2' ? '2' : '1'} chưa được cấu hình trong .env`);
  }
  const response = await axios.get(`${FB_GRAPH_URL}/me`, {
    params: { access_token: token },
  });
  return response.data.id;
};

/**
 * Publish a text-only post to Facebook Page
 * @param {string} message - The post content
 * @param {string} pageKey - "page1" or "page2"
 * @returns {Promise<object>} Facebook post response { id, ... }
 */
const publishTextPost = async (message, pageKey = 'page1') => {
  const token = getToken(pageKey);
  const pageId = await getPageId(pageKey);
  const response = await axios.post(`${FB_GRAPH_URL}/${pageId}/feed`, {
    message,
    access_token: token,
  });
  return response.data;
};

/**
 * Publish a post with photos to Facebook Page
 * @param {string} message - The post content/caption
 * @param {string[]} imagePaths - Array of file paths to upload
 * @param {string} pageKey - "page1" or "page2"
 * @returns {Promise<object>} Facebook post response { id, ... }
 */
const publishPostWithPhotos = async (message, imagePaths, pageKey = 'page1') => {
  const token = getToken(pageKey);
  const pageId = await getPageId(pageKey);

  if (!imagePaths || imagePaths.length === 0) {
    return publishTextPost(message, pageKey);
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
          access_token: token,
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
  const params = new URLSearchParams();
  params.append('message', message);
  params.append('access_token', token);

  // Attach photos using attached_media
  photoIds.forEach((id, index) => {
    params.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: id }));
  });

  const response = await axios.post(`${FB_GRAPH_URL}/${pageId}/feed`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

/**
 * Delete a Facebook post
 * @param {string} postId - The Facebook post ID
 * @param {string} pageKey - "page1" or "page2" (to use the correct token)
 * @returns {Promise<object>}
 */
const deletePost = async (postId, pageKey = 'page1') => {
  const token = getToken(pageKey);
  const response = await axios.delete(`${FB_GRAPH_URL}/${postId}`, {
    params: { access_token: token },
  });
  return response.data;
};

/**
 * Get Facebook Page info (for verification) for a specific page
 * @param {string} pageKey - "page1" or "page2"
 * @returns {Promise<object>}
 */
const getPageInfo = async (pageKey = 'page1') => {
  const token = getToken(pageKey);
  if (!token) {
    throw new Error(`FB_TOKEN_PAGE_${pageKey === 'page2' ? '2' : '1'} chưa được cấu hình trong .env`);
  }
  const response = await axios.get(`${FB_GRAPH_URL}/me`, {
    params: {
      access_token: token,
      fields: 'id,name,link,picture',
    },
  });
  return response.data;
};

/**
 * Get all configured pages info
 * @returns {Promise<Array<{pageKey: string, id: string, name: string, link: string, picture?: object}>>}
 */
const getAllPagesInfo = async () => {
  const results = [];

  for (const key of ['page1', 'page2']) {
    const token = getToken(key);
    if (token) {
      try {
        const info = await getPageInfo(key);
        results.push({
          pageKey: key,
          ...info,
        });
      } catch (err) {
        results.push({
          pageKey: key,
          error: err.message,
        });
      }
    } else {
      results.push({
        pageKey: key,
        error: `FB_TOKEN_PAGE_${key === 'page2' ? '2' : '1'} chưa được cấu hình`,
      });
    }
  }

  return results;
};

module.exports = {
  publishTextPost,
  publishPostWithPhotos,
  deletePost,
  getPageInfo,
  getAllPagesInfo,
  getToken,
};