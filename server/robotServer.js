'use strict';

/*
Below is some information about which pins control which servos (aka joints).
Note that the Arduino board is a Due,
Courtesy of anykeynl (http://forum.7bot.cc/read.php?1,6,6#msg-6).
Axis 1; Readout = A0 ; ServoControl D2
Axis 2; Readout = A1 ; ServoControl D3
Axis 3; Readout = A2 ; ServoControl D4
Axis 4; Readout = A3 ; ServoControl D5
Axis 5; Readout = A4 ; ServoControl D6
Axis 6; Readout = A5 ; ServoControl D7
Axis 7; Readout = A6 ; ServoControl D8
Pomp Valve; Control D10 ; Low means open (suction); High closed (no suction)
Pomp motor; Control D11 ; High is on; Low is off
Beep; Control D12 ; High is very irritating noise, Low is peace
Left Button; Readout D71
Right Button; Readout D70
*/

const robotConfig = require('../robotConfig');
const robotLogger = require('./logger').robot;

const five = require('johnny-five');

class Joint {
  constructor(jointConfig) {
    this.name = jointConfig.name;
    this.servo = new five.Servo(jointConfig);
    robotLogger.jointInit(jointConfig);
  }

  onSocketConnect(socket) {
    socket.on(`${this.name}:servo`, (data) => {
      const servoPos = parseInt(data.value, 10);
      this.servo.to(servoPos);
      socket.broadcast.emit(`${this.name}:servo`, {
        value: servoPos,
      });
    });
  }
}

class Robot {
  constructor() {
    this.joints = robotConfig.devices.joints.map(this.createJoint);
    robotLogger.start();
  }

  createJoint(jointConfig) {
    return new Joint(jointConfig);
  }

  forEachJoint(cb) {
    this.joints.forEach((joint) => {
      cb(joint);
    });
  }

  mapJoints(cb) {
    return this.joints.map((joint) => cb(joint));
  }

  toJSON() {
    return {
      joints: this.mapJoints((joint) => joint.toJSON()),
    };
  }

  onSocketConnect(socket) {
    robotLogger.socketConnect(socket);
    this.forEachJoint((joint) => {
      joint.onSocketConnect(socket);
    });
  }

  onSocketDisconnect(socket) {
    robotLogger.socketDisconnect(socket);
  }
}

// const Cylon = require('cylon');
//
// Cylon.robot({
//
//   name: '7bot',
//
//   connections: {
//     arduino: { adaptor: 'firmata', port: '/dev/ttyACM0' },
//   },
//
//   devices: config.devices,
//
//   work: () => {
//     // interact with robot via socket API from the browser
//     // See: frontend/app/src/x-app.html
//   },
//
//   commands: () => { // eslint-disable-line arrow-body-style
//     return {
//       turn_pump_on: this.turnPumpOn,
//       turn_pump_off: this.turnPumpOff,
//     };
//   },
//
//   turnPumpOn: () => {
//     this.pumpmotor.turnOn();
//     this.pumpvalve.turnOff();
//   },
//
//   turnPumpOff: () => {
//     this.pumpmotor.turnOff();
//     this.pumpvalve.turnOn();
//     console.log('sup');
//   },
// });
//
//

module.exports = {
  start: (app) => {
    const board = new five.Board({
      repl: false,
    });

    board.on('ready', () => {
      const robot = new Robot();
      app.io.on('connection', (socket) => {
        robot.onSocketConnect(socket);
        socket.on('sync', () => {
          socket.emit('sync', robot.toJSON());
        });
        socket.on('disconnect', () => {
          robot.onSocketDisconnect(socket);
        });
      });
    });
  },
};
