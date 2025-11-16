const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not set in .env' });

  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: message }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
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
