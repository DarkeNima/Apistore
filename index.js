const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- TikTok Downloader Function ---
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
        const result = {
          success: true,
          creator: "@Darknaviya",
          title: data.title,
          region: data.region,
          duration: data.duration,
          links: {
            no_watermark: data.play,
            watermark: data.wmplay,
            hd_video: data.hdplay,
            music: data.music
          },
          author: {
            id: data.author?.id,
            username: data.author?.unique_id,
            nickname: data.author?.nickname,
            avatar: data.author?.avatar
          },
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

// --- Facebook Downloader Function ---
async function getFbVideo(url) {
    try {
        const response = await axios({
            method: 'POST',
            url: "https://save-from.net/api/convert",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            data: { url: url }
        });
        
        const data = response.data;
        
        return {
            success: true,
            creator: "@Darknaviya",
            title: data.meta?.title || "Facebook Video",
            thumbnail: data.meta?.thumbnail,
            duration: data.meta?.duration,
            links: {
                hd: data.url?.find(link => link.subname === 'hd')?.url || null,
                sd: data.url?.find(link => link.subname === 'sd')?.url || (data.url && data.url[0]?.url)
            }
        };
    } catch (error) {
        return { success: false, creator: "@Darknaviya", message: "Facebook වීඩියෝ එක ගන්න බැරි වුණා!" };
    }
}

// --- API Endpoints ---

// Facebook Route
app.get("/api/fb", async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ success: false, message: "URL required" });
    const result = await getFbVideo(videoUrl);
    res.json(result);
});

// TikTok Route
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

app.listen(PORT, () => console.log(`🚀 Darknaviya Multi-API on port ${PORT}`));
