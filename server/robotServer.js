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

var fs = require('fs');
var config = require('../robotConfig.js');

var Cylon = require('cylon');

Cylon.robot({

  name: '7bot',

  connections: {
    arduino: { adaptor: 'firmata', port: process.env.CYLON_PORT || '/dev/ttyACM0' },
  },

  devices: config.devices,

  work: function () {
    // interact with robot via socket API from the browser
    // See: frontend/app/src/x-app.html
  },

  commands: function () {
    return {
      turn_pump_on: this.turnPumpOn,
      turn_pump_off: this.turnPumpOff,
    };
  },

  turnPumpOn: function () {
    this.pumpmotor.turnOn();
    this.pumpvalve.turnOff();
  },

  turnPumpOff: function () {
    this.pumpmotor.turnOff();
    this.pumpvalve.turnOn();
    console.log('sup');
  },
});


module.exports = {
  start: function () {
    Cylon.api('socketio', {
      host: '0.0.0.0',
      port: process.env.CYLON_PORT || '3001',
    });

    Cylon.start();
  },
};
