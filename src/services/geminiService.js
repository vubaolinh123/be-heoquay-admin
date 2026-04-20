const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.API_KEY_GEMINI;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Build the system prompt from rule.md content
 */
const buildSystemPrompt = () => {
  return `Bạn là một chuyên gia sáng tạo nội dung Facebook cho cửa hàng Heo Quay Ngọc Hải. 

Thông tin cửa hàng:
- Tên: Heo Quay Ngọc Hải
- Điện thoại/Zalo: 0766 666 656 hoặc 0258 9999 928
- Email: rin@ngochai.vn
- TikTok: @loquayngochai
- Website: https://ngochai.vn

Chi nhánh:
📍 43/6 Vân Đồn
📍 26A Lam Sơn
📍 146 Hoàng Hoa Thám
🕘 06:30 – 12:00 & 15:30 – 19:00

Quy tắc viết nội dung:
1. Tiêu đề: Ngắn gọn, hấp dẫn, có icon phù hợp (🐷🔥😋🥢🍖🥖🌿🍜)
2. Nội dung: 50-100 từ, XOAY QUANH gợi ý từ người dùng
3. Đơn giản, ngắn gọn, không mô tả lan man
4. Kèm giá theo món nếu có
5. Trình bày xuống dòng hợp lý, dễ đọc
6. Dùng emoji linh hoạt: 🐷🔥😋🥢🍖🥖🔥😋🌿🍜
7. Mỗi ý chính 1 dòng, ngắn gọn dưới 20 từ, tối đa 2 dòng
8. LUÔN kết thúc bằng địa chỉ chi nhánh theo mẫu:

🏪 Chi nhánh:
📍 43/6 Vân Đồn.
📍 26A Lam Sơn
📍 146 Hoàng Hoa Thám
🕘 06:30 – 12:00 & 15:30 – 19:00
📞 0766 666 656 • 0258 9999 928
💻 www.ngochai.vn
📲 TikTok: @loquayngochai
📧 Email: rin@ngochai.vn

Phong cách: Hài hước, gần gũi, kích thích vị giác. Chốt đơn rõ ràng: "Gọi 0766 666 656 để đặt hàng ngay!"
KHÔNG viết tắt trong bất kỳ địa chỉ nào.`;
};

/**
 * Generate a Facebook post caption based on a keyword
 * @param {string} keyword - The topic/keyword for the post (e.g., "bánh hỏi", "heo quay")
 * @returns {Promise<{title: string, content: string}>}
 */
const generateCaption = async (keyword) => {
  const systemPrompt = buildSystemPrompt();

  const result = await model.generateContent([
    systemPrompt,
    `Hãy viết 1 bài đăng Facebook cho cửa hàng Heo Quay Ngọc Hải về chủ đề: "${keyword}". 
Trả kết quả ở dạng JSON với 2 field:
{
  "title": "...",
  "content": "..."
}

title: Tiêu đề ngắn gọn, hấp dẫn, có icon phù hợp.
content: Nội dung 50-100 từ xoay quanh "${keyword}", kèm emoji, xuống dòng hợp lý, cuối bài luôn có thông tin chi nhánh.

CHỈ trả về JSON, không thêm gì khác.`,
  ]);

  const responseText = result.response.text();

  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object in the response
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      title: parsed.title || '',
      content: parsed.content || '',
    };
  } catch (parseError) {
    console.error('[GeminiService] Failed to parse JSON:', parseError.message);
    console.error('[GeminiService] Raw response:', responseText);
    // If parsing fails, return the raw text as content
    return {
      title: `🐷 ${keyword}`,
      content: responseText,
    };
  }
};

/**
 * Regenerate caption (same as generate, just a convenience alias)
 * @param {string} keyword
 * @returns {Promise<{title: string, content: string}>}
 */
const regenerateCaption = async (keyword) => {
  return generateCaption(keyword);
};

module.exports = {
  generateCaption,
  regenerateCaption,
};