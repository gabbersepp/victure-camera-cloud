const fs = require("fs");

function getConfig() {
    return JSON.parse(fs.readFileSync("config/config.json").toString())
}

module.exports = {
    getConfig
}