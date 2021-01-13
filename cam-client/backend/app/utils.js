const fs = require("fs");

function getConfig() {
    return JSON.parse(fs.readFileSync("config.json").toString())
}

module.exports = {
    getConfig
}