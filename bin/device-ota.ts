const $ = require("shelljs");
const { getDevices } = require("./device-list.ts");

getDevices().forEach(({ deviceName, ip, port }) => {
  console.log(`flashing ota ${deviceName}`);
  $.exec(`esp-ota-wrapper ${ip} ${port}`);
});
