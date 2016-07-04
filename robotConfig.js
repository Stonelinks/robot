module.exports = {
  devices: {
    joint0: {
      driver: 'servo',
      pin: 2,
      limits: {
        bottom: 20,
        top: 160,
      },
    },

    joint1: {
      driver: 'servo',
      pin: 3,
      limits: {
        bottom: 20,
        top: 160,
      },
    },

    joint2: {
      driver: 'servo',
      pin: 4,
      limits: {
        bottom: 20,
        top: 160,
      },
    },

    joint3: {
      driver: 'servo',
      pin: 5,
      limits: {
        bottom: 0,
        top: 160,
      },
    },

    joint4: {
      driver: 'servo',
      pin: 6,
      limits: {
        bottom: 20,
        top: 160,
      },
    },

    joint5: {
      driver: 'servo',
      pin: 7,
      limits: {
        bottom: 20,
        top: 160,
      },
    },

    jointsensor0: { driver: 'analogSensor', pin: 0, lowerLimit: 100, upperLimit: 900 },
    jointsensor1: { driver: 'analogSensor', pin: 1, lowerLimit: 100, upperLimit: 900 },
    jointsensor2: { driver: 'analogSensor', pin: 2, lowerLimit: 100, upperLimit: 900 },
    jointsensor3: { driver: 'analogSensor', pin: 3, lowerLimit: 100, upperLimit: 900 },
    jointsensor4: { driver: 'analogSensor', pin: 4, lowerLimit: 100, upperLimit: 900 },
    jointsensor5: { driver: 'analogSensor', pin: 5, lowerLimit: 100, upperLimit: 900 },
    pumpvalve: { driver: 'led', pin: 10 },
    pumpmotor: { driver: 'led', pin: 11 },
  },
};
