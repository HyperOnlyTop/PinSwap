const express = require('express');
const router = express.Router();
const axios = require('axios');

// Context về website PinSwap
const WEBSITE_CONTEXT = `
Bạn là trợ lý ảo của website PinSwap - Nền tảng thu gom pin thải thân thiện với môi trường.

THÔNG TIN VỀ PINSWAP:
- Website giúp người dân thu gom pin cũ/thải tại các điểm thu gom trên bản đồ
- Người dùng có thể kiếm điểm thông qua việc thu gom pin và check-in tại các địa điểm
- Điểm kiếm được có thể đổi lấy voucher giảm giá từ các doanh nghiệp

CÁC TÍNH NĂNG CHÍNH:
1. Thu gom pin: Quét ảnh pin bằng AI để nhận diện loại pin và tính điểm
2. Bản đồ điểm thu gom: Xem các địa điểm thu gom pin gần nhất
3. Check-in QR: Quét mã QR tại địa điểm để nhận điểm thưởng (50 điểm/lần, 1 lần/ngày/địa điểm)
4. Đổi voucher: Dùng điểm để đổi voucher giảm giá
5. Bảng xếp hạng: Xem thứ hạng người dùng theo số pin thu gom và điểm số
6. Lịch sử: Xem lại các lần thu gom và đổi voucher

VAI TRÒ NGƯỜI DÙNG:
- Người dân (Citizen): Thu gom pin, kiếm điểm, đổi voucher, check-in
- Doanh nghiệp (Business): Tạo voucher, quản lý voucher của mình, đăng ký điểm thu gom
- Admin: Quản lý toàn bộ hệ thống, duyệt doanh nghiệp, khóa tài khoản

CÁCH TÍNH ĐIỂM:
- Mỗi loại pin có số điểm khác nhau tùy vào kích thước và độc hại
- Check-in tại địa điểm: 50 điểm/lần
- Điểm có thể dùng để đổi voucher

HÃY TRẢ LỜI:
- Ngắn gọn, thân thiện, dễ hiểu
- Tập trung vào các tính năng và cách sử dụng PinSwap
- Khuyến khích người dùng bảo vệ môi trường
- Nếu câu hỏi không liên quan đến PinSwap, hãy lịch sự từ chối và hướng dẫn về chủ đề phù hợp
`;

router.post('/', async (req, res) => {
  const { message, sessionId } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

  if (!API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not set in .env' });

  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

  // Tạo prompt với context
  const fullPrompt = `${WEBSITE_CONTEXT}

Câu hỏi của người dùng: ${message}

Trả lời (bằng tiếng Việt, ngắn gọn, dễ hiểu):`;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { 
      temperature: 0.7, 
      maxOutputTokens: 800,
      topP: 0.8,
      topK: 10
    }
  };

  try {
    const r = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    const data = r.data;

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi';
    return res.json({ reply });

  } catch (err) {
    console.error("Gemini error:", err?.response?.data || err.message);
    return res.status(500).json({ error: 'Gemini API error', detail: err?.response?.data || err.message });
  }
});

module.exports = router;
