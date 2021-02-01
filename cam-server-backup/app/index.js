const fs = require("fs");

// specify EXCLUDEn to exclude files
// e.g. EXCLUDE0=abc.txt

const env = process.env;
const toExclude = Object.keys(env).filter(key => key.indexOf("EXCLUDE") > -1).map(key => env[key]);

function getConfig() {
    return JSON.parse(fs.readFileSync("config/config.json").toString())
}

function groupBy(list, keyFn) {
    const obj = {}
    list.forEach(l => {
        const key = keyFn(l);
        const list = obj[key] || [];
        obj[key] = list;
        list.push(l);
    })
    return obj;
}

function getVideoName(f) {
    const matches = f.match(/(.*)-([0-9]{4}.*)\.[0-9]{3}Z\./);

    if (!matches || matches.length < 3) {
      // filter out already converted videos
      return null;
    }

    const cameraName = matches[1]
    return cameraName;
}

const dataDir = getConfig().dataDir;
const backupDir = getConfig().backupDir;

let files = fs.readdirSync(dataDir)
    .filter(file => !toExclude.find(te => file.indexOf(te) > -1))
    .map(file => ({ file, date: fs.statSync(`${dataDir}/${file}`).ctime }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(x => x.file);

    const dict = groupBy(files, x => getVideoName(x));
    files = [];
    Object.keys(dict).map(key => files.push(...dict[key].filter(x => x).slice(2, dict[key].length)))

    files.forEach(file => {
        const backupPath = `${backupDir}/${file}`
        const dataPath = `${dataDir}/${file}`;
        try {
            fs.copyFileSync(dataPath, backupPath)
            fs.unlinkSync(dataPath);
        } catch (e) {
            console.error(`seems like file ${dataPath} is already gone`)
            console.log(e)
        }
    })