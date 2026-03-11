const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON සහ URL-encoded data support කරන්න
app.use(express.json());

// ඔයාගේ සුපිරි dxz function එක
async function dxz(query, options = {}) {
  const { maxRetries = 2, timeout = 15000 } = options;
  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        const encodedParams = new URLSearchParams();
        encodedParams.set("url", query);
        encodedParams.set("hd", "1");
        const response = await axios({
          method: "POST",
          url: "https://tikwm.com/api/",
          timeout,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: "current_language=en",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          },
          data: encodedParams.toString(),
        });
        if (!response.data || response.data.code !== 0) {
          throw new Error(response.data?.msg || "API returned non-zero code");
        }
        const data = response.data.data;
        const result = {
          success: true,
          title: data.title || null,
          author: {
            username: data.author?.unique_id || data.author?.nickname,
            nickname: data.author?.nickname,
          },
          cover: data.cover,
          duration: data.duration || null,
          no_watermark: data.play, 
          watermark: data.wmplay || data.wm_size,
          music: data.music,
        };
        resolve(result);
        return;
      } catch (error) {
        attempts++;
        console.warn(`Attempt ${attempts} failed: ${error.message}`);
        if (attempts > maxRetries) reject(error);
        await new Promise(r => setTimeout(r, 1500 * attempts)); 
      }
    }
  });
}

// API Endpoint එක (GET Request)
app.get("/api/tiktok", async (req, res) => {
  const videoUrl = req.query.url;
  
  if (!videoUrl) {
    return res.status(400).json({ success: false, message: "URL එකක් දෙන්න (උදා: ?url=...)" });
  }

  try {
    const data = await dxz(videoUrl);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Server එක Start කිරීම
app.listen(PORT, () => {
  console.log(`🚀 TikTok API is running on port ${PORT}`);
});
