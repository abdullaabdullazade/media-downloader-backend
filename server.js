const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const util = require("util");
const execPromise = util.promisify(exec);
const app = express();
const port = 3000;

app.use(bodyParser.json());

const DOWNLOADS_FOLDER = path.join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOADS_FOLDER)) fs.mkdirSync(DOWNLOADS_FOLDER);

app.use("/videos", express.static(DOWNLOADS_FOLDER));

app.post("/upload-video", async (req, res) => {
  const { url } = req.body;
  if (!url)
    return res.status(400).json({ error: "Video linki təqdim edilməyib" });

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(DOWNLOADS_FOLDER, fileName);

  const command = `yt-dlp --no-playlist -f mp4 -o "${filePath}" "${url}"`;

  try {
    const { stdout, stderr } = await execPromise(command);
    console.log("YT-DLP stdout:", stdout);
    console.log("YT-DLP stderr:", stderr);
    console.log("Fayl uğurla yükləndi:", filePath);

    const localUrl = `http://192.168.100.54:${port}/videos/${fileName}`;
    return res.json({ url: localUrl, fileName });
  } catch (error) {
    console.error("Video yüklənmə xətası:", error);
    return res
      .status(500)
      .json({ error: "Video yüklənmədi", details: error.message });
  }
});

app.post("/delete-video", async (req, res) => {
  let { fileName } = req.body;

  if (!fileName)
    return res.status(400).json({ error: "Fayl adı təqdim edilməyib" });

  const filePath = path.join(DOWNLOADS_FOLDER, fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Silinmədi" });
    }
    res.json({ success: true, message: "Video silindi" });
  });
});

app.listen(port, () => {
  console.log(`API http://localhost:${port} ünvanında işləyir`);
});
