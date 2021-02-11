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
        const state = JSON.parse(fs.readFileSync("state/state.json").toString());
        const cams = Object.keys(state)

        cams.forEach(camKey => {
            const cam = state[camKey]
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
    const config = JSON.parse(fs.readFileSync("config/config.json").toString());
    const date = new Date();
    let { name, url } = cam;
    console.log(`create new process for ${name}`)

    name = (name + "-" + date.toISOString()).replace(/[: ]/g, "-")

    const cmd = ["--intf", "dummy", "-vvv", url, "--sout", `#std{access=file,mux=ts,dst='${config.dataDir}/${name}.mpeg'}`, "vlc://quit"];
    console.log("#######\r\nexecute command:\r\n\t" + cmd)
    const pr = child_process.spawn("vlc", cmd);

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

    setTimeout(() => {
        pr.kill("SIGKILL")
    }, durationSeconds * 1000)

    return pr;
}

fetchAllStreams()