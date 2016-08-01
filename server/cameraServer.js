'use strict'; // eslint-disable-line

const cam = require('linuxcam');
const Jpeg = require('libjpeg').Jpeg; // eslint-disable-line
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const cameraLogger = require('./logger').camera;

const DEVICE = process.env.VIDEO_DEVICE || '/dev/video0';
const CAPTURE_INTERVAL_MS = process.env.VIDEO_CAPTURE_INTERVAL_MS || 120;

function Camera() {
  EventEmitter.call(this);
  this.start();
}
inherits(Camera, EventEmitter);

Camera.prototype.start = function () {
  cam.start(DEVICE, 620, 480);
  setInterval(this.captureFrame.bind(this), CAPTURE_INTERVAL_MS);
  cameraLogger.start(DEVICE);
};

Camera.prototype.captureFrame = function () {
  const frame = cam.frame();
  const jpeg = new Jpeg(frame.data, frame.width, frame.height, 'rgb');
  this.emit('frame', jpeg.encodeSync().toString('base64'));
};

module.exports = {
  start: (app) => {
    const camera = new Camera();
    app.io.on('connection', (socket) => {
      const sendFrame = function (frame) {
        socket.emit('frame', { frame });
      };
      camera.addListener('frame', sendFrame);
      socket.on('disconnect', () => {
        camera.removeListener('frame', sendFrame);
      });
    });
  },
};
