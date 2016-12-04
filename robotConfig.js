// Below is some information about which pins control which servos (aka joints).
// Note that the Arduino board is a Due,
// Courtesy of anykeynl (http://forum.7bot.cc/read.php?1,6,6#msg-6).
// Axis 1; Readout = A0 ; ServoControl D2
// Axis 2; Readout = A1 ; ServoControl D3
// Axis 3; Readout = A2 ; ServoControl D4
// Axis 4; Readout = A3 ; ServoControl D5
// Axis 5; Readout = A4 ; ServoControl D6
// Axis 6; Readout = A5 ; ServoControl D7
// Axis 7; Readout = A6 ; ServoControl D8
// Pomp Valve; Control D10 ; Low means open (suction); High closed (no suction)
// Pomp motor; Control D11 ; High is on; Low is off
// Beep; Control D12 ; High is very irritating noise, Low is peace
// Left Button; Readout D71
// Right Button; Readout D70

module.exports = {
  devices: {
    joints: [
      {
        name: 'joint0',
        pin: 2,
        range: [20, 160]
      },

      {
        name: 'joint1',
        pin: 3,
        range: [20, 160]
      },

      {
        name: 'joint2',
        pin: 4,
        range: [20, 160]
      },

      {
        name: 'joint3',
        pin: 5,
        range: [20, 160]
      },

      {
        name: 'joint4',
        pin: 6,
        range: [20, 160]
      },

      {
        name: 'joint5',
        pin: 7,
        range: [20, 160]
      }
    ]
  }

  //   jointsensor0: { driver: 'analogSensor', pin: 0, lowerLimit: 100, upperLimit: 900 },
  //   jointsensor1: { driver: 'analogSensor', pin: 1, lowerLimit: 100, upperLimit: 900 },
  //   jointsensor2: { driver: 'analogSensor', pin: 2, lowerLimit: 100, upperLimit: 900 },
  //   jointsensor3: { driver: 'analogSensor', pin: 3, lowerLimit: 100, upperLimit: 900 },
  //   jointsensor4: { driver: 'analogSensor', pin: 4, lowerLimit: 100, upperLimit: 900 },
  //   jointsensor5: { driver: 'analogSensor', pin: 5, lowerLimit: 100, upperLimit: 900 },
  //   pumpvalve: { driver: 'led', pin: 10 },
  //   pumpmotor: { driver: 'led', pin: 11 },
  // },
}
