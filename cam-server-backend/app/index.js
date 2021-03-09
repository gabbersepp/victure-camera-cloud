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

function writeState(state) {
    fs.writeFileSync("state/state.json", JSON.stringify(state));
}

async function fetchAllStreams() {
    while (true) {
        const state = JSON.parse(fs.readFileSync("state/state.json").toString());
        const cams = Object.keys(state)

        cams.forEach(camKey => {
            const cam = state[camKey]
            if (cam.closed) {
                return;
            }
            const staticCamObj = camDict[cam.name] || { ...cam };
            camDict[cam.name] = staticCamObj;

            if (staticCamObj.process) {
                if (staticCamObj.processEnded) {
                    staticCamObj.process = createProcess(staticCamObj, 300);
                    staticCamObj.processEnded = false;
                    cam.startCounter++;
                    writeState(state);
                }
            } else {
                staticCamObj.process = createProcess(staticCamObj, 300);
                cam.startCounter = 1;
                writeState(state);
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

    const targetPath = `${config.dataDir}/${name}.mpeg`;
    const cmd = ["--intf", "dummy", "-vvv", url, "--sout", `#std{access=file,mux=ts,dst='${targetPath}'}`, "vlc://quit"];
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
        deleteIfNoContent(targetPath);
    })

    pr.on("exit", () => {
        cam.processEnded = true
        deleteIfNoContent(targetPath);
    })

    setTimeout(() => {
        pr.kill("SIGKILL")
    }, durationSeconds * 1000)

    setTimeout(() => handleFileSize(targetPath, pr), 10000);

    return pr;
}

function getFileSize(targetPath) {
    return fs.statSync(targetPath).size;
}

function deleteIfNoContent(targetPath) {
    if (fs.existsSync(targetPath) && getFileSize(targetPath) === 0) {
        console.error(`deleted '${targetPath}'. no content found`);
        fs.unlinkSync(targetPath);
    }
}

function handleFileSize(targetPath, proc) {
    const size = getFileSize(targetPath);
    console.log(`file size 10 seconds after start: ${size}`);

    if (size === 0) {
        console.error(`File ${targetPath} does not contain content. Maybe there is some failure. KIlling process`);
        proc.kill("SIGKILL");
    }
}

fetchAllStreams()