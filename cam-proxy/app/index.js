const fs = require("fs");
const child_process = require("child_process");

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

const camDict = {};

function getFreePorts(firstOpenPort, lastOpenPort) {
    const allPorts = [];
    const usedPorts = [];
    Object.values(camDict).forEach(x => usedPorts.push(...[x.camPort, x.sdpPort]))
    for(let i = firstOpenPort; i <= lastOpenPort; i++) {
        allPorts.push(i);
    }
    return allPorts.filter(x => !usedPorts.find(y => y === x))
}

async function fetchAllStreams() {
    while (true) {
        const config = JSON.parse(fs.readFileSync("config/config.json").toString());
        const cams = config.cameras;
        const sdpHost = config.publicSdpHost;
        const firstOpenPort = config.firstOpenPort;
        const lastOpenPort = config.lastOpenPort;

        if (cams.length > (lastOpenPort - firstOpenPort)/2) {
            throw new Error("Not enough open ports available")
        }

        const freePorts = getFreePorts(firstOpenPort, lastOpenPort)

        cams.forEach(cam => {
            const staticCamObj = camDict[cam.name] || cam;
            camDict[cam.name] = staticCamObj;
            if (!staticCamObj.camPort) {
                staticCamObj.camPort = freePorts[0];
                staticCamObj.sdpPort = freePorts[1];
                freePorts.splice(0, 2)
            }

            if (staticCamObj.process) {
                if (staticCamObj.processEnded) {
                    staticCamObj.process = createProcess(staticCamObj, sdpHost);
                    staticCamObj.processEnded = false;
                }
            } else {
                staticCamObj.process = createProcess(staticCamObj, sdpHost);
            }
        })

        await sleep(100);
    }
}  

function writeDebugLog(msg) {
    const config = JSON.parse(fs.readFileSync("config/config.json").toString());
    const logPath = `${config.dataDir}/log.txt`
    fs.appendFileSync(logPath, msg + "\r\n")
}

function writeCurrentState(cam) {
    const statePath = "state/state.json";
    if (!fs.existsSync(statePath)) {
        fs.writeFileSync(statePath, "{}")
    }

    const state = JSON.parse(fs.readFileSync(statePath).toString())
    state[cam.name] = {
        url: cam.sdpUrl,
        name: cam.name
    }

    fs.writeFileSync(statePath, JSON.stringify(state))
}

function createProcess(cam, sdpHost) {
    let { name, url, camPort, sdpPort } = cam;
    console.log(`create new process for ${name}`)

    const sdpUrl = `rtsp://${sdpHost}:${sdpPort}/${name.replace(" ", "")}`
    cam.sdpUrl = sdpUrl
    const cmd = ["--intf", "dummy", "-vvv", url, `:sout=#transcode{acodec=aac,channels=2}:rtp{sdp=${sdpUrl}}` ,":sout-all", `:sout-keep`, "vlc://quit"];
    console.log("#######\r\nexecute command:\r\n\t" + cmd)
    
    const pr = child_process.spawn("vlc", cmd);

    pr.stdout.on('data', data => {
        writeDebugLog(data.toString()); 
    });

    pr.stderr.on('data', data => {
        writeDebugLog(data.toString()); 
    });

    pr.on("close", () => {
        console.log("close")
        cam.processEnded = true
    })

    pr.on("exit", () => {
        console.log("exit")
        cam.processEnded = true
    })

    writeCurrentState(cam)

    return pr;
}

fetchAllStreams();

