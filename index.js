const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          },
          data: encodedParams.toString(),
        });

        if (!response.data || response.data.code !== 0) {
          throw new Error(response.data?.msg || "API returned error");
        }

        const data = response.data.data;

        // --- මෙන්න ඔයා ඉල්ලපු දත්ත ටික සෙට් කරන තැන ---
        const result = {
          success: true,
          title: data.title,
          region: data.region,
          duration: data.duration,
          // වීඩියෝ ලින්ක්ස්
          links: {
            no_watermark: data.play,
            watermark: data.wmplay,
            hd_video: data.hdplay,
            music: data.music
          },
          // යූසර්ගේ විස්තර (Profile Photo ඇතුළුව)
          author: {
            id: data.author?.id,
            username: data.author?.unique_id,
            nickname: data.author?.nickname,
            avatar: data.author?.avatar // 📸 Profile Photo එක මෙතන
          },
          // වීඩියෝ එකේ Stats
          stats: {
            plays: data.play_count,
            likes: data.digg_count,
            comments: data.comment_count,
            shares: data.share_count,
            downloads: data.download_count
          },
          covers: {
            static: data.cover,
            dynamic: data.ai_dynamic_cover
          }
        };

        resolve(result);
        return;
      } catch (error) {
        attempts++;
        if (attempts > maxRetries) reject(error);
        await new Promise(r => setTimeout(r, 1500 * attempts));
      }
    }
  });
}

app.get("/api/tiktok", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ success: false, message: "URL required" });

  try {
    const data = await dxz(videoUrl);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => console.log(`API on port ${PORT}`));
