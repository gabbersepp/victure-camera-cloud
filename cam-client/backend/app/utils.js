const fs = require("fs");

function getConfig() {
    return JSON.parse(fs.readFileSync("config/config.json").toString())
}

function writeConfig(config) {
    fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4))
}

function getState() {
    if (fs.existsSync("state/state.json")) {
        return JSON.parse(fs.readFileSync("state/state.json").toString())
    }

    return {}
}

module.exports = {
    getConfig,
    writeConfig,
    getState
}