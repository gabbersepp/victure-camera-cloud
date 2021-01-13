const fs = require("fs");
const express = require("express")
const date = require("date-and-time")
const cors = require('cors')
const utils = require("./utils.js");
const converter = require("./converter.js");
const port = 81
const app = express();

app.use(cors())

const config = utils.getConfig();
const path = config.path

app.get("/thumbnail/:video", async (req, res) => {
  if (!req.params.video) {
    res.sendStatus(200);
  }
  const thumnailPath = await converter.ensureThumbnail(path, req.params.video, path + "/thumbnail")
  res.sendFile(thumnailPath);
})

app.get("/list/:page", (req, res) => {

    const files = fs.readdirSync(path);
    let sorted = files.map(f => {
      const matches = f.match(/([0-9]{4}.*)\.[0-9]{3}Z\./);
      if (!matches || matches.length < 2) {
        // filter out already converted videos
        return null;
      }
        const dateStr = matches[1]
        return [`${f}`, date.parse(dateStr, "YYYY-MM-DDTHH-mm-ss", true)]
    })
    .filter(x => x)
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(f => {
        return {
            path: f[0],
            date: f[1]
        }
    })

    const page = (req.params.page || 1) - 1;
    sorted = sorted.slice(page * 10, page * 10 + 10)
    res.send(sorted)
})

app.get("/file/:video", async (req, res) => {
    let url = req.url
    /*const fileMatches = url.match(/\/file\/(.*)/)

    if (!fileMatches || fileMatches.length < 2) {
        res.sendStatus(500);
        console.error(`filename could not be parsed from ${url}`)
        res.send("filename could not be parsed");
    }*/

    const videoName = req.params.video;//fileMatches[1];
    const videoPath = path + "/" + videoName;

    await converter.ensureConvertedFile(videoPath);

    const stat = fs.statSync(videoPath)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] 
        ? parseInt(parts[1], 10)
        : fileSize-1
      const chunksize = (end-start)+1
      const file = fs.createReadStream(videoPath, {start, end})
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4; codecs="avc1.4d002a"',
      }
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(200, head)
      fs.createReadStream(videoPath).pipe(res)
    }

})

app.listen(port, () => console.log("listen on port " + port))
//console.log(date.parse("Garage-2021-01-11T21-54-51.759Z.avi".match(/([0-9]{4}.*)\.[0-9]{3}Z/)[1], "YYYY-MM-DDTHH-mm-ss"))