// read from /app/config.json
// map /app/data
const fs = require("fs");
const child_process = require("child_process");

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

async function fetchAllStreams() {
    while (true) {
        const cams = JSON.parse(fs.readFileSync("/app/config.json").toString());

        cams.forEach(cam => {
            if (cam.process) {
                if (cam.processEnded) {
                    cam.process = createProcess(cam, 300);
                    cam.processEnded = false;
                }
            } else {
                cam.process = createProcess(cam, 300);
            }
        })

        await sleep(5000);
    }
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
        console.log(data.toString()); 
    });

    pr.stderr.on('data', data => {
        console.log(data.toString()); 
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