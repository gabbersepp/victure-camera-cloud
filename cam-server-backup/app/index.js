const fs = require("fs");

const files = fs.readdirSync("/app/data");
files.forEach(file => {
    const backupPath = `/app/backup/${file}`
    const dataPath = `/app/data/${file}`;
    try {
        fs.copyFileSync(dataPath, backupPath)
        fs.rmSync(dataPath);
    } catch (e) {
        console.error(`seems like file ${dataPath} is already gone`)
    }
})