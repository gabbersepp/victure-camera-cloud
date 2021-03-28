const fs = require("fs");
const child_process = require("child_process");

const statePath = "state/state.json";
let lastSuccessfulState = {};

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

function getState() {
    let state = lastSuccessfulState;
    let json = "not read yet";

    try {
        json = fs.readFileSync(statePath).toString();
        state = JSON.parse(json);
    } catch (e) {
        console.error(`error: ${e} - json: ${json}`);
        fs.writeFileSync(statePath, JSON.stringify(state));
    }

    return state;
}

async function fetchAllStreams() {

    while (true) {
        const state = getState();
        console.info(`state: ${JSON.stringify(state)}`);

        const config = JSON.parse(fs.readFileSync("config/config.json").toString());
        const cams = config.cameras;
        const sdpHost = config.publicSdpHost;
        const firstOpenPort = config.firstOpenPort;
        const lastOpenPort = config.lastOpenPort;

        if (cams.length > (lastOpenPort - firstOpenPort)/2) {
            console.error("Not enough open ports available")
            throw new Error("Not enough open ports available")
        }

        const freePorts = getFreePorts(firstOpenPort, lastOpenPort)

        console.info(`free ports: ${freePorts}`);

        cams.forEach(cam => {
            const staticCamObj = camDict[cam.name] || cam;
            camDict[cam.name] = staticCamObj;

            if (!staticCamObj.camPort) {
                staticCamObj.camPort = freePorts[0];
                staticCamObj.sdpPort = freePorts[1];
                freePorts.splice(0, 2)
            }

            console.info(`csam obj: ${JSON.stringify( { ...staticCamObj, process: null, timeoutId: null })}`);

            if (staticCamObj.process) {
                if (!staticCamObj.processEnded && state[cam.name] && state[cam.name].startCounter > 10) {
                    console.error(`startCounter has reached it's limit. restart process for ${cam.name}`);
                    staticCamObj.process.kill("SIGKILL");
                } else if (staticCamObj.processEnded) {
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
    const logPath = `${config.dataDir}/log_proxy.txt`
    fs.appendFileSync(logPath, msg + "\r\n")
}

function writeCurrentState(cam) {
    if (!fs.existsSync(statePath)) {
        fs.writeFileSync(statePath, "{}")
    }

    const state = JSON.parse(fs.readFileSync(statePath).toString())
    state[cam.name] = {
        url: cam.sdpUrl,
        name: cam.name,
        closed: cam.closed
    }

    fs.writeFileSync(statePath, JSON.stringify(state))
    lastSuccessfulState = state;
}

function createProcess(cam, sdpHost) {
    cam.closed = true;
    let { name, url, camPort, sdpPort } = cam;
    console.log(`create new process for ${name}`)

    const sdpUrl = `rtsp://${sdpHost}:${sdpPort}/${name.replace(" ", "")}`
    cam.sdpUrl = sdpUrl
    const cmd = ["--intf", "dummy", "-vvv", url, "--rtsp-host", sdpHost, `:sout=#transcode{acodec=aac,channels=2}:rtp{sdp=${sdpUrl}}` ,":sout-all", `:sout-keep`, "vlc://quit"];
    console.log("#######\r\nexecute command:\r\n\t" + cmd)
    
    const pr = child_process.spawn("vlc", cmd);

    // allow access to camera after 10 seconds of execution to ensure that stream is stable
    cam.timeoutId = setTimeout(() => {
        cam.closed = false;
        writeCurrentState(cam)
    }, 15000)

    pr.stdout.on('data', data => {
        writeDebugLog(data.toString()); 
    });

    pr.stderr.on('data', data => {
        writeDebugLog(data.toString()); 
    });

    pr.on("close", () => {
        cam.closed = true
        console.log("close")
        cam.processEnded = true
        clearTimeout(cam.timeoutId);
        cam.timeoutId = null;
        cam.startCounter = 0;
        writeCurrentState(cam)
    })

    pr.on("exit", () => {
        cam.closed = true
        console.log("exit")
        cam.processEnded = true
        clearTimeout(cam.timeoutId);
        cam.timeoutId = null;
        cam.startCounter = 0;
        writeCurrentState(cam)
    })

    writeCurrentState(cam)

    return pr;
}

fetchAllStreams();

