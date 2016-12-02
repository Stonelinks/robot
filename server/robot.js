

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

import  robotConfig from '../robotConfig'

// import five from 'johnny-five'

// mock
const five = {
  Servo: function(config) {
    this.value = 0
    const _move = (ms) => {
      console.log('servo', config.name, 'move', ms);
      this.value = ms
    }

    this.center = _move
    this.to = _move

    return this
  },
  Board: function() {
    this.on = (_, cb) => {
      cb()
    }
    return this
  }
}

const SERVO_MOVE_DURATION_MS = process.env.SERVO_MOVE_DURATION_MS || 500

class Joint {
  constructor (jointConfig) {
    this.name = jointConfig.name
    this.servo = new five.Servo(jointConfig)
    this.servo.center(SERVO_MOVE_DURATION_MS)
    this.angle = this.servo.value
    console.log('joint initialized', jointConfig);
  }

  toJSON () {
    return {
      name: this.name,
      angle: this.angle
    }
  }

  moveServo (angle) {
    this.angle = parseInt(angle, 10)
    this.servo.to(angle, SERVO_MOVE_DURATION_MS)
  }

  onSocketConnect (socket) {
    socket.on(`${this.name}:servo`, (angle) => {
      this.moveServo(parseFloat(angle))
      socket.broadcast.send(`${this.name}:servo`, this.angle)
    })
  }
}

class Robot {
  constructor () {
    this.joints = robotConfig.devices.joints.map(this.createJoint)
    console.log('robot initialized');
  }

  createJoint (jointConfig) {
    return new Joint(jointConfig)
  }

  forEachJoint (cb) {
    this.joints.forEach((joint) => {
      cb(joint)
    })
  }

  toJSON () {
    const jointData = {}
    this.forEachJoint((joint) => {
      jointData[joint.name] = joint.toJSON()
    })
    return {
      joints: jointData
    }
  }

  onSocketConnect (socket) {
    this.forEachJoint((joint) => {
      joint.onSocketConnect(socket)
    })
  }
}

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


export default function (app, wss) {

  const board = new five.Board({
    repl: false
  })

  board.on('ready', () => {
    const robot = new Robot()
    wss.on('connection', (socket) => {
      socket.broadcast = function() {
        wss.clients.forEach(function each(client) {
  if (client !== socket)
  {
    client.send(data);
  }
});
      }
      robot.onSocketConnect(socket)
      socket.on('sync', () => {
        socket.emit('sync', robot.toJSON())
      })
      socket.on('disconnect', () => {
        robot.onSocketDisconnect(socket)
      })
    })
  })
}
