const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const util = require("util");
const execPromise = util.promisify(exec);
const app = express();
const port = 3000;

const NodeCache = require("node-cache");
const myCache = new NodeCache();

const os = require("os");
const networkInterfaces = os.networkInterfaces();
const ip = networkInterfaces["Wi-Fi"][1].address;

app.use(bodyParser.json()); //body parserden json etmek ucun

const LINK = `http://${ip}:3000`; //burda ip-ni aliriq ve linki yaradiriq

const DOWNLOADS_FOLDER = path.join(__dirname, "downloads"); //downloads-i teyin edirik
if (!fs.existsSync(DOWNLOADS_FOLDER)) fs.mkdirSync(DOWNLOADS_FOLDER);

app.use("/videos", express.static(DOWNLOADS_FOLDER));

//express.static(download_folder) teyin edirem

app.post("/upload-video", async (req, res) => {
  const { url } = req.body;
  if (!url)
    return res.status(400).json({ error: "Video linki təqdim edilməyib" });

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(DOWNLOADS_FOLDER, fileName);
  const proxy = "your_proxy";
  //proxy_format http://padsokfaos:11111111@12.234.23.12:1233
  const command = `yt-dlp --no-playlist -f mp4 --proxy ${proxy} -o "${filePath}" "${url}"`;

  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(" stdout:", stdout);
    console.log("stderr:", stderr);
    console.log("Fayl uğurla yükləndi:", filePath);
    myCache.flushAll();

    //const localUrl = `http://192.168.100.54:${port}/videos/${fileName}`;
    const localUrl = `${LINK}/videos/${fileName}`;
    console.log(localUrl);
    return res.json({ url: localUrl, fileName });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "error", details: error.message });
  }
});

app.post("/delete-video", async (req, res) => {
  let { fileName } = req.body;

  if (!fileName)
    return res.status(400).json({ error: "please send file name" });

  const filePath = path.join(DOWNLOADS_FOLDER, fileName);

  fs.unlink(filePath, (err) => {
    //bunu then ile de etmek olardi lakin etmirik ele err bosdursa false olur be res json qaytarir
    if (err) {
      return res.status(500).json({ success: false, message: "not deleted" });
    }
    res.json({ success: true, message: "success" });
  });
});

app.listen(port, () => {
  console.log(`server is running`);
});
