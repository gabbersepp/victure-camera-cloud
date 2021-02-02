// read from /app/config.json
// map /app/data
const fs = require("fs");
const child_process = require("child_process");

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

const camDict = {};

async function fetchAllStreams() {
    while (true) {
        const config = JSON.parse(fs.readFileSync("config/config.json").toString());
        const cams = config.cameras;

        cams.forEach(cam => {
            const staticCamObj = camDict[cam.name] || cam;
            camDict[cam.name] = staticCamObj;

            if (staticCamObj.process) {
                if (staticCamObj.processEnded) {
                    staticCamObj.process = createProcess(staticCamObj, 300);
                    staticCamObj.processEnded = false;
                }
            } else {
                staticCamObj.process = createProcess(staticCamObj, 300);
            }
        })

        await sleep(5000);
    }
}

function writeDebugLog(msg) {
    const config = JSON.parse(fs.readFileSync("config/config.json").toString());
    fs.appendFileSync(`${config.dataDir}/log.txt`, msg + "\r\n")
}

function createProcess(cam, durationSeconds) {
    const date = new Date();
    let { name, url } = cam;
    console.log(`create new process for ${name}`)

    name = (name + "-" + date.toISOString()).replace(/[: ]/g, "-")
    const cmd = `vlc --intf dummy -vvv ${url} --run-time=${durationSeconds} --stop-time=${durationSeconds} --sout=file/avi:/app/data/${name}.avi vlc://quit`;
    console.log("#######\r\nexecute command:\r\n\t" + cmd)
    
    const pr = child_process.exec(cmd);

    pr.stdout.on('data', data => {
        writeDebugLog(data.toString()); 
    });

    pr.stderr.on('data', data => {
        writeDebugLog(data.toString()); 
    });

    pr.on("close", () => {
        cam.processEnded = true
    })

    pr.on("exit", () => {
        cam.processEnded = true
    })

    return pr;
}

fetchAllStreams()