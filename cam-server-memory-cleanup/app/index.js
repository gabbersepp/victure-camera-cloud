const { readFileSync, unlinkSync, readdirSync, statSync, rmSync } = require('fs')
const { execSync } = require("child_process");
const { exit } = require('process');

// specify EXCLUDEn to exclude files
// e.g. EXCLUDE0=abc.txt

let maxSize = process.env.MAX_SIZE_MB;
if (!maxSize) {
    console.error("MAX_SIZE_MB env variable does not exist")
    exit(1);
}

let oneTime = process.env.ONE_TIME;

if (oneTime) {
    console.log("execute memory sidecar once")
}

maxSize = parseInt(maxSize);

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function getSize() {
    execSync('du -s /app/data > du.txt');
    const output = readFileSync('du.txt').toString();
    console.log(output);
    let space = output.match(/[0-9]+/)[0]
    return space / 1024
}

async function work() {
    const env = process.env;
    const toExclude = Object.keys(env).filter(key => key.indexOf("EXCLUDE") > -1).map(key => env[key]);

    do {
        //console.log(`space taken: ${space}`)

        while (getSize() > maxSize) {
            const orderByDate = readdirSync("/app/data")
            .filter(file => !toExclude.find(te => file.indexOf(te) > -1))
            .map(f => {
                f = `/app/data/${f}`
                const stats = statSync(f);
                return [f, stats.ctime];
            })
            .sort((a, b) => {
                return a[1].getTime() - b[1].getTime()
            });

            if (orderByDate.length > 0) {
                console.log(`delete: ${orderByDate[0][0]}, date: ${orderByDate[0][1]}`)
                rmSync(orderByDate[0][0]);
            }
        }

        if (!oneTime) {
            await sleep(10000)
        }
    } while (!oneTime)
}

work();