const os = require("os");
const $ = require("shelljs");

let devices = [];
export function getDevices() {
  return devices;
}

let r;
if (os.platform() === "darwin") {
  r = $.exec("dns-sd -B _arduino._tcp");
} else {
  r = $.exec('avahi-browse -ptr  "_arduino._tcp"');
}

for (const line of r.split("\n")) {
  if (line[0] === "=") {
    const deviceName = line.split(";")[3];
    const ip = line.split(";")[7];
    const port = line.split(";")[8];
    devices.push({
      deviceName,
      ip,
      port
    });
  }
}

console.log(JSON.stringify(devices, null, 2));
