const fs = require("fs");
const child_process = require("child_process");

async function ensureConvertedFile(filePath) {
    const extensionSplitterIndex = filePath.lastIndexOf(".");
    const extension = filePath.substr(extensionSplitterIndex + 1, 10);

    const originalName = `${filePath.substr(0, extensionSplitterIndex)}_original.${extension}`;
    if (!fs.existsSync(originalName)) {
        fs.renameSync(filePath, originalName)
        // convert
        await createProcess(filePath, originalName)
    }
}

async function ensureThumbnail(videoContainingDir, videoName, thumbnailContainingDir) {
    const extensionSplitterIndex = videoName.lastIndexOf(".");
    const thumbnailName = `${videoName.substr(0, extensionSplitterIndex)}.png`;

    const tempDirName = `${thumbnailContainingDir}/${videoName}_dir`;
    const thumbnailPath = `${thumbnailContainingDir}/${videoName}.png`
    const videoPath = `${videoContainingDir}/${videoName}`

    if (!fs.existsSync(thumbnailPath)) {
        return new Promise((resolve) => {
            if (!fs.existsSync(tempDirName)) {
                fs.mkdirSync(tempDirName);
            }

            const cmd = `vlc ${videoPath} --intf dummy --video-filter=scene --start-time=0 --stop-time=1 --scene-ratio=8 --scene-path="${tempDirName}" --vout=dummy --avcodec-hw=none vlc://quit`;
            console.log("#######\r\nexecute command:\r\n\t" + cmd)

            let processEnded = false;
            const pr =  child_process.exec(cmd);
        
            pr.stdout.on('data', data => {
                console.log(data.toString()); 
            });
        
            pr.stderr.on('data', data => {
                console.log(data.toString()); 
            });

            function finish() {
                if (!processEnded) {
                    const firstImg = fs.readdirSync(tempDirName)[0]
                    fs.copyFileSync(tempDirName + "/" + firstImg, thumbnailPath)
                    fs.rmdirSync(tempDirName, { recursive: true, force: true })
                    resolve(thumbnailPath)
                    processEnded = true;
                }
            }
        
            pr.on("close", () => {
                finish()
            })
        
            pr.on("exit", () => {
                finish()
            })
        
            return pr;
        })
    }

    return new Promise(resolve => resolve(thumbnailPath));
}

function createProcess(filePath, originalName) {
    return new Promise((resolve) => {
        const cmd = `vlc --intf dummy ${originalName} :sout=#transcode{vcodec=h264,acodec=mpga,ab=128,channels=2,samplerate=44100,scodec=none}:std{access=file{no-overwrite},mux=mp4,dst='${filePath}'} vlc://quit`;
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