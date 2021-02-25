const fs = require("fs");
const child_process = require("child_process");

/**
 * Does the converted file already exist?
 * This is determined based on the filename.
 * If a video is requested, the specified one is converted and saved under the original filename
 * The original video gets renamed to *_original
 * @param {*} filePath 
 */
async function ensureConvertedFile(filePath) {
    const extensionSplitterIndex = filePath.lastIndexOf(".");
    const extension = filePath.substr(extensionSplitterIndex + 1, 10);

    const originalName = `${filePath.substr(0, extensionSplitterIndex)}_original.${extension}`;
    if (!fs.existsSync(originalName)) {
        fs.renameSync(filePath, originalName)
        const cmd = `vlc --intf dummy ${originalName} :sout=#transcode{vcodec=h264,acodec=mpga,ab=128,channels=2,samplerate=44100,scodec=none}:std{access=file{no-overwrite},mux=mp4,dst='${filePath}'} vlc://quit`;
        await createProcess(cmd)
    }
}

/**
 * Ensure that a thumbnail exists
 * Create a new one otherwise
 * @param {*} videoContainingDir 
 * @param {*} videoName 
 * @param {*} thumbnailContainingDir 
 */
async function ensureThumbnail(queue, videoContainingDir, videoName, thumbnailContainingDir) {
    if (!fs.existsSync(thumbnailContainingDir)) {
        fs.mkdirSync(thumbnailContainingDir);
    }
    const tempDirName = `${thumbnailContainingDir}/${videoName}_dir`;
    const thumbnailPath = `${thumbnailContainingDir}/${videoName}.png`
    const videoPath = `${videoContainingDir}/${videoName}`

    if (!fs.existsSync(thumbnailPath)) {
        if (!fs.existsSync(tempDirName)) {
            fs.mkdirSync(tempDirName);
        }

        const nextId = new Date().getTime();
        queue.push(nextId);
        let tryCount = 0;

        while (true) {
            try {
                if (queue[0] === nextId) {
                    // this will create multiple snapshots
                    const cmd = `vlc ${videoPath} --intf dummy --video-filter=scene --start-time=0 --stop-time=3 --scene-ratio=8 --scene-path="${tempDirName}" --vout=dummy --avcodec-hw=none vlc://quit`;
                    await createProcess(cmd);
    
                    // there may be multiple snapshots, take the first one
                    const firstImg = fs.readdirSync(tempDirName)[0]

                    if (firstImg || tryCount++ > 5) {
                        fs.copyFileSync(tempDirName + "/" + firstImg, thumbnailPath)
                        fs.rmdirSync(tempDirName, { recursive: true, force: true })
                        
                        queue.splice(0, 1);
                        return thumbnailPath;
                    } else {
                        // requeue
                        console.log("###retry " + videoName)
                        queue.splice(0, 1);
                        queue.push(nextId);
                    }
                } else {
                    await sleep(200);
                }
            } catch (e) {
                queue.splice(0, 1);
                console.log(`####error: ${e}`)
            }
        }
    }

    return thumbnailPath;
}


function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

function createProcess(cmd) {
    return new Promise((resolve) => {
       console.log("#######\r\nexecute command:\r\n\t" + cmd)
        let processEnded = false;
        const pr =  child_process.exec(cmd);
    
        pr.stdout.on('data', data => {
            console.log(data.toString()); 
        });
    
        pr.stderr.on('data', data => {
            console.log(data.toString()); 
        });
    
        pr.on("close", () => {
            if (!processEnded) {
                processEnded = true;
                resolve()
            }
        })
    
        pr.on("exit", () => {
            if (!processEnded) {
                processEnded = true;
                resolve()
            }
        })
    
        return pr;
    })
}

module.exports = {
    ensureConvertedFile,
    ensureThumbnail
}