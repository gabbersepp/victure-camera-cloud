const fs = require("fs");

// specify EXCLUDEn to exclude files
// e.g. EXCLUDE0=abc.txt

const env = process.env;
const toExclude = Object.keys(env).filter(key => key.indexOf("EXCLUDE") > -1).map(key => env[key]);

const files = fs.readdirSync("/app/data");
files 
    .filter(file => !toExclude.find(te => file.indexOf(te) > -1))
    .forEach(file => {
    const backupPath = `/app/backup/${file}`
    const dataPath = `/app/data/${file}`;
    try {
        fs.copyFileSync(dataPath, backupPath)
        fs.rmSync(dataPath);
    } catch (e) {
        console.error(`seems like file ${dataPath} is already gone`)
    }
})