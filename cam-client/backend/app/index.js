const fs = require("fs");
const express = require("express")
const date = require("date-and-time")
const cors = require('cors')
const utils = require("./utils.js");
const converter = require("./converter.js");
const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const c = utils.getConfig();
const port = c.port;
const dataPath = c.path

const queue = []

app.get("/cameras", (req, res) => {
  const config = utils.getConfig();
  res.send(config.cameras)
});

app.post("/camera", (req, res) => {
  const config = utils.getConfig();
  if (!req.body || req.body === "") {
    res.sendStatus(400);
    return;
  }

  config.cameras = config.cameras.filter(c => req.body.name !== c.name)
  config.cameras.push(req.body);
  utils.writeConfig(config);
  res.sendStatus(200);
})

app.delete("/camera/:name", (req, res) => {
  const config = utils.getConfig();
  if (!req.params.name || req.params.name === "") {
    res.sendStatus(400);
    return;
  }

  config.cameras = config.cameras.filter(c => req.params.name !== c.name)
  utils.writeConfig(config);
  res.sendStatus(200);
})

app.get("/thumbnail/:video", async (req, res) => {
  const config = utils.getConfig();
  if (!req.params.video) {
    res.sendStatus(400);
    return;
  }

  const thumnailPath = await converter.ensureThumbnail(queue, dataPath, req.params.video, dataPath + "/thumbnail")
  res.sendFile(thumnailPath);
})

app.get("/list/:page", (req, res) => {
  const config = utils.getConfig();
  const files = fs.readdirSync(dataPath);
  let sorted = files.map(f => {
    // this ensures that *_original videos are never read
    const matches = f.match(/(.*)-([0-9]{4}.*)\.[0-9]{3}Z\./);
    if (!matches || matches.length < 3) {
      // filter out already converted videos
      return null;
    }
      const dateStr = matches[2]
      const cameraName = matches[1]
      return [`${f}`, date.parse(dateStr, "YYYY-MM-DDTHH-mm-ss", true), cameraName]
  })
  .filter(x => x)
  .sort((a, b) => b[1].getTime() - a[1].getTime())
  .map(f => {
      return {
          path: f[0],
          cameraName: f[2],
          date: f[1]
      }
  });

  /*const dict = {};
  sorted.forEach(s => {
    const list = dict[s.cameraName] || [];
    dict[s.cameraName] = list;
    list.push(s);
  })*/

  // used to enable endless scrolling on client
  const page = (req.params.page || 1) - 1;
  sorted = sorted.slice(page * 10, page * 10 + 10)
  res.send(sorted)
})

app.get("/file/:video", async (req, res) => {
  const config = utils.getConfig();
  if (!req.params.video) {
    res.sendStatus(400);
    return;
  }

  const videoName = req.params.video;
  const videoPath = dataPath + "/" + videoName;

  await converter.ensureConvertedFile(videoPath);

  const stat = fs.statSync(videoPath)
  const fileSize = stat.size
  const range = req.headers.range
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1
    const chunksize = (end-start)+1
    const file = fs.createReadStream(videoPath, {start, end})
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4; codecs="avc1.4d002a"'
    }
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    }

    res.writeHead(200, head)
    fs.createReadStream(videoPath).pipe(res)
  }
})

app.get("/state", (req, res) => {
  if (!fs.existsSync(statePath)) {
      res.statusMessage("state file not found")
      return;
  }

  var obj = JSON.parse((fs.readFileSync("state/state.json").toString()));
  res.json(obj)
})

app.get('*', (req, res) => {
  const url = req.originalUrl
  const msg = `got unmatched route: ${url}`
  console.log(msg)
  res.send(msg)
})

app.post('*', (req, res) => {
  const url = req.originalUrl
  const msg = `got unmatched route: ${url}`
  console.log(msg)
  res.send(msg)
})

app.listen(port, () => console.log("listen on port " + port))