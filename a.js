const os = require("os");
const networkInterfaces = os.networkInterfaces();
const ip = networkInterfaces["Wi-Fi"][1].address;
console.log(ip);
