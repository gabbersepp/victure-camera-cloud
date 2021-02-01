const { readFileSync, unlinkSync, readdirSync, statSync, fstat } = require('fs')
const { execSync } = require("child_process");
const { exit } = require('process');
const os = require('os');

// specify EXCLUDEn to exclude files
// e.g. EXCLUDE0=abc.txt

let maxSize = process.env.MAX_SIZE_MB || getConfig().maxSizeMb;
if (!maxSize) {
    console.error("MAX_SIZE_MB env variable does not exist")
    exit(1);
}

let oneTime = process.env.ONE_TIME;

if (oneTime) {
    console.log("execute memory sidecar once")
}

maxSize = parseInt(maxSize);

function getConfig() {
    return JSON.parse(readFileSync("config/config.json").toString())
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function getSizeLinux() {
    execSync(`du -s ${getConfig().dataDir} > du.txt`);
    const output = readFileSync('du.txt').toString();
    console.log(output);
    let space = output.match(/[0-9]+/)[0]
    return space / 1024
}

function getSizeWindows() {
    // no easy command :-(
    const dataDir = getConfig().dataDir
    return readdirSync(dataDir).map(f => {
        return statSync(`${dataDir}/${f}`).size
    }).reduce((x, y) => x + y) / (1024 * 1024)
}

function getSize() {
    if (os.platform() === "win32") {
        return getSizeWindows()
    }

    return getSizeLinux();
}

async function work() {
    const dataDir = getConfig().dataDir;
    const env = process.env;
    const toExclude = Object.keys(env).filter(key => key.indexOf("EXCLUDE") > -1).map(key => env[key]);
    console.log(toExclude)
    
    do {
        while (getSize() > maxSize) {
            console.log(`taken: ${getSize()}, allowed: ${maxSize}`)
            const orderByDate = readdirSync(dataDir)
            .filter(file => !toExclude.find(te => file.indexOf(te) > -1))
            .map(f => {
                f = `${dataDir}/${f}`
                const stats = statSync(f);
                return [f, stats.ctime];
            })
            .sort((a, b) => {
                return a[1].getTime() - b[1].getTime()
            });

            if (orderByDate.length > 0) {
                console.log(`delete: ${orderByDate[0][0]}, date: ${orderByDate[0][1]}`)
                unlinkSync(orderByDate[0][0]);
            }
        }

        if (!oneTime) {
            await sleep(10000)
        }
    } while (!oneTime)
}

work();