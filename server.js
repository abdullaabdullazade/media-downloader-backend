const express = require("express");
const { exec } = require("child_process");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

cloudinary.config({
  cloud_name: "dhwumjwk1",
  api_key: "497861313575895",
  api_secret: "ueCODC6-J2kmdKt3WEKOhjEwV9A",
});

app.use(bodyParser.json());

const DOWNLOADS_FOLDER = path.join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOADS_FOLDER)) fs.mkdirSync(DOWNLOADS_FOLDER);

app.post("/delete-video", async (req, res) => {
  let { fileName } =  req.body; // Burada fileName artıq Cloudinary public_id olacaq
  console.log(fileName,req.body);

  if (!fileName)
    return res.status(400).json({ error: "Fayl adı təqdim edilməyib" });
  try {
    await cloudinary.uploader.destroy(fileName, { resource_type: "video" });
    return res.json({ success: true, message: "Video silindi" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Silinmədi", error });
  }
});

app.post("/upload-video", async (req, res) => {
  const { url } = req.body;
  if (!url)
    return res.status(400).json({ error: "Video linki təqdim edilməyib" });

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(DOWNLOADS_FOLDER, fileName);

  const command = `yt-dlp -o "${filePath}" ${url}`;
  exec(command, async (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: "Video yüklənmədi" });

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",
        folder: "my_videos",
      });

      fs.unlinkSync(filePath); // Yerli faylı sil
      res.json({ url: result.secure_url, fileName: result.public_id });
    } catch (uploadError) {
      res.status(500).json({ error: "Cloudinary-ə yüklənmədi" });
    }
  });
});

app.listen(port, () => {
  console.log(`API http://localhost:${port} ünvanında işləyir`);
});
