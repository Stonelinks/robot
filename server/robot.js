
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

import robotConfig from '../robotConfig'

import five from 'johnny-five'

// // mock
// const five = {
//   Servo: function (config) {
//     this.value = 0
//     this.to = (ms) => {
//       console.log('servo', config.name, 'move', ms)
//       this.value = ms
//     }
//
//     return this
//   },
//   Board: function () {
//     this.on = (_, cb) => {
//       cb()
//     }
//     return this
//   }
// }

const SERVO_MOVE_DURATION_MS = process.env.SERVO_MOVE_DURATION_MS || 500

class Joint {
  constructor (jointConfig) {
    this.name = jointConfig.name
    this.servo = new five.Servo(jointConfig)
    console.log('joint initialized', jointConfig)
    this.angle = (jointConfig.range[1] - jointConfig.range[0]) / 2.0
    this.servo.to(this.angle, SERVO_MOVE_DURATION_MS)
  }

  // toJSON () {
  //   return {
  //     name: this.name,
  //     angle: this.angle
  //   }
  // }

  moveServo (angle) {
    this.angle = parseInt(angle, 10)
    this.servo.to(angle, SERVO_MOVE_DURATION_MS)
  }

  onWSConnect (ws) {
    ws.on('message', (data) => {
      const msg = JSON.parse(data)
      if (msg.name === this.name) {
        this.moveServo(parseFloat(msg.angle))
        ws.broadcast(data)
      }
    })

    ws.send(JSON.stringify({
      name: this.name,
      angle: this.angle
    }))
  }
}

class Robot {
  constructor () {
    this.joints = robotConfig.devices.joints.map(this.createJoint)
    console.log('robot initialized')
  }

  createJoint (jointConfig) {
    return new Joint(jointConfig)
  }

  forEachJoint (cb) {
    this.joints.forEach((joint) => {
      cb(joint)
    })
  }

  // toJSON () {
  //   const jointData = {}
  //   this.forEachJoint((joint) => {
  //     jointData[joint.name] = joint.toJSON()
  //   })
  //   return {
  //     joints: jointData
  //   }
  // }

  onWSConnect (ws) {
    this.forEachJoint((joint) => {
      joint.onWSConnect(ws)
    })
  }

  onWSDisconnect () {
    console.log('robot ws disconnect')
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
    wss.on('connection', (ws) => {
      ws.broadcast = function (data) {
        wss.clients.forEach((client) => {
          if (client !== ws) {
            client.send(data)
          }
        })
      }
      robot.onWSConnect(ws)

      ws.on('disconnect', () => {
        robot.onWSDisconnect(ws)
      })
    })
  })
}
