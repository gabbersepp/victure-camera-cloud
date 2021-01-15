const fs = require("fs");

function getConfig() {
    return JSON.parse(fs.readFileSync("config/config.json").toString())
}

function writeConfig(config) {
    fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4))
}

module.exports = {
    getConfig,
    writeConfig
}